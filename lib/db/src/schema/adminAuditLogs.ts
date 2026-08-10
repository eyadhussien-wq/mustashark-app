import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const adminAuditLogsTable = pgTable("admin_audit_logs", {
  id: text("id").primaryKey(),

  adminId: text("admin_id")
    .notNull()
    .references(() => usersTable.id),

  action: text("action").notNull(),

  entityType: text("entity_type").notNull(),

  entityId: text("entity_id"),

  description: text("description"),

  beforeData: jsonb("before_data"),

  afterData: jsonb("after_data"),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});
