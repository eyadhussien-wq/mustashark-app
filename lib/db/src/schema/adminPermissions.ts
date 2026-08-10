import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const adminPermissionsTable = pgTable("admin_permissions", {
  id: text("id").primaryKey(),

  key: text("key").notNull().unique(),

  description: text("description"),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});
