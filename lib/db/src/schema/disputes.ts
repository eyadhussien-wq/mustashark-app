import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { representationMilestonesTable, representationQuotesTable, milestoneReleaseRequestsTable } from "./representationFinance";

export const disputeStatusEnum = pgEnum("dispute_status", [
  "open",
  "under_review",
  "resolved_client",
  "resolved_lawyer",
  "resolved_split",
  "closed",
  "cancelled",
]);

export const disputeResolutionEnum = pgEnum("dispute_resolution", [
  "client",
  "lawyer",
  "split",
  "dismissed",
]);

export const disputesTable = pgTable(
  "disputes",
  {
    id: text("id").primaryKey(),
    releaseRequestId: text("release_request_id")
      .notNull()
      .references(() => milestoneReleaseRequestsTable.id, { onDelete: "restrict" }),
    milestoneId: text("milestone_id")
      .notNull()
      .references(() => representationMilestonesTable.id, { onDelete: "restrict" }),
    quoteId: text("quote_id")
      .notNull()
      .references(() => representationQuotesTable.id, { onDelete: "restrict" }),
    clientId: text("client_id").notNull().references(() => usersTable.id),
    lawyerId: text("lawyer_id").notNull().references(() => usersTable.id),
    reason: text("reason").notNull(),
    status: disputeStatusEnum("status").notNull().default("open"),
    resolution: disputeResolutionEnum("resolution"),
    resolutionNote: text("resolution_note"),
    resolvedBy: text("resolved_by").references(() => usersTable.id),
    resolvedAt: timestamp("resolved_at"),
    closedAt: timestamp("closed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    releaseRequestUnique: uniqueIndex("disputes_release_request_uidx").on(table.releaseRequestId),
    milestoneIdx: index("disputes_milestone_id_idx").on(table.milestoneId),
    quoteIdx: index("disputes_quote_id_idx").on(table.quoteId),
    clientIdx: index("disputes_client_id_idx").on(table.clientId),
    lawyerIdx: index("disputes_lawyer_id_idx").on(table.lawyerId),
    statusIdx: index("disputes_status_idx").on(table.status),
  }),
);

export type Dispute = typeof disputesTable.$inferSelect;
export type InsertDispute = typeof disputesTable.$inferInsert;
