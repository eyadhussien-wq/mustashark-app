import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const lawyerAvailabilityTable = pgTable(
  "lawyer_availability",
  {
    id: text("id").primaryKey(),
    lawyerId: text("lawyer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    slotDurationMinutes: integer("slot_duration_minutes").notNull().default(60),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    availabilityUnique: uniqueIndex("lawyer_availability_window_uq").on(
      table.lawyerId,
      table.dayOfWeek,
      table.startTime,
      table.endTime,
    ),
  }),
);

export type LawyerAvailability = typeof lawyerAvailabilityTable.$inferSelect;
export type InsertLawyerAvailability = typeof lawyerAvailabilityTable.$inferInsert;
