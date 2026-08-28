import { and, eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { escrowAccountsTable, representationMilestonesTable, representationQuotesTable } from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import { postEscrowFinancialOperation, financialIdempotencyKey } from "./financialAuthority";
import type { Request } from "express";

export type RefundMilestoneResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 200; body: { ok: true; milestone: unknown; escrowAccount: unknown; refundTransaction: unknown; ledgerEntry: unknown } }
  | { error: "milestone_not_found" | "forbidden" | "milestone_not_refundable" | "escrow_account_not_found" };

export async function refundMilestone(req: Request, milestoneId: string, clientId: string): Promise<RefundMilestoneResult> {
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
    if (["released", "cancelled", "disputed"].includes(row.milestone.status)) return { error: "milestone_not_refundable" };
    if (!row.escrow) return { error: "escrow_account_not_found" };

    const amount = row.milestone.amount;
    const currency = row.quote.currency;
    const now = new Date();
    const { escrowTransaction: refundTransaction, ledgerEntry } = await postEscrowFinancialOperation(tx, {
      escrowAccountId: row.escrow.id,
      milestoneId: row.milestone.id,
      type: "refund",
      amount,
      currency,
      reference: `milestone-refund:${row.milestone.id}`,
      actorId: clientId,
      correlationId: milestoneId,
      idempotencyKey: financialIdempotencyKey(req, "milestone-refund", milestoneId),
    });

    const [updatedEscrow] = await tx.update(escrowAccountsTable).set({ refundedAmount: sql`${escrowAccountsTable.refundedAmount} + ${amount}`, updatedAt: now })
      .where(and(eq(escrowAccountsTable.id, row.escrow.id), sql`${escrowAccountsTable.depositedAmount} - ${escrowAccountsTable.releasedAmount} - ${escrowAccountsTable.refundedAmount} >= ${amount}`)).returning();
    if (!updatedEscrow) throw new Error("ESCROW_REFUND_BALANCE_FAILED");

    const [updatedMilestone] = await tx.update(representationMilestonesTable).set({ status: "cancelled", updatedAt: now })
      .where(and(eq(representationMilestonesTable.id, row.milestone.id), sql`${representationMilestonesTable.status} NOT IN ('released', 'cancelled', 'disputed')`)).returning();
    if (!updatedMilestone) throw new Error("MILESTONE_REFUND_TRANSITION_FAILED");

    const body = { ok: true as const, milestone: updatedMilestone, escrowAccount: updatedEscrow, refundTransaction, ledgerEntry };
    await persistIdempotencyResponse(tx, req, clientId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}
