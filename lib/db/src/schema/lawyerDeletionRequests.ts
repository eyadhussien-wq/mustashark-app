import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users.ts";

export const deletionRequestStatusEnum = pgEnum("deletion_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const lawyerDeletionRequestsTable = pgTable("lawyer_deletion_requests", {
  id: text("id").primaryKey(),
  lawyerId: text("lawyer_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  status: deletionRequestStatusEnum("status").notNull().default("pending"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by").references(() => usersTable.id),
  rejectionNote: text("rejection_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLawyerDeletionRequestSchema = createInsertSchema(
  lawyerDeletionRequestsTable,
).omit({ createdAt: true });
export const selectLawyerDeletionRequestSchema = createSelectSchema(
  lawyerDeletionRequestsTable,
);

export type InsertLawyerDeletionRequest = z.infer<
  typeof insertLawyerDeletionRequestSchema
>;
export type LawyerDeletionRequest =
  typeof lawyerDeletionRequestsTable.$inferSelect;
