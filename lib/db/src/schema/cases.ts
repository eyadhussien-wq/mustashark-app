import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { agreementsTable } from "./agreements";

export const caseStatusEnum = pgEnum("case_status", ["active", "completed", "closed"]);

export const casesTable = pgTable(
  "cases",
  {
    id: text("id").primaryKey(),
    agreementId: text("agreement_id")
      .notNull()
      .references(() => agreementsTable.id),
    clientId: text("client_id")
      .notNull()
      .references(() => usersTable.id),
    lawyerId: text("lawyer_id")
      .notNull()
      .references(() => usersTable.id),
    status: caseStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    closedAt: timestamp("closed_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    agreementUnique: uniqueIndex("cases_agreement_id_uidx").on(table.agreementId),
    clientIdx: index("cases_client_id_idx").on(table.clientId),
    lawyerIdx: index("cases_lawyer_id_idx").on(table.lawyerId),
    statusIdx: index("cases_status_idx").on(table.status),
  }),
);

export type Case = typeof casesTable.$inferSelect;
export type InsertCase = typeof casesTable.$inferInsert;
