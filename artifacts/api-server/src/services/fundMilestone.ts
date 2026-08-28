import { and, eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  escrowAccountsTable,
  representationMilestonesTable,
  representationQuotesTable,
} from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import { postEscrowFinancialOperation, financialIdempotencyKey } from "./financialAuthority";
import type { Request } from "express";

export type FundMilestoneResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 200; body: { ok: true; milestone: unknown; escrowAccount: unknown; transaction: unknown; ledgerEntry: unknown } }
  | { error: "milestone_not_found" | "forbidden" | "milestone_not_fundable" | "escrow_account_not_found" };

/**
 * Records a server-authoritative milestone deposit. The milestone amount and
 * currency are read from the database; the client cannot choose financial
 * values. Idempotency and all financial mutations live in one transaction.
 */
export async function fundMilestone(req: Request, milestoneId: string, clientId: string): Promise<FundMilestoneResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, clientId);
    if (idempotency.replay) return idempotency;

    const [row] = await tx
      .select({ milestone: representationMilestonesTable, quote: representationQuotesTable, escrow: escrowAccountsTable })
      .from(representationMilestonesTable)
      .innerJoin(representationQuotesTable, eq(representationQuotesTable.id, representationMilestonesTable.quoteId))
      .innerJoin(escrowAccountsTable, eq(escrowAccountsTable.quoteId, representationQuotesTable.id))
      .where(eq(representationMilestonesTable.id, milestoneId))
      .limit(1)
      .for("update");

    if (!row) return { error: "milestone_not_found" };
    if (row.quote.clientId !== clientId) return { error: "forbidden" };
    if (row.milestone.status !== "awaiting_deposit") return { error: "milestone_not_fundable" };
    if (!row.escrow) return { error: "escrow_account_not_found" };

    const now = new Date();
    const amount = row.milestone.amount;
    const currency = row.quote.currency;
    const idempotencyKey = financialIdempotencyKey(req, "milestone-deposit", milestoneId);
    const { escrowTransaction: transaction, ledgerEntry } = await postEscrowFinancialOperation(tx, {
      escrowAccountId: row.escrow.id,
      milestoneId: row.milestone.id,
      type: "deposit",
      amount,
      currency,
      reference: `milestone:${row.milestone.id}`,
      actorId: clientId,
      correlationId: milestoneId,
      idempotencyKey,
    });

    const [updatedEscrow] = await tx.update(escrowAccountsTable)
      .set({ depositedAmount: sql`${escrowAccountsTable.depositedAmount} + ${amount}`, updatedAt: now })
      .where(eq(escrowAccountsTable.id, row.escrow.id)).returning();
    if (!updatedEscrow) throw new Error("ESCROW_ACCOUNT_UPDATE_FAILED");

    const [updatedMilestone] = await tx.update(representationMilestonesTable)
      .set({ status: "funded", fundedAt: now, updatedAt: now })
      .where(and(eq(representationMilestonesTable.id, row.milestone.id), eq(representationMilestonesTable.status, "awaiting_deposit")))
      .returning();
    if (!updatedMilestone) throw new Error("MILESTONE_FUNDING_TRANSITION_FAILED");

    const body = { ok: true as const, milestone: updatedMilestone, escrowAccount: updatedEscrow, transaction, ledgerEntry };
    await persistIdempotencyResponse(tx, req, clientId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}
