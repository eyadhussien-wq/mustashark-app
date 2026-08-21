import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { casesTable } from "./cases";
import { caseHearingsTable } from "./caseHearings";
import { usersTable } from "./users";

export const caseDecisionStatusEnum = pgEnum("case_decision_status", [
  "draft",
  "issued",
  "superseded",
]);

export const caseDecisionsTable = pgTable(
  "case_decisions",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => casesTable.id, { onDelete: "cascade" }),
    hearingId: text("hearing_id").references(() => caseHearingsTable.id, {
      onDelete: "set null",
    }),
    decisionType: text("decision_type").notNull(),
    title: text("title").notNull(),
    decisionDate: timestamp("decision_date"),
    judgeName: text("judge_name"),
    summary: text("summary"),
    outcome: text("outcome"),
    status: caseDecisionStatusEnum("status").notNull().default("draft"),
    createdBy: text("created_by")
      .notNull()
      .references(() => usersTable.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    caseDecisionDateIdx: index("case_decisions_case_decision_date_idx").on(
      table.caseId,
      table.decisionDate,
    ),
    caseStatusIdx: index("case_decisions_case_status_idx").on(
      table.caseId,
      table.status,
    ),
    hearingIdx: index("case_decisions_hearing_id_idx").on(table.hearingId),
  }),
);

export type CaseDecision = typeof caseDecisionsTable.$inferSelect;
export type InsertCaseDecision = typeof caseDecisionsTable.$inferInsert;
