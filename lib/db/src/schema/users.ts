import { pgTable, text, timestamp, pgEnum, numeric, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["client", "lawyer", "admin"]);
export const countryEnum = pgEnum("country", ["qatar", "jordan"]);
export const authProviderEnum = pgEnum("auth_provider", ["local", "google", "facebook", "apple"]);
export const accountStatusEnum = pgEnum("account_status", ["pending", "active", "suspended", "terminated", "rejected", "blocked"]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  phone: text("phone"),
  phoneCountry: text("phone_country"),
  role: userRoleEnum("role").notNull().default("client"),
  country: countryEnum("country"),
  nationality: text("nationality"),
  authProvider: authProviderEnum("auth_provider").notNull().default("local"),
  providerId: text("provider_id"),
  accountStatus: accountStatusEnum("account_status").notNull().default("active"),
  statusReason: text("status_reason"),
  specialization: text("specialization"),
  litigationTier: text("litigation_tier").notNull().default("general"),
  bio: text("bio"),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  rating: numeric("rating", { precision: 3, scale: 1 }),
  reviewsCount: integer("reviews_count").notNull().default(0),
  schedulingTimezone: text("scheduling_timezone"),
  deletedAt: timestamp("deleted_at"),
  deletionScheduledAt: timestamp("deletion_scheduled_at"),
  deletionRejectionNote: text("deletion_rejection_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("users_auth_provider_provider_id_uq").on(table.authProvider, table.providerId),
]);

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export const selectUserSchema = createSelectSchema(usersTable);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
