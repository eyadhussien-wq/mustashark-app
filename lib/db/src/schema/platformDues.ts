import {
  pgTable,
  text,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bookingsTable } from "./bookings";
import { officesTable } from "./offices";
import { usersTable } from "./users";

export const dueStatusEnum = pgEnum("due_status", [
  "pending",
  "collected",
  "waived",
  "disputed",
]);

export const PLATFORM_COMMISSION_RATE = "0.15" as const;

export const platformDuesTable = pgTable("platform_dues", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookingsTable.id)
    .unique(),
  officeId: text("office_id").references(() => officesTable.id),
  lawyerId: text("lawyer_id")
    .references(() => usersTable.id),
  grossAmount: numeric("gross_amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 4 })
    .notNull()
    .default(PLATFORM_COMMISSION_RATE),
  commissionAmount: numeric("commission_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  status: dueStatusEnum("status").notNull().default("pending"),
  collectedAt: timestamp("collected_at"),
  collectedBy: text("collected_by").references(() => usersTable.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPlatformDueSchema = createInsertSchema(
  platformDuesTable,
).omit({ createdAt: true, updatedAt: true });
export const selectPlatformDueSchema = createSelectSchema(platformDuesTable);

export type InsertPlatformDue = z.infer<typeof insertPlatformDueSchema>;
export type PlatformDue = typeof platformDuesTable.$inferSelect;
