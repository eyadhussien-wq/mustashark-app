import { pgEnum, pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users.ts";
import { neutralMattersTable } from "./neutralMatters.ts";

export const neutralDocumentStatusEnum = pgEnum("neutral_document_status", [
  "draft",
  "active",
  "archived",
]);

export const neutralDocumentShareStatusEnum = pgEnum("neutral_document_share_status", [
  "active",
  "revoked",
]);

export const neutralDocumentsTable = pgTable("neutral_documents", {
  id: text("id").primaryKey(),
  lawyerId: text("lawyer_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  matterId: text("matter_id").references(() => neutralMattersTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  storageKey: text("storage_key").notNull(),
  contentHash: text("content_hash"),
  status: neutralDocumentStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  archivedAt: timestamp("archived_at"),
}, (table) => [
  index("neutral_documents_lawyer_id_idx").on(table.lawyerId),
  index("neutral_documents_matter_id_idx").on(table.matterId),
  index("neutral_documents_lawyer_status_idx").on(table.lawyerId, table.status),
]);

export const neutralDocumentSharesTable = pgTable("neutral_document_shares", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => neutralDocumentsTable.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  status: neutralDocumentShareStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  revokedAt: timestamp("revoked_at"),
}, (table) => [
  uniqueIndex("neutral_document_shares_document_client_uq").on(table.documentId, table.clientId),
  index("neutral_document_shares_client_status_idx").on(table.clientId, table.status),
  index("neutral_document_shares_document_status_idx").on(table.documentId, table.status),
]);

export type NeutralDocumentRow = typeof neutralDocumentsTable.$inferSelect;
export type InsertNeutralDocumentRow = typeof neutralDocumentsTable.$inferInsert;
export type NeutralDocumentShareRow = typeof neutralDocumentSharesTable.$inferSelect;
export type InsertNeutralDocumentShareRow = typeof neutralDocumentSharesTable.$inferInsert;
