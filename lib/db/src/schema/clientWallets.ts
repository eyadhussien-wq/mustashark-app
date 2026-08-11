import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const clientWalletsTable = pgTable("client_wallets", {
  clientId: text("client_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  availableCredits: numeric("available_credits", { precision: 10, scale: 2 }).notNull().default("0"),
  totalRefunded: numeric("total_refunded", { precision: 10, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertClientWalletSchema = createInsertSchema(clientWalletsTable).omit({ updatedAt: true });
export const selectClientWalletSchema = createSelectSchema(clientWalletsTable);
export type InsertClientWallet = z.infer<typeof insertClientWalletSchema>;
export type ClientWallet = typeof clientWalletsTable.$inferSelect;
