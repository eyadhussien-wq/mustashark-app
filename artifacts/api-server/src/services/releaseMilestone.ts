import { and, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import {
  commissionTiersTable,
  escrowAccountsTable,
  escrowTransactionsTable,
  lawyerWalletTransactionsTable,
  lawyerWalletsTable,
  milestoneReleaseRequestsTable,
  representationMilestonesTable,
  representationQuotesTable,
  usersTable,
} from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import type { Request } from "express";

export type ReleaseMilestoneResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 200; body: { ok: true; milestone: unknown; escrowAccount: unknown; releaseTransaction: unknown; commissionTransaction: unknown; walletTransaction: unknown } }
  | { error: "release_request_not_found" | "forbidden" | "milestone_not_releasable" | "escrow_account_not_found" | "commission_tier_not_found" | "lawyer_wallet_not_found" };

/**
 * Releases an approved milestone from escrow to the assigned lawyer wallet.
 * All financial mutations are server-authoritative, atomic and idempotent.
 */
export async function releaseMilestone(
  req: Request,
  releaseRequestId: string,
  clientId: string,
): Promise<ReleaseMilestoneResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, clientId);
    if (idempotency.replay) return idempotency;

    const [row] = await tx
      .select({
        request: milestoneReleaseRequestsTable,
        milestone: representationMilestonesTable,
        quote: representationQuotesTable,
        escrow: escrowAccountsTable,
        lawyer: usersTable,
        wallet: lawyerWalletsTable,
      })
      .from(milestoneReleaseRequestsTable)
      .innerJoin(representationMilestonesTable, eq(representationMilestonesTable.id, milestoneReleaseRequestsTable.milestoneId))
      .innerJoin(representationQuotesTable, eq(representationQuotesTable.id, representationMilestonesTable.quoteId))
      .innerJoin(escrowAccountsTable, eq(escrowAccountsTable.quoteId, representationQuotesTable.id))
      .innerJoin(usersTable, eq(usersTable.id, milestoneReleaseRequestsTable.lawyerId))
      .leftJoin(lawyerWalletsTable, eq(lawyerWalletsTable.lawyerId, milestoneReleaseRequestsTable.lawyerId))
      .where(eq(milestoneReleaseRequestsTable.id, releaseRequestId))
      .limit(1)
      .for("update");

    if (!row) return { error: "release_request_not_found" };
    if (row.request.clientId !== clientId || row.quote.clientId !== clientId) return { error: "forbidden" };
    if (row.request.status !== "approved" && row.request.status !== "auto_released") {
      return { error: "milestone_not_releasable" };
    }
    if (["released", "cancelled", "disputed"].includes(row.milestone.status)) {
      return { error: "milestone_not_releasable" };
    }
    if (!row.wallet) return { error: "lawyer_wallet_not_found" };

    const amount = row.milestone.amount;
    const now = new Date();

    const [tier] = await tx
      .select()
      .from(commissionTiersTable)
      .where(and(
        eq(commissionTiersTable.country, row.lawyer.country ?? ""),
        eq(commissionTiersTable.currency, row.quote.currency),
        eq(commissionTiersTable.active, true),
        lte(commissionTiersTable.minQuoteAmount, amount),
        or(isNull(commissionTiersTable.maxQuoteAmount), gte(commissionTiersTable.maxQuoteAmount, amount)),
        lte(commissionTiersTable.effectiveFrom, now),
        or(isNull(commissionTiersTable.effectiveTo), gte(commissionTiersTable.effectiveTo, now)),
      ))
      .orderBy(desc(commissionTiersTable.minQuoteAmount))
      .limit(1);

    if (!tier) return { error: "commission_tier_not_found" };

    const commissionRate = Number(tier.commissionRate);
    const grossAmount = Number(amount);
    const commissionAmount = (Math.round(grossAmount * commissionRate) / 100).toFixed(2);
    const netAmount = (grossAmount - Number(commissionAmount)).toFixed(2);

    const [releaseTransaction] = await tx
      .insert(escrowTransactionsTable)
      .values({
        id: randomUUID(),
        escrowAccountId: row.escrow.id,
        milestoneId: row.milestone.id,
        type: "release",
        status: "posted",
        amount,
        currency: row.quote.currency,
        reference: `release-request:${row.request.id}`,
        createdBy: clientId,
        createdAt: now,
      })
      .returning();
    if (!releaseTransaction) throw new Error("ESCROW_RELEASE_TRANSACTION_FAILED");

    const [commissionTransaction] = await tx
      .insert(escrowTransactionsTable)
      .values({
        id: randomUUID(),
        escrowAccountId: row.escrow.id,
        milestoneId: row.milestone.id,
        type: "commission",
        status: "posted",
        amount: commissionAmount,
        currency: row.quote.currency,
        reference: `commission:${releaseTransaction.id}`,
        createdBy: clientId,
        createdAt: now,
      })
      .returning();
    if (!commissionTransaction) throw new Error("ESCROW_COMMISSION_TRANSACTION_FAILED");

    const [updatedEscrow] = await tx
      .update(escrowAccountsTable)
      .set({
        releasedAmount: sql`${escrowAccountsTable.releasedAmount} + ${amount}`,
        updatedAt: now,
      })
      .where(and(
        eq(escrowAccountsTable.id, row.escrow.id),
        sql`${escrowAccountsTable.depositedAmount} - ${escrowAccountsTable.releasedAmount} - ${escrowAccountsTable.refundedAmount} >= ${amount}`,
      ))
      .returning();
    if (!updatedEscrow) throw new Error("ESCROW_RELEASE_BALANCE_FAILED");

    const [updatedMilestone] = await tx
      .update(representationMilestonesTable)
      .set({ status: "released", completedAt: now, updatedAt: now })
      .where(and(
        eq(representationMilestonesTable.id, row.milestone.id),
        sql`${representationMilestonesTable.status} NOT IN ('released', 'cancelled', 'disputed')`,
      ))
      .returning();
    if (!updatedMilestone) throw new Error("MILESTONE_RELEASE_TRANSITION_FAILED");

    const [walletTransaction] = await tx
      .insert(lawyerWalletTransactionsTable)
      .values({
        id: randomUUID(),
        walletId: row.wallet.id,
        milestoneId: row.milestone.id,
        type: "milestone_payout",
        status: "posted",
        grossAmount: amount,
        commissionAmount,
        netAmount,
        currency: row.quote.currency,
        reference: `escrow-release:${releaseTransaction.id}`,
        createdAt: now,
      })
      .returning();
    if (!walletTransaction) throw new Error("LAWYER_WALLET_TRANSACTION_FAILED");

    const [updatedWallet] = await tx
      .update(lawyerWalletsTable)
      .set({
        availableBalance: sql`${lawyerWalletsTable.availableBalance} + ${netAmount}`,
        updatedAt: now,
      })
      .where(eq(lawyerWalletsTable.id, row.wallet.id))
      .returning();
    if (!updatedWallet) throw new Error("LAWYER_WALLET_UPDATE_FAILED");

    const [updatedRequest] = await tx
      .update(milestoneReleaseRequestsTable)
      .set({ decidedAt: row.request.decidedAt ?? now, updatedAt: now })
      .where(eq(milestoneReleaseRequestsTable.id, row.request.id))
      .returning();
    if (!updatedRequest) throw new Error("RELEASE_REQUEST_UPDATE_FAILED");

    const body = {
      ok: true as const,
      milestone: updatedMilestone,
      escrowAccount: updatedEscrow,
      releaseTransaction,
      commissionTransaction,
      walletTransaction: { ...walletTransaction, wallet: updatedWallet, releaseRequest: updatedRequest },
    };
    await persistIdempotencyResponse(tx, req, clientId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}
