import {
  pgTable,
  text,
  numeric,
  timestamp,
  pgEnum,
  jsonb,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { officesTable } from "./offices";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "accepted",
  "rejected",
  "completed",
  "cancelled_by_lawyer",
  "cancelled_by_client",
  "no_show_lawyer",
  "no_show_client",
  "disputed",
  "refunded_absent",
]);

export const bookingTypeEnum = pgEnum("booking_type", [
  "video",
  "chat",
  "phone",
  "email",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "refunded",
  "forfeited",
  "disputed",
]);

export const escrowStatusEnum = pgEnum("escrow_status", [
  "none",
  "held",
  "released",
  "refunded",
]);

export type BookingAttachment = { name: string; uri: string };

export const bookingsTable = pgTable("bookings", {
  id: text("id").primaryKey(),
  serialNumber: text("serial_number").notNull().unique(),
  clientId: text("client_id").references(() => usersTable.id),
  lawyerId: text("lawyer_id").references(() => usersTable.id),
  officeId: text("office_id").references(() => officesTable.id),
  subject: text("subject").notNull(),
  description: text("description"),
  scheduledDate: text("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  scheduledAtUtc: timestamp("scheduled_at_utc", { withTimezone: true }),
  scheduledTimezone: text("scheduled_timezone"),
  status: bookingStatusEnum("status").notNull().default("pending"),
  type: bookingTypeEnum("type").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  escrowStatus: escrowStatusEnum("escrow_status").notNull().default("none"),
  googleMeetLink: text("google_meet_link"),
  googleEventId: text("google_event_id"),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  lawyerJoinedAt: timestamp("lawyer_joined_at"),
  clientJoinedAt: timestamp("client_joined_at"),
  emailResponseDeadlineAt: timestamp("email_response_deadline_at"),
  noShowDetectedAt: timestamp("no_show_detected_at"),
  noShowReason: text("no_show_reason"),
  transferredFromBookingId: text("transferred_from_booking_id"),
  attachments: jsonb("attachments").$type<BookingAttachment[]>().default([]),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  archivedBy: text("archived_by").references(() => usersTable.id),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ createdAt: true, updatedAt: true });
export const selectBookingSchema = createSelectSchema(bookingsTable);
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;

export const lawyerCommitmentScoresTable = pgTable("lawyer_commitment_scores", {
  lawyerId: text("lawyer_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  score: numeric("score", { precision: 5, scale: 2 }).notNull().default("100"),
  noShowCount: integer("no_show_count").notNull().default(0),
  lastNoShowAt: timestamp("last_no_show_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notificationsTable = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  bookingId: text("booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  kind: text("kind").notNull(),
  urgent: boolean("urgent").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookingTransferRequestsTable = pgTable("booking_transfer_requests", {
  id: text("id").primaryKey(),
  originalBookingId: text("original_booking_id").notNull().unique().references(() => bookingsTable.id, { onDelete: "cascade" }),
  newBookingId: text("new_booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
  clientId: text("client_id").notNull().references(() => usersTable.id),
  originalLawyerId: text("original_lawyer_id").references(() => usersTable.id, { onDelete: "set null" }),
  newLawyerId: text("new_lawyer_id").references(() => usersTable.id, { onDelete: "set null" }),
  status: text("status").notNull().default("offered"),
  reason: text("reason").notNull().default("lawyer_no_show"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  selectedAt: timestamp("selected_at"),
});

export const clientWalletsTable = pgTable("client_wallets", {
  clientId: text("client_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  availableCredits: numeric("available_credits", { precision: 10, scale: 2 }).notNull().default("0"),
  totalRefunded: numeric("total_refunded", { precision: 10, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
