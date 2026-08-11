import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bookingsTable } from "./bookings";
import { usersTable } from "./users";

export const bookingTransferRequestsTable = pgTable("booking_transfer_requests", {
  id: text("id").primaryKey(),
  originalBookingId: text("original_booking_id").notNull().references(() => bookingsTable.id, { onDelete: "cascade" }),
  newBookingId: text("new_booking_id").references(() => bookingsTable.id, { onDelete: "set null" }),
  clientId: text("client_id").notNull().references(() => usersTable.id),
  originalLawyerId: text("original_lawyer_id").references(() => usersTable.id, { onDelete: "set null" }),
  newLawyerId: text("new_lawyer_id").references(() => usersTable.id, { onDelete: "set null" }),
  status: text("status").notNull().default("offered"),
  reason: text("reason").notNull().default("lawyer_no_show"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  selectedAt: timestamp("selected_at"),
});

export const insertBookingTransferRequestSchema = createInsertSchema(bookingTransferRequestsTable).omit({ createdAt: true });
export const selectBookingTransferRequestSchema = createSelectSchema(bookingTransferRequestsTable);
export type InsertBookingTransferRequest = z.infer<typeof insertBookingTransferRequestSchema>;
export type BookingTransferRequest = typeof bookingTransferRequestsTable.$inferSelect;
