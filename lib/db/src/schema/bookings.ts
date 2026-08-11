import {
  pgTable,
  text,
  numeric,
  timestamp,
  pgEnum,
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

export const bookingsTable = pgTable("bookings", {
  id: text("id").primaryKey(),
  serialNumber: text("serial_number").notNull().unique(),
  clientId: text("client_id")
    .references(() => usersTable.id),
  lawyerId: text("lawyer_id")
    .references(() => usersTable.id),
  officeId: text("office_id").references(() => officesTable.id),
  subject: text("subject").notNull(),
  description: text("description"),
  scheduledDate: text("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  type: bookingTypeEnum("type").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status")
    .notNull()
    .default("pending"),
  googleMeetLink: text("google_meet_link"),
  googleEventId: text("google_event_id"),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  lawyerJoinedAt: timestamp("lawyer_joined_at"),
  clientJoinedAt: timestamp("client_joined_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const selectBookingSchema = createSelectSchema(bookingsTable);

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
