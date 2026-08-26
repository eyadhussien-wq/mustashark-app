import { index, pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { agreementsTable } from "./agreements";
import { casesTable } from "./cases";

export const representationAuditLogsTable = pgTable(
  "representation_audit_logs",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").references(() => casesTable.id),
    agreementId: text("agreement_id").references(() => agreementsTable.id),
    actorUserId: text("actor_user_id").references(() => usersTable.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    caseCreatedIdx: index("representation_audit_logs_case_created_idx").on(table.caseId, table.createdAt),
    agreementCreatedIdx: index("representation_audit_logs_agreement_created_idx").on(table.agreementId, table.createdAt),
    actorCreatedIdx: index("representation_audit_logs_actor_created_idx").on(table.actorUserId, table.createdAt),
  }),
);

export type RepresentationAuditLog = typeof representationAuditLogsTable.$inferSelect;
export type InsertRepresentationAuditLog = typeof representationAuditLogsTable.$inferInsert;
