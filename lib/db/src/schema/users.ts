import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["client", "lawyer", "admin"]);
export const countryEnum = pgEnum("country", ["qatar", "jordan"]);
export const authProviderEnum = pgEnum("auth_provider", [
  "local",
  "google",
  "facebook",
  "apple",
]);
export const accountStatusEnum = pgEnum("account_status", [
  "pending",
  "active",
  "suspended",
  "terminated",
  "rejected",
  "blocked",
]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("client"),
  country: countryEnum("country"),
  authProvider: authProviderEnum("auth_provider").notNull().default("local"),
  providerId: text("provider_id"),
  accountStatus: accountStatusEnum("account_status")
    .notNull()
    .default("active"),
  statusReason: text("status_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const selectUserSchema = createSelectSchema(usersTable);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
