import {
  pgEnum,
  pgTable,
  text,
  numeric,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bookingsTable } from "./bookings";
import { usersTable } from "./users";

export const financialEntryTypeEnum = pgEnum("financial_entry_type", [
  "payment",
  "hold",
  "refund",
  "forfeit",
  "commission",
  "settlement",
  "payout",
  "adjustment",
]);

export const financialEntryDirectionEnum = pgEnum("financial_entry_direction", [
  "credit",
  "debit",
]);

export const financialEntryStatusEnum = pgEnum("financial_entry_status", [
  "pending",
  "posted",
  "voided",
]);

/**
 * Authoritative internal financial journal. Every financial mutation records
 * an immutable fact here inside the same DB transaction as the business state.
 * Commercial policy (refund windows, commission rules, payout timing) stays
 * outside this foundation layer.
 */
export const financialLedgerTable = pgTable(
  "financial_ledger",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id").references(() => bookingsTable.id),
    actorId: text("actor_id").references(() => usersTable.id),
    entryType: financialEntryTypeEnum("entry_type").notNull(),
    direction: financialEntryDirectionEnum("direction").notNull(),
    status: financialEntryStatusEnum("status").notNull().default("posted"),
    currency: text("currency").notNull().default("QAR"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    idempotencyKey: text("idempotency_key"),
    correlationId: text("correlation_id"),
    reference: text("reference"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idempotencyUnique: uniqueIndex("financial_ledger_idempotency_uq").on(
      table.idempotencyKey,
    ),
  }),
);

export const insertFinancialLedgerSchema = createInsertSchema(financialLedgerTable);
export const selectFinancialLedgerSchema = createSelectSchema(financialLedgerTable);
export type InsertFinancialLedger = z.infer<typeof insertFinancialLedgerSchema>;
export type FinancialLedger = typeof financialLedgerTable.$inferSelect;
