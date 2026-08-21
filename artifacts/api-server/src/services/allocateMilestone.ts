import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import {
  escrowAccountsTable,
  escrowTransactionsTable,
  representationMilestonesTable,
  representationQuotesTable,
} from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import type { Request } from "express";

export type AllocateMilestoneResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 200; body: { ok: true; milestone: unknown; escrowAccount: unknown; transaction: unknown } }
  | { error: "milestone_not_found" | "forbidden" | "milestone_not_allocatable" | "escrow_account_not_found" | "insufficient_unallocated_funds" };

/**
 * Allocates the server-owned milestone amount from escrow. No client-supplied
 * amount or currency is accepted. Allocation is the only transition from
 * funded -> in_progress and is atomic with its ledger entry.
 */
export async function allocateMilestone(
  req: Request,
  milestoneId: string,
  clientId: string,
): Promise<AllocateMilestoneResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, clientId);
    if (idempotency.replay) return idempotency;

    const [row] = await tx
      .select({
        milestone: representationMilestonesTable,
        quote: representationQuotesTable,
        escrow: escrowAccountsTable,
      })
      .from(representationMilestonesTable)
      .innerJoin(representationQuotesTable, eq(representationQuotesTable.id, representationMilestonesTable.quoteId))
      .innerJoin(escrowAccountsTable, eq(escrowAccountsTable.quoteId, representationQuotesTable.id))
      .where(eq(representationMilestonesTable.id, milestoneId))
      .limit(1)
      .for("update");

    if (!row) return { error: "milestone_not_found" };
    if (row.quote.clientId !== clientId) return { error: "forbidden" };
    if (row.milestone.status !== "funded") return { error: "milestone_not_allocatable" };
    if (!row.escrow) return { error: "escrow_account_not_found" };

    const amount = row.milestone.amount;
    const [updatedEscrow] = await tx
      .update(escrowAccountsTable)
      .set({
        allocatedAmount: sql`${escrowAccountsTable.allocatedAmount} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(escrowAccountsTable.id, row.escrow.id),
        sql`${escrowAccountsTable.depositedAmount} - ${escrowAccountsTable.allocatedAmount} - ${escrowAccountsTable.releasedAmount} - ${escrowAccountsTable.refundedAmount} >= ${amount}`,
      ))
      .returning();

    if (!updatedEscrow) return { error: "insufficient_unallocated_funds" };

    const now = new Date();
    const [transaction] = await tx
      .insert(escrowTransactionsTable)
      .values({
        id: randomUUID(),
        escrowAccountId: row.escrow.id,
        milestoneId: row.milestone.id,
        type: "stage_allocation",
        status: "posted",
        amount,
        currency: row.quote.currency,
        reference: `milestone-allocation:${row.milestone.id}`,
        createdBy: clientId,
        createdAt: now,
      })
      .returning();

    if (!transaction) throw new Error("ESCROW_ALLOCATION_TRANSACTION_FAILED");

    const [updatedMilestone] = await tx
      .update(representationMilestonesTable)
      .set({ status: "in_progress", startedAt: now, updatedAt: now })
      .where(and(
        eq(representationMilestonesTable.id, row.milestone.id),
        eq(representationMilestonesTable.status, "funded"),
      ))
      .returning();

    if (!updatedMilestone) throw new Error("MILESTONE_ALLOCATION_TRANSITION_FAILED");

    const body = { ok: true as const, milestone: updatedMilestone, escrowAccount: updatedEscrow, transaction };
    await persistIdempotencyResponse(tx, req, clientId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}
