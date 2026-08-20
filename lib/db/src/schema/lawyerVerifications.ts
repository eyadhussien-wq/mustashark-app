import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const lawyerVerificationStatusEnum = pgEnum("lawyer_verification_status", [
  "pending",
  "approved",
  "rejected",
]);

export const lawyerVerificationsTable = pgTable("lawyer_verifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  licenseNumber: text("license_number").notNull().unique(),
  barAssociation: text("bar_association").notNull(),
  documentStorageKey: text("document_storage_key").notNull(),
  status: lawyerVerificationStatusEnum("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by").references(() => usersTable.id),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type LawyerVerification = typeof lawyerVerificationsTable.$inferSelect;
export type InsertLawyerVerification = typeof lawyerVerificationsTable.$inferInsert;
