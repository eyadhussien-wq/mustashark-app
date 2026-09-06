import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users.ts";

export const termsVersionStatusEnum = pgEnum("terms_version_status", [
  "draft",
  "published",
  "superseded",
]);

export const termsConsentSourceEnum = pgEnum("terms_consent_source", [
  "registration",
  "settings",
  "required_action",
]);

/**
 * Immutable platform Terms versions.
 * A new legal text must always create a new row/version; published content is
 * never edited in place. The content hash is the evidence anchor for the
 * exact text presented to and accepted by the user.
 */
export const termsVersionsTable = pgTable(
  "terms_versions",
  {
    id: text("id").primaryKey(),
    version: integer("version").notNull(),
    status: termsVersionStatusEnum("status").notNull().default("draft"),
    content: text("content").notNull(),
    contentHash: text("content_hash").notNull(),
    hashAlgorithm: text("hash_algorithm").notNull().default("sha256"),
    mandatory: boolean("mandatory").notNull().default(true),
    effectiveAt: timestamp("effective_at"),
    publishedAt: timestamp("published_at"),
    createdBy: text("created_by").references(() => usersTable.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    versionUidx: uniqueIndex("terms_versions_version_uidx").on(table.version),
    contentHashIdx: index("terms_versions_content_hash_idx").on(table.contentHash),
    statusEffectiveIdx: index("terms_versions_status_effective_idx").on(
      table.status,
      table.effectiveAt,
    ),
  }),
);

/**
 * Immutable consent evidence binding one authenticated user to one exact
 * Terms version and its exact content hash.
 */
export const termsConsentsTable = pgTable(
  "terms_consents",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => usersTable.id),
    termsVersionId: text("terms_version_id").notNull().references(() => termsVersionsTable.id),
    version: integer("version").notNull(),
    contentHash: text("content_hash").notNull(),
    consentedAt: timestamp("consented_at").notNull().defaultNow(),
    source: termsConsentSourceEnum("source").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    userVersionUidx: uniqueIndex("terms_consents_user_version_uidx").on(
      table.userId,
      table.termsVersionId,
    ),
    userIdx: index("terms_consents_user_id_idx").on(table.userId),
    versionIdx: index("terms_consents_version_id_idx").on(table.termsVersionId),
  }),
);

export type TermsVersion = typeof termsVersionsTable.$inferSelect;
export type TermsConsent = typeof termsConsentsTable.$inferSelect;
