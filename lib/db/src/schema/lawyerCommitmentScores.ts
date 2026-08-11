import { pgTable, text, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const lawyerCommitmentScoresTable = pgTable("lawyer_commitment_scores", {
  lawyerId: text("lawyer_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  score: numeric("score", { precision: 5, scale: 2 }).notNull().default("100"),
  noShowCount: integer("no_show_count").notNull().default(0),
  lastNoShowAt: timestamp("last_no_show_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLawyerCommitmentScoreSchema = createInsertSchema(lawyerCommitmentScoresTable).omit({ updatedAt: true });
export const selectLawyerCommitmentScoreSchema = createSelectSchema(lawyerCommitmentScoresTable);
export type InsertLawyerCommitmentScore = z.infer<typeof insertLawyerCommitmentScoreSchema>;
export type LawyerCommitmentScore = typeof lawyerCommitmentScoresTable.$inferSelect;
