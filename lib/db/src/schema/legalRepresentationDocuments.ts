import { AnyPgColumn, pgEnum, pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { agreementsTable } from "./agreements";
import { casesTable } from "./cases";

export const legalRepresentationDocumentTypeEnum = pgEnum("legal_representation_document_type", [
  "poa",
  "court_proof",
  "expert_report",
]);

export const legalRepresentationDocumentStatusEnum = pgEnum("legal_representation_document_status", [
  "uploaded",
  "submitted",
  "under_review",
  "verified",
  "rejected",
  "superseded",
]);

export const legalRepresentationDocumentUploaderRoleEnum = pgEnum(
  "legal_representation_document_uploader_role",
  ["client", "lawyer", "admin"],
);

export const legalRepresentationDocumentsTable = pgTable(
  "legal_representation_documents",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreement_id")
      .notNull()
      .references(() => agreementsTable.id),
    caseId: text("case_id").references(() => casesTable.id),
    documentType: legalRepresentationDocumentTypeEnum("document_type").notNull(),
    status: legalRepresentationDocumentStatusEnum("status").notNull().default("uploaded"),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => usersTable.id),
    uploadedByRole: legalRepresentationDocumentUploaderRoleEnum("uploaded_by_role").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type"),
    storageKey: text("storage_key").notNull(),
    contentHash: text("content_hash").notNull(),
    title: text("title").notNull(),
    courtName: text("court_name"),
    caseNumberReference: text("case_number_reference"),
    issuedAt: timestamp("issued_at"),
    submittedAt: timestamp("submitted_at"),
    reviewStartedAt: timestamp("review_started_at"),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: text("verified_by").references(() => usersTable.id, { onDelete: "set null" }),
    rejectedAt: timestamp("rejected_at"),
    rejectionReason: text("rejection_reason"),
    supersededAt: timestamp("superseded_at"),
    supersedesDocumentId: text("supersedes_document_id").references(
      (): AnyPgColumn => legalRepresentationDocumentsTable.id,
      { onDelete: "set null" },
    ),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    agreementIdx: index("legal_representation_documents_agreement_id_idx").on(table.agreementId),
    caseIdx: index("legal_representation_documents_case_id_idx").on(table.caseId),
    statusIdx: index("legal_representation_documents_status_idx").on(table.status),
    typeIdx: index("legal_representation_documents_type_idx").on(table.documentType),
    contentHashIdx: index("legal_representation_documents_content_hash_idx").on(table.contentHash),
  }),
);

export const insertLegalRepresentationDocumentSchema = createInsertSchema(
  legalRepresentationDocumentsTable,
).omit({ createdAt: true, updatedAt: true });
export const selectLegalRepresentationDocumentSchema = createSelectSchema(
  legalRepresentationDocumentsTable,
);
export type InsertLegalRepresentationDocument = z.infer<
  typeof insertLegalRepresentationDocumentSchema
>;
export type LegalRepresentationDocument = typeof legalRepresentationDocumentsTable.$inferSelect;
