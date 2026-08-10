import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const adminRolesTable = pgTable("admin_roles", {
  id: text("id").primaryKey(),

  name: text("name").notNull().unique(),

  description: text("description"),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});
