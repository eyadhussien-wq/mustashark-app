import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import { escrowAccountsTable, escrowTransactionsTable, representationMilestonesTable, representationQuotesTable } from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import { lockEscrowForMilestone } from "../lib/financialGuards";
import type { Request } from "express";

export type FundMilestoneResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 200; body: { ok: true; milestone: unknown; escrowAccount: unknown; transaction: unknown } }
  | { error: "milestone_not_found" | "forbidden" | "milestone_not_fundable" | "escrow_account_not_found" };

export async function fundMilestone(req: Request, milestoneId: string, clientId: string): Promise<FundMilestoneResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, clientId);
    if (idempotency.replay) return idempotency;

    const locked = await lockEscrowForMilestone(tx, milestoneId);
    if (!locked) return { error: "milestone_not_found" };

    const [quote] = await tx.select().from(representationQuotesTable).where(eq(representationQuotesTable.id, locked.milestone.quoteId)).limit(1);
    if (!quote) return { error: "milestone_not_found" };
    if (quote.clientId !== clientId) return { error: "forbidden" };
    if (locked.milestone.status !== "awaiting_deposit") return { error: "milestone_not_fundable" };

    const now = new Date();
    const amount = locked.milestone.amount;
    const currency = quote.currency;

    const [transaction] = await tx.insert(escrowTransactionsTable).values({
      id: randomUUID(), escrowAccountId: locked.escrow.id, milestoneId: locked.milestone.id, type: "deposit", status: "posted", amount,
      currency, reference: `milestone:${locked.milestone.id}`, createdBy: clientId, createdAt: now,
    }).returning();
    if (!transaction) throw new Error("ESCROW_TRANSACTION_CREATE_FAILED");

    const [updatedEscrow] = await tx.update(escrowAccountsTable).set({ depositedAmount: sql`${escrowAccountsTable.depositedAmount} + ${amount}`, updatedAt: now }).where(eq(escrowAccountsTable.id, locked.escrow.id)).returning();
    if (!updatedEscrow) throw new Error("ESCROW_ACCOUNT_UPDATE_FAILED");

    const [updatedMilestone] = await tx.update(representationMilestonesTable).set({ status: "funded", fundedAt: now, updatedAt: now }).where(and(
      eq(representationMilestonesTable.id, locked.milestone.id), eq(representationMilestonesTable.status, "awaiting_deposit"),
    )).returning();
    if (!updatedMilestone) throw new Error("MILESTONE_FUNDING_TRANSITION_FAILED");

    const body = { ok: true as const, milestone: updatedMilestone, escrowAccount: updatedEscrow, transaction };
    await persistIdempotencyResponse(tx, req, clientId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}
