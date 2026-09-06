import { pgTable, text, timestamp, jsonb, uniqueIndex, integer } from "drizzle-orm/pg-core";
import { bookingsTable } from "./bookings.ts";
import { usersTable } from "./users.ts";

/**
 * S01-07 reminder delivery ledger.
 *
 * `channel` is intentionally text rather than a PostgreSQL enum so future
 * delivery channels (email, WhatsApp, push, etc.) do not require a schema
 * rewrite. The unique key identifies one reminder occurrence per recipient
 * and channel, making concurrent scheduler claims deterministic.
 */
export const bookingReminderDeliveriesTable = pgTable(
  "booking_reminder_deliveries",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id").notNull().references(() => bookingsTable.id, { onDelete: "cascade" }),
    recipientUserId: text("recipient_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    reminderType: text("reminder_type").notNull(),
    scheduledOccurrence: timestamp("scheduled_occurrence").notNull(),
    status: text("status").notNull().default("claimed"),
    attemptCount: integer("attempt_count").notNull().default(1),
    providerMessageId: text("provider_message_id"),
    metadata: jsonb("metadata"),
    claimedAt: timestamp("claimed_at").notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at"),
    failedAt: timestamp("failed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    occurrenceUnique: uniqueIndex("booking_reminder_deliveries_occurrence_uq").on(
      table.bookingId,
      table.recipientUserId,
      table.channel,
      table.reminderType,
      table.scheduledOccurrence,
    ),
  }),
);

export type BookingReminderDelivery = typeof bookingReminderDeliveriesTable.$inferSelect;
export type InsertBookingReminderDelivery = typeof bookingReminderDeliveriesTable.$inferInsert;
