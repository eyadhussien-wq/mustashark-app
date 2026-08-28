import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Request } from "express";
import { db } from "@workspace/db";
import {
  clientWalletsTable,
  escrowTransactionsTable,
  financialLedgerTable,
  lawyerWalletTransactionsTable,
  platformDuesTable,
  type FinancialEntryDirection,
  type FinancialEntryType,
  type EscrowTransaction,
} from "@workspace/db/schema";

export type FinancialTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type EscrowFinancialOperation =
  | "deposit"
  | "stage_allocation"
  | "release"
  | "refund"
  | "commission"
  | "adjustment";

const ledgerTypeByEscrowType: Record<EscrowFinancialOperation, FinancialEntryType> = {
  deposit: "payment",
  stage_allocation: "hold",
  release: "settlement",
  refund: "refund",
  commission: "commission",
  adjustment: "adjustment",
};

const ledgerDirectionByEscrowType: Record<EscrowFinancialOperation, FinancialEntryDirection> = {
  deposit: "credit",
  stage_allocation: "debit",
  release: "debit",
  refund: "debit",
  commission: "credit",
  adjustment: "credit",
};

/**
 * Single financial write boundary for the existing escrow engine.
 *
 * The legacy escrow transaction remains the compatibility/audit record used
 * by existing consumers. The Financial Ledger entry is written in the SAME
 * database transaction with the SAME amount/currency/reference.
 *
 * Business policy is intentionally outside this module.
 */
export async function postEscrowFinancialOperation(
  tx: FinancialTx,
  input: {
    escrowAccountId: string;
    milestoneId?: string | null;
    type: EscrowFinancialOperation;
    amount: string;
    currency: "QAR" | "JOD";
    reference?: string | null;
    actorId?: string | null;
    bookingId?: string | null;
    correlationId?: string | null;
    idempotencyKey?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<{ escrowTransaction: EscrowTransaction; ledgerEntry: typeof financialLedgerTable.$inferSelect }> {
  const now = new Date();
  const transactionId = randomUUID();
  const ledgerId = randomUUID();
  const reference = input.reference ?? `escrow:${transactionId}`;

  const [escrowTransaction] = await tx
    .insert(escrowTransactionsTable)
    .values({
      id: transactionId,
      escrowAccountId: input.escrowAccountId,
      milestoneId: input.milestoneId ?? null,
      type: input.type,
      status: "posted",
      amount: input.amount,
      currency: input.currency,
      reference,
      createdBy: input.actorId ?? null,
      createdAt: now,
    })
    .returning();

  if (!escrowTransaction) throw new Error("ESCROW_TRANSACTION_CREATE_FAILED");

  const [ledgerEntry] = await tx
    .insert(financialLedgerTable)
    .values({
      id: ledgerId,
      bookingId: input.bookingId ?? null,
      actorId: input.actorId ?? null,
      entryType: ledgerTypeByEscrowType[input.type],
      direction: ledgerDirectionByEscrowType[input.type],
      status: "posted",
      currency: input.currency,
      amount: input.amount,
      idempotencyKey: input.idempotencyKey ?? null,
      correlationId: input.correlationId ?? null,
      reference,
      metadata: {
        ...(input.metadata ?? {}),
        source: "escrow",
        escrowTransactionId: transactionId,
        escrowAccountId: input.escrowAccountId,
        milestoneId: input.milestoneId ?? null,
      },
      createdAt: now,
    })
    .returning();

  if (!ledgerEntry) throw new Error("FINANCIAL_LEDGER_ENTRY_CREATE_FAILED");
  return { escrowTransaction, ledgerEntry };
}

/**
 * Authoritative booking refund bookkeeping. The business layer decides that
 * a refund is due; this function only performs the atomic financial mutation.
 */
export async function refundBookingFinancially(
  tx: FinancialTx,
  input: {
    bookingId: string;
    clientId: string;
    amount: string;
    currency: "QAR" | "JOD";
    actorId: string;
    idempotencyKey: string;
    correlationId?: string | null;
    reason: string;
  },
) {
  const now = new Date();
  const reference = `booking-refund:${input.bookingId}:${input.idempotencyKey}`;

  const [ledgerEntry] = await tx
    .insert(financialLedgerTable)
    .values({
      id: randomUUID(),
      bookingId: input.bookingId,
      actorId: input.actorId,
      entryType: "refund",
      direction: "debit",
      status: "posted",
      currency: input.currency,
      amount: input.amount,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId ?? null,
      reference,
      metadata: { source: "booking", reason: input.reason },
      createdAt: now,
    })
    .onConflictDoNothing({ target: financialLedgerTable.idempotencyKey })
    .returning();

  if (!ledgerEntry) throw new Error("FINANCIAL_REFUND_ALREADY_POSTED");

  await tx
    .insert(clientWalletsTable)
    .values({
      clientId: input.clientId,
      availableCredits: input.amount,
      totalRefunded: input.amount,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: clientWalletsTable.clientId,
      set: {
        availableCredits: sql`${clientWalletsTable.availableCredits} + ${input.amount}`,
        totalRefunded: sql`${clientWalletsTable.totalRefunded} + ${input.amount}`,
        updatedAt: now,
      },
    });

  await tx
    .update(platformDuesTable)
    .set({ status: "waived", collectedAt: null, collectedBy: null, updatedAt: now })
    .where(eq(platformDuesTable.bookingId, input.bookingId));

  return ledgerEntry;
}

/**
 * Records an authorized lawyer payout in the internal journal and compatibility
 * wallet transaction history. The external bank/provider transfer is NOT
 * inferred from this record and must be reconciled separately.
 */
export async function recordLawyerPayoutFinancially(
  tx: FinancialTx,
  input: {
    lawyerId: string;
    walletId: string;
    amount: string;
    currency: "QAR" | "JOD";
    actorId: string;
    idempotencyKey: string;
    correlationId?: string | null;
    reference?: string;
    milestoneId?: string | null;
  },
) {
  const now = new Date();
  const reference = input.reference ?? `lawyer-payout:${input.lawyerId}:${input.idempotencyKey}`;

  const [entry] = await tx
    .insert(financialLedgerTable)
    .values({
      id: randomUUID(),
      actorId: input.actorId,
      entryType: "payout",
      direction: "debit",
      status: "posted",
      currency: input.currency,
      amount: input.amount,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId ?? null,
      reference,
      metadata: { source: "lawyer_wallet", lawyerId: input.lawyerId, walletId: input.walletId },
      createdAt: now,
    })
    .onConflictDoNothing({ target: financialLedgerTable.idempotencyKey })
    .returning();

  if (!entry) throw new Error("FINANCIAL_PAYOUT_ALREADY_POSTED");

  await tx.insert(lawyerWalletTransactionsTable).values({
    id: randomUUID(),
    walletId: input.walletId,
    milestoneId: input.milestoneId ?? null,
    type: "milestone_payout",
    status: "posted",
    grossAmount: input.amount,
    commissionAmount: "0",
    netAmount: input.amount,
    currency: input.currency,
    reference,
    createdAt: now,
  });

  return entry;
}

export async function postLedgerEntry(
  tx: FinancialTx,
  input: {
    entryType: FinancialEntryType;
    direction: FinancialEntryDirection;
    amount: string;
    currency: "QAR" | "JOD";
    actorId?: string | null;
    bookingId?: string | null;
    reference: string;
    idempotencyKey?: string | null;
    correlationId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const [entry] = await tx
    .insert(financialLedgerTable)
    .values({
      id: randomUUID(),
      actorId: input.actorId ?? null,
      bookingId: input.bookingId ?? null,
      entryType: input.entryType,
      direction: input.direction,
      status: "posted",
      currency: input.currency,
      amount: input.amount,
      idempotencyKey: input.idempotencyKey ?? null,
      correlationId: input.correlationId ?? null,
      reference: input.reference,
      metadata: input.metadata ?? {},
      createdAt: new Date(),
    })
    .returning();

  if (!entry) throw new Error("FINANCIAL_LEDGER_ENTRY_CREATE_FAILED");
  return entry;
}

export function financialIdempotencyKey(req: Request, operation: string, subjectId: string) {
  const key = req.header("Idempotency-Key") ?? `legacy:${operation}:${subjectId}`;
  return `${operation}:${key}`;
}
