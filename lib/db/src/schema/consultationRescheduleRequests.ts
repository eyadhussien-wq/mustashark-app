import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const consultationRescheduleRequestsTable = pgTable("consultation_reschedule_requests", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  requestedBy: text("requested_by").notNull().references(() => usersTable.id),
  oldScheduledAt: timestamp("old_scheduled_at").notNull(),
  newScheduledAt: timestamp("new_scheduled_at").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  resolvedBy: text("resolved_by").references(() => usersTable.id),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});
