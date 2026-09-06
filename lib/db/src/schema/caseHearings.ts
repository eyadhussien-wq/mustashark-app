import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { casesTable } from "./cases.ts";
import { usersTable } from "./users.ts";

export const caseHearingStatusEnum = pgEnum("case_hearing_status", [
  "scheduled",
  "completed",
  "postponed",
  "cancelled",
]);

export const caseHearingsTable = pgTable(
  "case_hearings",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => casesTable.id, { onDelete: "cascade" }),
    hearingType: text("hearing_type").notNull(),
    scheduledAt: timestamp("scheduled_at").notNull(),
    courtName: text("court_name"),
    judgeName: text("judge_name"),
    status: caseHearingStatusEnum("status").notNull().default("scheduled"),
    notes: text("notes"),
    outcome: text("outcome"),
    createdBy: text("created_by")
      .notNull()
      .references(() => usersTable.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    caseScheduledAtIdx: index("case_hearings_case_scheduled_at_idx").on(
      table.caseId,
      table.scheduledAt,
    ),
    caseStatusIdx: index("case_hearings_case_status_idx").on(
      table.caseId,
      table.status,
    ),
  }),
);

export type CaseHearing = typeof caseHearingsTable.$inferSelect;
export type InsertCaseHearing = typeof caseHearingsTable.$inferInsert;
