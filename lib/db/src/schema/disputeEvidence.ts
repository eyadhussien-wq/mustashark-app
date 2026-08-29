import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { disputesTable } from "./disputes";

export const disputeEvidenceTypeEnum = pgEnum("dispute_evidence_type", [
  "document",
  "message",
  "payment",
  "milestone_proof",
  "other",
]);

export const disputeEvidenceStatusEnum = pgEnum("dispute_evidence_status", [
  "submitted",
  "accepted",
  "rejected",
]);

export const disputeEvidenceTable = pgTable(
  "dispute_evidence",
  {
    id: text("id").primaryKey(),
    disputeId: text("dispute_id")
      .notNull()
      .references(() => disputesTable.id, { onDelete: "cascade" }),
    submittedBy: text("submitted_by")
      .notNull()
      .references(() => usersTable.id),
    evidenceType: disputeEvidenceTypeEnum("evidence_type").notNull(),
    storageKey: text("storage_key"),
    contentHash: text("content_hash"),
    description: text("description"),
    sourceReference: text("source_reference"),
    status: disputeEvidenceStatusEnum("status").notNull().default("submitted"),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: text("reviewed_by").references(() => usersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    disputeIdx: index("dispute_evidence_dispute_id_idx").on(table.disputeId),
    submitterIdx: index("dispute_evidence_submitted_by_idx").on(table.submittedBy),
    statusIdx: index("dispute_evidence_status_idx").on(table.status),
    contentHashIdx: index("dispute_evidence_content_hash_idx").on(table.contentHash),
    sourceReferenceUnique: uniqueIndex("dispute_evidence_source_reference_uidx").on(table.sourceReference),
  }),
);

export type DisputeEvidence = typeof disputeEvidenceTable.$inferSelect;
export type InsertDisputeEvidence = typeof disputeEvidenceTable.$inferInsert;
