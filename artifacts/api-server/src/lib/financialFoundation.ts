import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import {
  financialLedgerTable,
  type FinancialEntryDirection,
  type FinancialEntryType,
} from "@workspace/db/schema";

export type FinancialTx = any;

export async function postFinancialEntry(
  tx: FinancialTx,
  input: {
    bookingId?: string | null;
    actorId?: string | null;
    entryType: FinancialEntryType;
    direction: FinancialEntryDirection;
    amount: string;
    currency?: string;
    idempotencyKey: string;
    correlationId?: string | null;
    reference?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const existing = await tx
    .select()
    .from(financialLedgerTable)
    .where(eq(financialLedgerTable.idempotencyKey, input.idempotencyKey))
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("INVALID_FINANCIAL_AMOUNT");
  }

  const [entry] = await tx
    .insert(financialLedgerTable)
    .values({
      id: crypto.randomUUID(),
      bookingId: input.bookingId ?? null,
      actorId: input.actorId ?? null,
      entryType: input.entryType,
      direction: input.direction,
      status: "posted",
      currency: input.currency ?? "QAR",
      amount: input.amount,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId ?? null,
      reference: input.reference ?? null,
      metadata: input.metadata ?? {},
    })
    .returning();

  return entry;
}

export function financialIdempotencyKey(
  operation: string,
  bookingId: string,
  requestKey: string,
) {
  return `finance:${operation}:${bookingId}:${requestKey}`;
}
