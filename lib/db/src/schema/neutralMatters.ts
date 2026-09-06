import { pgTable, pgEnum, text, timestamp, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users.ts";

export const neutralMatterStatusEnum = pgEnum("neutral_matter_status", [
  "active",
  "completed",
  "archived",
]);

export const neutralMattersTable = pgTable("neutral_matters", {
  id: text("id").primaryKey(),
  lawyerId: text("lawyer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  clientId: text("client_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: neutralMatterStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  archivedAt: timestamp("archived_at"),
}, (table) => [
  index("neutral_matters_lawyer_id_idx").on(table.lawyerId),
  index("neutral_matters_client_id_idx").on(table.clientId),
  index("neutral_matters_status_idx").on(table.status),
]);

export type NeutralMatterRow = typeof neutralMattersTable.$inferSelect;
export type InsertNeutralMatterRow = typeof neutralMattersTable.$inferInsert;
