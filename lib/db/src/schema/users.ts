import { pgTable, text, timestamp, pgEnum, numeric, integer } from "drizzle-orm/pg-core";
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
export const bankVerificationStatusEnum = pgEnum("bank_verification_status", [
  "not_submitted",
  "pending",
  "verified",
  "rejected",
  "suspended",
]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  phone: text("phone"),
  // Country inferred from the phone country calling code (+974, +962, ...).
  phoneCountry: text("phone_country"),
  role: userRoleEnum("role").notNull().default("client"),
  // Country of residence; it must not be changed by a regular user after registration.
  country: countryEnum("country"),
  // Nationality is an independent user-declared identity field.
  nationality: text("nationality"),
  authProvider: authProviderEnum("auth_provider").notNull().default("local"),
  providerId: text("provider_id"),
  accountStatus: accountStatusEnum("account_status")
    .notNull()
    .default("active"),
  statusReason: text("status_reason"),
  // Lawyer-specific profile fields
  specialization: text("specialization"),
  bio: text("bio"),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  rating: numeric("rating", { precision: 3, scale: 1 }),
  reviewsCount: integer("reviews_count").notNull().default(0),

  // Lawyer bank-account verification. Sensitive IBAN/SWIFT values are stored
  // separately from the public profile and must never be exposed in full.
  bankName: text("bank_name"),
  bankAccountHolderName: text("bank_account_holder_name"),
  bankCountry: countryEnum("bank_country"),
  bankIbanEncrypted: text("bank_iban_encrypted"),
  bankIbanLast4: text("bank_iban_last4"),
  bankSwiftEncrypted: text("bank_swift_encrypted"),
  bankVerificationStatus: bankVerificationStatusEnum("bank_verification_status")
    .notNull()
    .default("not_submitted"),
  bankVerificationDocumentKey: text("bank_verification_document_key"),
  bankVerificationNote: text("bank_verification_note"),
  bankVerifiedAt: timestamp("bank_verified_at"),
  bankVerifiedBy: text("bank_verified_by"),
  bankUpdatedAt: timestamp("bank_updated_at"),

  deletedAt: timestamp("deleted_at"),
  deletionScheduledAt: timestamp("deletion_scheduled_at"),
  deletionRejectionNote: text("deletion_rejection_note"),
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
