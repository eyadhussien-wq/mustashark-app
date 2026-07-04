import {
  pgTable,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const officesTable = pgTable("offices", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  licenseNumber: text("license_number"),
  country: text("country"),
  isSuspended: boolean("is_suspended").notNull().default(false),
  suspensionReason: text("suspension_reason"),
  debtThreshold: numeric("debt_threshold", { precision: 10, scale: 2 })
    .notNull()
    .default("500.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const officeAssistantsTable = pgTable("office_assistants", {
  id: text("id").primaryKey(),
  officeId: text("office_id")
    .notNull()
    .references(() => officesTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  canManageBookings: boolean("can_manage_bookings").notNull().default(true),
  canViewFinancials: boolean("can_view_financials").notNull().default(false),
  canCancelBookings: boolean("can_cancel_bookings").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOfficeSchema = createInsertSchema(officesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const selectOfficeSchema = createSelectSchema(officesTable);

export const insertOfficeAssistantSchema = createInsertSchema(
  officeAssistantsTable,
).omit({ createdAt: true });

export type InsertOffice = z.infer<typeof insertOfficeSchema>;
export type Office = typeof officesTable.$inferSelect;
export type OfficeAssistant = typeof officeAssistantsTable.$inferSelect;
