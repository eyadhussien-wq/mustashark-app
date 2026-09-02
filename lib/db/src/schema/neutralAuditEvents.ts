import { pgEnum, pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const neutralAuditOutcomeEnum = pgEnum("neutral_audit_outcome", [
  "allowed",
  "denied",
]);

export const neutralAuditResourceTypeEnum = pgEnum("neutral_audit_resource_type", [
  "client",
  "matter",
  "document",
  "schedule",
  "message",
  "export",
]);

export const neutralAuditEventsTable = pgTable("neutral_audit_events", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(),
  resourceType: neutralAuditResourceTypeEnum("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  outcome: neutralAuditOutcomeEnum("outcome").notNull(),
  reasonCode: text("reason_code"),
  correlationId: text("correlation_id"),
  metadata: jsonb("metadata"),
  targetEventId: text("target_event_id"),
  chainVersion: text("chain_version").notNull().default("1"),
  canonicalizationVersion: text("canonicalization_version").notNull().default("1"),
  genesisHash: text("genesis_hash").notNull(),
  previousHash: text("previous_hash"),
  eventHash: text("event_hash").notNull(),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
}, (table) => [
  index("neutral_audit_events_actor_occurred_idx").on(table.actorUserId, table.occurredAt),
  index("neutral_audit_events_resource_occurred_idx").on(table.resourceType, table.resourceId, table.occurredAt),
  index("neutral_audit_events_correlation_idx").on(table.correlationId),
  index("neutral_audit_events_actor_chain_idx").on(table.actorUserId, table.occurredAt, table.id),
  index("neutral_audit_events_target_event_idx").on(table.targetEventId),
]);

export type NeutralAuditEventRow = typeof neutralAuditEventsTable.$inferSelect;
export type InsertNeutralAuditEventRow = typeof neutralAuditEventsTable.$inferInsert;
