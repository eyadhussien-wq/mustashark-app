import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const termsVersionStatusEnum = pgEnum("terms_version_status", [
  "draft",
  "published",
  "superseded",
]);

export const termsVersionsTable = pgTable(
  "terms_versions",
  {
    id: text("id").primaryKey(),
    version: integer("version").notNull(),
    status: termsVersionStatusEnum("status").notNull().default("draft"),
    content: text("content").notNull(),
    contentHash: text("content_hash").notNull(),
    createdBy: text("created_by").notNull().references(() => usersTable.id),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    versionUidx: uniqueIndex("terms_versions_version_uidx").on(table.version),
    publishedUidx: uniqueIndex("terms_versions_single_published_uidx")
      .on(table.status)
      .where(sql`${table.status} = 'published'`),
    contentHashIdx: index("terms_versions_content_hash_idx").on(table.contentHash),
  }),
);

export const termsConsentsTable = pgTable(
  "terms_consents",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => usersTable.id),
    termsVersionId: text("terms_version_id")
      .notNull()
      .references(() => termsVersionsTable.id),
    consentedAt: timestamp("consented_at").notNull().defaultNow(),
    contentHash: text("content_hash").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
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
