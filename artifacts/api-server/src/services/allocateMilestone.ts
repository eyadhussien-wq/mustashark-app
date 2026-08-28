import { and, eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { escrowAccountsTable, representationMilestonesTable, representationQuotesTable } from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import { postEscrowFinancialOperation, financialIdempotencyKey } from "./financialAuthority";
import type { Request } from "express";

export type AllocateMilestoneResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 200; body: { ok: true; milestone: unknown; escrowAccount: unknown; transaction: unknown; ledgerEntry: unknown } }
  | { error: "milestone_not_found" | "forbidden" | "milestone_not_allocatable" | "escrow_account_not_found" | "insufficient_unallocated_funds" };

export async function allocateMilestone(req: Request, milestoneId: string, clientId: string): Promise<AllocateMilestoneResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, clientId);
    if (idempotency.replay) return idempotency;

    const [row] = await tx.select({ milestone: representationMilestonesTable, quote: representationQuotesTable, escrow: escrowAccountsTable })
      .from(representationMilestonesTable)
      .innerJoin(representationQuotesTable, eq(representationQuotesTable.id, representationMilestonesTable.quoteId))
      .innerJoin(escrowAccountsTable, eq(escrowAccountsTable.quoteId, representationQuotesTable.id))
      .where(eq(representationMilestonesTable.id, milestoneId)).limit(1).for("update");
    if (!row) return { error: "milestone_not_found" };
    if (row.quote.clientId !== clientId) return { error: "forbidden" };
    if (row.milestone.status !== "funded") return { error: "milestone_not_allocatable" };
    if (!row.escrow) return { error: "escrow_account_not_found" };

    const amount = row.milestone.amount;
    const now = new Date();
    const [updatedEscrow] = await tx.update(escrowAccountsTable).set({ allocatedAmount: sql`${escrowAccountsTable.allocatedAmount} + ${amount}`, updatedAt: now })
      .where(and(eq(escrowAccountsTable.id, row.escrow.id), sql`${escrowAccountsTable.depositedAmount} - ${escrowAccountsTable.allocatedAmount} - ${escrowAccountsTable.refundedAmount} >= ${amount}`)).returning();
    if (!updatedEscrow) return { error: "insufficient_unallocated_funds" };

    const { escrowTransaction: transaction, ledgerEntry } = await postEscrowFinancialOperation(tx, {
      escrowAccountId: row.escrow.id,
      milestoneId: row.milestone.id,
      type: "stage_allocation",
      amount,
      currency: row.quote.currency,
      reference: `milestone-allocation:${row.milestone.id}`,
      actorId: clientId,
      correlationId: milestoneId,
      idempotencyKey: financialIdempotencyKey(req, "milestone-allocation", milestoneId),
    });

    const [updatedMilestone] = await tx.update(representationMilestonesTable).set({ status: "in_progress", startedAt: now, updatedAt: now })
      .where(and(eq(representationMilestonesTable.id, row.milestone.id), eq(representationMilestonesTable.status, "funded"))).returning();
    if (!updatedMilestone) throw new Error("MILESTONE_ALLOCATION_TRANSITION_FAILED");

    const body = { ok: true as const, milestone: updatedMilestone, escrowAccount: updatedEscrow, transaction, ledgerEntry };
    await persistIdempotencyResponse(tx, req, clientId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}
