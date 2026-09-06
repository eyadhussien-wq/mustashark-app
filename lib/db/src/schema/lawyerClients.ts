import { pgTable, pgEnum, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users.ts";

export const lawyerClientStatusEnum = pgEnum("lawyer_client_status", ["active", "archived"]);

export const lawyerClientsTable = pgTable("lawyer_clients", {
  id: text("id").primaryKey(),
  lawyerId: text("lawyer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  clientId: text("client_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  status: lawyerClientStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  archivedAt: timestamp("archived_at"),
}, (table) => [
  uniqueIndex("lawyer_clients_lawyer_client_uq").on(table.lawyerId, table.clientId),
  index("lawyer_clients_lawyer_id_idx").on(table.lawyerId),
  index("lawyer_clients_client_id_idx").on(table.clientId),
  index("lawyer_clients_status_idx").on(table.status),
]);

export type LawyerClient = typeof lawyerClientsTable.$inferSelect;
export type InsertLawyerClient = typeof lawyerClientsTable.$inferInsert;
