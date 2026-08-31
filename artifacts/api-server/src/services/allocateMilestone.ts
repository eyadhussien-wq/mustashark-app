import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import { escrowTransactionsTable, representationQuotesTable } from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import { assertEscrowCapacity, lockEscrowForMilestone } from "../lib/financialGuards";
import type { Request } from "express";

export type AllocateMilestoneResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 200; body: { ok: true; milestone: unknown; escrowAccount: unknown; transaction: unknown } }
  | { error: "milestone_not_found" | "forbidden" | "milestone_not_allocatable" | "escrow_account_not_found" | "insufficient_unallocated_funds" };

/** Allocates the server-owned milestone amount atomically and idempotently. */
export async function allocateMilestone(
  req: Request,
  milestoneId: string,
  clientId: string,
): Promise<AllocateMilestoneResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, clientId);
    if (idempotency.replay) return idempotency;

    const locked = await lockEscrowForMilestone(tx, milestoneId);
    if (!locked) return { error: "milestone_not_found" };

    const [quote] = await tx.select().from(representationQuotesTable).where(eq(representationQuotesTable.id, locked.milestone.quoteId)).limit(1);
    if (!quote) return { error: "milestone_not_found" };
    if (quote.clientId !== clientId) return { error: "forbidden" };
    if (locked.milestone.status !== "funded") return { error: "milestone_not_allocatable" };

    const amount = locked.milestone.amount;
    if (!(await assertEscrowCapacity(tx, locked.escrow.id, amount))) {
      return { error: "insufficient_unallocated_funds" };
    }

    const now = new Date();
    const [updatedEscrow] = await tx
      .update((await import("@workspace/db/schema")).escrowAccountsTable)
      .set({ allocatedAmount: sql`${(await import("@workspace/db/schema")).escrowAccountsTable.allocatedAmount} + ${amount}`, updatedAt: now })
      .where(eq((await import("@workspace/db/schema")).escrowAccountsTable.id, locked.escrow.id))
      .returning();
    if (!updatedEscrow) throw new Error("ESCROW_ALLOCATION_UPDATE_FAILED");

    const [transaction] = await tx.insert(escrowTransactionsTable).values({
      id: randomUUID(), escrowAccountId: locked.escrow.id, milestoneId: locked.milestone.id,
      type: "stage_allocation", status: "posted", amount, currency: quote.currency,
      reference: `milestone-allocation:${locked.milestone.id}`, createdBy: clientId, createdAt: now,
    }).returning();
    if (!transaction) throw new Error("ESCROW_ALLOCATION_TRANSACTION_FAILED");

    const [updatedMilestone] = await tx
      .update((await import("@workspace/db/schema")).representationMilestonesTable)
      .set({ status: "in_progress", startedAt: now, updatedAt: now })
      .where(and(eq((await import("@workspace/db/schema")).representationMilestonesTable.id, locked.milestone.id), eq((await import("@workspace/db/schema")).representationMilestonesTable.status, "funded")))
      .returning();
    if (!updatedMilestone) throw new Error("MILESTONE_ALLOCATION_TRANSITION_FAILED");

    const body = { ok: true as const, milestone: updatedMilestone, escrowAccount: updatedEscrow, transaction };
    await persistIdempotencyResponse(tx, req, clientId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}
