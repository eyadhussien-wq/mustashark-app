import { pgEnum, pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const neutralSecurityAlertStatusEnum = pgEnum("neutral_security_alert_status", [
  "open",
  "acknowledged",
  "resolved",
]);

export const neutralSecurityAlertsTable = pgTable("neutral_security_alerts", {
  id: text("id").primaryKey(),
  alertType: text("alert_type").notNull(),
  severity: text("severity").notNull(),
  status: neutralSecurityAlertStatusEnum("status").notNull().default("open"),
  actorUserId: text("actor_user_id").references(() => usersTable.id, { onDelete: "restrict" }),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  correlationId: text("correlation_id"),
  reasonCode: text("reason_code").notNull(),
  details: jsonb("details"),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  index("neutral_security_alerts_status_detected_idx").on(table.status, table.detectedAt),
  index("neutral_security_alerts_actor_detected_idx").on(table.actorUserId, table.detectedAt),
  index("neutral_security_alerts_correlation_idx").on(table.correlationId),
]);

export type NeutralSecurityAlertRow = typeof neutralSecurityAlertsTable.$inferSelect;
export type InsertNeutralSecurityAlertRow = typeof neutralSecurityAlertsTable.$inferInsert;
