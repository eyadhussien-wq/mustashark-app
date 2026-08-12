import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { bookingsTable } from "./bookings";

export const bookingTimeBlocksTable = pgTable(
  "booking_time_blocks",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id").notNull().references(() => bookingsTable.id, { onDelete: "cascade" }),
    lawyerId: text("lawyer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    scheduledDate: text("scheduled_date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    bookingUnique: uniqueIndex("booking_time_blocks_booking_id_uq").on(table.bookingId),
  }),
);

export type BookingTimeBlock = typeof bookingTimeBlocksTable.$inferSelect;
export type InsertBookingTimeBlock = typeof bookingTimeBlocksTable.$inferInsert;
