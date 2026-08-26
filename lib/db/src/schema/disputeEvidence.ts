import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { disputesTable } from "./disputes";
import { usersTable } from "./users";

export const disputeEvidenceReviewStatusEnum = pgEnum("dispute_evidence_review_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const disputeEvidenceTable = pgTable(
  "dispute_evidence",
  {
    id: text("id").primaryKey(),
    disputeId: text("dispute_id")
      .notNull()
      .references(() => disputesTable.id, { onDelete: "restrict" }),
    submittedBy: text("submitted_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    evidenceType: text("evidence_type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type"),
    sha256: text("sha256"),
    reviewStatus: disputeEvidenceReviewStatusEnum("review_status").notNull().default("pending"),
    reviewedBy: text("reviewed_by").references(() => usersTable.id, { onDelete: "restrict" }),
    reviewNote: text("review_note"),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    disputeIdx: index("dispute_evidence_dispute_id_idx").on(table.disputeId),
    submitterIdx: index("dispute_evidence_submitted_by_idx").on(table.submittedBy),
    statusIdx: index("dispute_evidence_review_status_idx").on(table.reviewStatus),
    contentUnique: uniqueIndex("dispute_evidence_content_uidx").on(table.disputeId, table.storageKey, table.sha256),
  }),
);

export type DisputeEvidence = typeof disputeEvidenceTable.$inferSelect;
export type InsertDisputeEvidence = typeof disputeEvidenceTable.$inferInsert;
