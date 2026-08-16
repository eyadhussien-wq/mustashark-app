import { pgTable, text, integer, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const idempotencyKeysTable = pgTable(
  "idempotency_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    route: text("route").notNull(),
    method: text("method").notNull(),
    requestHash: text("request_hash").notNull(),
    responseStatus: integer("response_status"),
    responseBody: jsonb("response_body"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => ({
    requestUnique: uniqueIndex("idempotency_keys_request_uq").on(table.userId, table.key, table.route, table.method),
  }),
);
