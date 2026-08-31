import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import { escrowAccountsTable, escrowTransactionsTable, representationMilestonesTable, representationQuotesTable } from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import { assertEscrowCapacity, lockEscrowForMilestone } from "../lib/financialGuards";
import type { Request } from "express";

export type AllocateMilestoneResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 200; body: { ok: true; milestone: unknown; escrowAccount: unknown; transaction: unknown } }
  | { error: "milestone_not_found" | "forbidden" | "milestone_not_allocatable" | "escrow_account_not_found" | "insufficient_unallocated_funds" };

type AllocateMilestoneError = Extract<AllocateMilestoneResult, { error: string }>;
type AllocateMilestoneErrorCode = AllocateMilestoneError["error"];

/** Allocates the server-owned milestone amount atomically and idempotently. */
export async function allocateMilestone(req: Request, milestoneId: string, clientId: string): Promise<AllocateMilestoneResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, clientId);
    if (idempotency.replay) return idempotency;

    const persistError = async (error: AllocateMilestoneErrorCode, status: number): Promise<AllocateMilestoneResult> => {
      const body = { ok: false, error };
      await persistIdempotencyResponse(tx, req, clientId, status, body);
      return { error };
    };

    const locked = await lockEscrowForMilestone(tx, milestoneId);
    if (!locked) return persistError("milestone_not_found", 404);

    const [quote] = await tx.select().from(representationQuotesTable).where(eq(representationQuotesTable.id, locked.milestone.quoteId)).limit(1);
    if (!quote) return persistError("milestone_not_found", 404);
    if (quote.clientId !== clientId) return persistError("forbidden", 403);
    if (locked.milestone.status !== "funded") return persistError("milestone_not_allocatable", 409);

    const amount = locked.milestone.amount;
    if (!(await assertEscrowCapacity(tx, locked.escrow.id, amount))) return persistError("insufficient_unallocated_funds", 409);

    const now = new Date();
    const [updatedEscrow] = await tx
      .update(escrowAccountsTable)
      .set({ allocatedAmount: sql`${escrowAccountsTable.allocatedAmount} + ${amount}`, updatedAt: now })
      .where(eq(escrowAccountsTable.id, locked.escrow.id))
      .returning();
    if (!updatedEscrow) throw new Error("ESCROW_ALLOCATION_UPDATE_FAILED");

    const [transaction] = await tx.insert(escrowTransactionsTable).values({
      id: randomUUID(), escrowAccountId: locked.escrow.id, milestoneId: locked.milestone.id,
      type: "stage_allocation", status: "posted", amount, currency: quote.currency,
      reference: `milestone-allocation:${locked.milestone.id}`, createdBy: clientId, createdAt: now,
    }).returning();
    if (!transaction) throw new Error("ESCROW_ALLOCATION_TRANSACTION_FAILED");

    const [updatedMilestone] = await tx
      .update(representationMilestonesTable)
      .set({ status: "in_progress", startedAt: now, updatedAt: now })
      .where(and(eq(representationMilestonesTable.id, locked.milestone.id), eq(representationMilestonesTable.status, "funded")))
      .returning();
    if (!updatedMilestone) throw new Error("MILESTONE_ALLOCATION_TRANSITION_FAILED");

    const body = { ok: true as const, milestone: updatedMilestone, escrowAccount: updatedEscrow, transaction };
    await persistIdempotencyResponse(tx, req, clientId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}
