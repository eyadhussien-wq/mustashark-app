import { pgEnum, pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { bookingsTable } from "./bookings";
import { usersTable } from "./users";

export const paymentProofChannelEnum = pgEnum("payment_proof_channel", [
  "platform",
  "external",
]);

export const paymentProofMethodEnum = pgEnum("payment_proof_method", [
  "visa_mastercard",
  "local_wallet",
  "bank_transfer",
  "western_union",
  "other",
]);

export const paymentProofStatusEnum = pgEnum("payment_proof_status", [
  "submitted",
  "confirmed",
  "rejected",
]);

/**
 * Evidence for a consultation payment made outside the platform.
 * Platform payments remain the preferred source of truth and should be
 * confirmed by the payment provider rather than by a client-uploaded proof.
 */
export const paymentProofsTable = pgTable("payment_proofs", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookingsTable.id, { onDelete: "cascade" }),
  clientId: text("client_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  channel: paymentProofChannelEnum("channel").notNull().default("external"),
  method: paymentProofMethodEnum("method").notNull(),
  proofUri: text("proof_uri").notNull(),
  reference: text("reference"),
  note: text("note"),
  status: paymentProofStatusEnum("status").notNull().default("submitted"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: text("reviewed_by").references(() => usersTable.id, { onDelete: "set null" }),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PaymentProof = typeof paymentProofsTable.$inferSelect;
