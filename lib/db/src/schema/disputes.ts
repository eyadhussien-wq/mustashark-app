import { sql } from "drizzle-orm";
import { check, index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { casesTable } from "./cases";
import { usersTable } from "./users";

export const disputeLifecycleStateEnum = pgEnum("dispute_lifecycle_state", [
  "open",
  "mediation",
  "admin_review",
  "decision_pending",
  "resolution_pending",
  "closed",
]);

export const disputeResolutionOutcomeEnum = pgEnum("dispute_resolution_outcome", [
  "client",
  "lawyer",
  "split",
  "dismissed",
]);

export const disputesTable = pgTable(
  "disputes",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => casesTable.id, { onDelete: "restrict" }),
    openedBy: text("opened_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    lifecycleState: disputeLifecycleStateEnum("lifecycle_state").notNull().default("open"),
    resolutionOutcome: disputeResolutionOutcomeEnum("resolution_outcome"),
    version: integer("version").notNull().default(1),
    openedAt: timestamp("opened_at").notNull().defaultNow(),
    closedAt: timestamp("closed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    caseIdx: index("disputes_case_id_idx").on(table.caseId),
    lifecycleStateIdx: index("disputes_lifecycle_state_idx").on(table.lifecycleState),
    openedByIdx: index("disputes_opened_by_idx").on(table.openedBy),
    versionPositiveCk: check("disputes_version_positive_ck", sql`${table.version} > 0`),
    closedOutcomeCk: check(
      "disputes_closed_outcome_ck",
      sql`(${table.lifecycleState} = 'closed' AND ${table.resolutionOutcome} IS NOT NULL) OR (${table.lifecycleState} <> 'closed' AND ${table.resolutionOutcome} IS NULL)`,
    ),
  }),
);

export type Dispute = typeof disputesTable.$inferSelect;
export type InsertDispute = typeof disputesTable.$inferInsert;
