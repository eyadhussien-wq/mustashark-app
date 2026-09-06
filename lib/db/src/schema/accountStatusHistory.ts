import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users.ts";

export const accountStatusHistoryTable = pgTable("account_status_history", {
  id: text("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id),

  oldStatus: text("old_status"),

  newStatus: text("new_status").notNull(),

  reason: text("reason"),

  changedBy: text("changed_by")
    .notNull()
    .references(() => usersTable.id),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});
