import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { representationQuotesTable } from "./representationFinance";

export const agreementStatusEnum = pgEnum("agreement_status", [
  "draft",
  "prepared",
  "awaiting_confirmation",
  "confirmed",
  "superseded",
  "cancelled",
  "expired",
]);

export const agreementVersionStatusEnum = pgEnum("agreement_version_status", [
  "draft",
  "prepared",
  "published",
  "superseded",
]);

export const agreementActorRoleEnum = pgEnum("agreement_actor_role", ["client", "lawyer"]);

export const agreementsTable = pgTable(
  "agreements",
  {
    id: text("id").primaryKey(),
    quoteId: text("quote_id").notNull().references(() => representationQuotesTable.id),
    clientId: text("client_id").notNull().references(() => usersTable.id),
    lawyerId: text("lawyer_id").notNull().references(() => usersTable.id),
    status: agreementStatusEnum("status").notNull().default("draft"),
    currentVersionId: text("current_version_id"),
    confirmedAt: timestamp("confirmed_at"),
    confirmedBy: text("confirmed_by").references(() => usersTable.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    quoteIdx: index("agreements_quote_id_idx").on(table.quoteId),
    clientIdx: index("agreements_client_id_idx").on(table.clientId),
    lawyerIdx: index("agreements_lawyer_id_idx").on(table.lawyerId),
  }),
);

export const agreementVersionsTable = pgTable(
  "agreement_versions",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreement_id").notNull().references(() => agreementsTable.id),
    version: integer("version").notNull(),
    status: agreementVersionStatusEnum("status").notNull().default("draft"),
    content: text("content").notNull(),
    contentHash: text("content_hash").notNull(),
    createdBy: text("created_by").notNull().references(() => usersTable.id),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    agreementVersionUidx: uniqueIndex("agreement_versions_agreement_version_uidx").on(
      table.agreementId,
      table.version,
    ),
    contentHashIdx: index("agreement_versions_content_hash_idx").on(table.contentHash),
  }),
);

export const agreementConfirmationsTable = pgTable(
  "agreement_confirmations",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreement_id").notNull().references(() => agreementsTable.id),
    agreementVersionId: text("agreement_version_id").notNull().references(() => agreementVersionsTable.id),
    actorUserId: text("actor_user_id").notNull().references(() => usersTable.id),
    actorRole: agreementActorRoleEnum("actor_role").notNull(),
    confirmedAt: timestamp("confirmed_at").notNull().defaultNow(),
    contentHash: text("content_hash").notNull(),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    actorConfirmationUidx: uniqueIndex("agreement_confirmations_actor_uidx").on(
      table.agreementId,
      table.agreementVersionId,
      table.actorUserId,
    ),
    idempotencyUidx: uniqueIndex("agreement_confirmations_idempotency_uidx").on(
      table.agreementId,
      table.idempotencyKey,
    ),
  }),
);

export const agreementEvidenceTable = pgTable(
  "agreement_evidence",
  {
    id: text("id").primaryKey(),
    confirmationId: text("confirmation_id").notNull().references(() => agreementConfirmationsTable.id),
    agreementId: text("agreement_id").notNull().references(() => agreementsTable.id),
    agreementVersionId: text("agreement_version_id").notNull().references(() => agreementVersionsTable.id),
    actorUserId: text("actor_user_id").notNull().references(() => usersTable.id),
    contentHash: text("content_hash").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    confirmationUidx: uniqueIndex("agreement_evidence_confirmation_uidx").on(table.confirmationId),
    agreementIdx: index("agreement_evidence_agreement_id_idx").on(table.agreementId),
    versionIdx: index("agreement_evidence_version_id_idx").on(table.agreementVersionId),
  }),
);

export type Agreement = typeof agreementsTable.$inferSelect;
export type AgreementVersion = typeof agreementVersionsTable.$inferSelect;
export type AgreementConfirmation = typeof agreementConfirmationsTable.$inferSelect;
export type AgreementEvidence = typeof agreementEvidenceTable.$inferSelect;
