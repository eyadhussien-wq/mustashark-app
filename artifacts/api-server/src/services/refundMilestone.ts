import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import { escrowAccountsTable, escrowTransactionsTable, representationQuotesTable } from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import { assertMilestoneSettlementCapacity, lockEscrowForMilestone } from "../lib/financialGuards";
import type { Request } from "express";

export type RefundMilestoneResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 200; body: { ok: true; milestone: unknown; escrowAccount: unknown; refundTransaction: unknown } }
  | { error: "milestone_not_found" | "forbidden" | "milestone_not_refundable" | "escrow_account_not_found" };

export async function refundMilestone(req: Request, milestoneId: string, clientId: string): Promise<RefundMilestoneResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, clientId);
    if (idempotency.replay) return idempotency;

    const locked = await lockEscrowForMilestone(tx, milestoneId);
    if (!locked) return { error: "milestone_not_found" };

    const [quote] = await tx.select().from(representationQuotesTable).where(eq(representationQuotesTable.id, locked.milestone.quoteId)).limit(1);
    if (!quote) return { error: "milestone_not_found" };
    if (quote.clientId !== clientId) return { error: "forbidden" };
    if (["released", "cancelled", "disputed"].includes(locked.milestone.status)) return { error: "milestone_not_refundable" };

    const amount = locked.milestone.amount;
    const currency = quote.currency;
    if (!(await assertMilestoneSettlementCapacity(tx, locked.escrow.id, locked.milestone.id, amount))) return { error: "milestone_not_refundable" };

    const now = new Date();
    const [refundTransaction] = await tx.insert(escrowTransactionsTable).values({
      id: randomUUID(), escrowAccountId: locked.escrow.id, milestoneId: locked.milestone.id, type: "refund", status: "posted", amount,
      currency, reference: `milestone-refund:${locked.milestone.id}`, createdBy: clientId, createdAt: now,
    }).returning();
    if (!refundTransaction) throw new Error("ESCROW_REFUND_TRANSACTION_FAILED");

    const [updatedEscrow] = await tx.update(escrowAccountsTable).set({ refundedAmount: sql`${escrowAccountsTable.refundedAmount} + ${amount}`, updatedAt: now }).where(and(
      eq(escrowAccountsTable.id, locked.escrow.id), sql`${escrowAccountsTable.depositedAmount} - ${escrowAccountsTable.releasedAmount} - ${escrowAccountsTable.refundedAmount} >= ${amount}`,
    )).returning();
    if (!updatedEscrow) throw new Error("ESCROW_REFUND_BALANCE_FAILED");

    const [updatedMilestone] = await tx.update((await import("@workspace/db/schema")).representationMilestonesTable).set({ status: "cancelled", updatedAt: now }).where(and(
      eq((await import("@workspace/db/schema")).representationMilestonesTable.id, locked.milestone.id),
      sql`${(await import("@workspace/db/schema")).representationMilestonesTable.status} NOT IN ('released','cancelled','disputed')`,
    )).returning();
    if (!updatedMilestone) throw new Error("MILESTONE_REFUND_TRANSITION_FAILED");

    const body = { ok: true as const, milestone: updatedMilestone, escrowAccount: updatedEscrow, refundTransaction };
    await persistIdempotencyResponse(tx, req, clientId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}
