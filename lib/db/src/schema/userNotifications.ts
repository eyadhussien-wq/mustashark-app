import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const notificationKindEnum = pgEnum("notification_kind", [
  "info",
  "success",
  "warning",
  "error",
  "verification",
  "finance",
]);

export const userNotificationsTable = pgTable("user_notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  kind: notificationKindEnum("kind").notNull().default("info"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  icon: text("icon"),
  accentColor: text("accent_color"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type UserNotification = typeof userNotificationsTable.$inferSelect;
export type InsertUserNotification = typeof userNotificationsTable.$inferInsert;
