import { pgEnum, pgTable, text, timestamp, real } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const lawyerVerificationStatusEnum = pgEnum("lawyer_verification_status", [
  "pending",
  "verifying",
  "approved",
  "rejected",
  "exception",
  "expired",
  "suspended",
  "revoked",
]);

export const lawyerVerificationsTable = pgTable("lawyer_verifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  licenseNumber: text("license_number").unique(),
  barAssociation: text("bar_association"),
  documentStorageKey: text("document_storage_key"),
  documentHash: text("document_hash"),
  status: lawyerVerificationStatusEnum("status").notNull().default("pending"),
  verificationSource: text("verification_source"),
  sourceReference: text("source_reference"),
  sourceStatus: text("source_status"),
  verificationMethod: text("verification_method"),
  matchedName: text("matched_name"),
  matchedLicense: text("matched_license"),
  confidence: real("confidence"),
  verifiedAt: timestamp("verified_at"),
  lastCheckedAt: timestamp("last_checked_at"),
  exceptionReason: text("exception_reason"),
  reviewedBy: text("reviewed_by").references(() => usersTable.id),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type LawyerVerification = typeof lawyerVerificationsTable.$inferSelect;
export type InsertLawyerVerification = typeof lawyerVerificationsTable.$inferInsert;
