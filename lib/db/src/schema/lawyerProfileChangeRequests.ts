import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const profileChangeFieldEnum = pgEnum("profile_change_field", [
  "specialization",
  "bio",
  "hourlyRate",
]);

export const profileChangeStatusEnum = pgEnum("profile_change_status", [
  "pending",
  "approved",
  "rejected",
]);

export const lawyerProfileChangeRequestsTable = pgTable(
  "lawyer_profile_change_requests",
  {
    id: text("id").primaryKey(),
    lawyerId: text("lawyer_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    field: profileChangeFieldEnum("field").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    status: profileChangeStatusEnum("status").notNull().default("pending"),
    reviewedBy: text("reviewed_by").references(() => usersTable.id),
    reviewedAt: timestamp("reviewed_at"),
    rejectionNote: text("rejection_note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);

export type LawyerProfileChangeRequest =
  typeof lawyerProfileChangeRequestsTable.$inferSelect;
export type InsertLawyerProfileChangeRequest =
  typeof lawyerProfileChangeRequestsTable.$inferInsert;
