import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const termsConsentAuditTable = pgTable("terms_consent_audit", {
  id: text("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id),

  flow: text("flow").notNull(),
  role: text("role").notNull(),
  consentVersion: text("consent_version").notNull(),
  acceptedAt: timestamp("accepted_at").notNull(),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});
