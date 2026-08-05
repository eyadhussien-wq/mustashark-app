import {
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const commentStatusEnum = pgEnum("comment_status", [
  "none",
  "pending",
  "approved",
  "rejected",
]);

export const lawyerReviewsTable = pgTable(
  "lawyer_reviews",
  {
    id: text("id").primaryKey(),
    /** Local mobile consultation ID — not a FK, bookings are local-only in the mobile app */
    consultationId: text("consultation_id").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => usersTable.id),
    lawyerId: text("lawyer_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    stars: integer("stars").notNull(),
    comment: text("comment"),
    commentStatus: commentStatusEnum("comment_status").notNull().default("none"),
    reviewedBy: text("reviewed_by").references(() => usersTable.id),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("lawyer_reviews_client_consultation_unique").on(
      table.clientId,
      table.consultationId,
    ),
  ],
);

export const insertLawyerReviewSchema = createInsertSchema(lawyerReviewsTable).omit({
  createdAt: true,
});
export const selectLawyerReviewSchema = createSelectSchema(lawyerReviewsTable);

export type InsertLawyerReview = z.infer<typeof insertLawyerReviewSchema>;
export type LawyerReview = typeof lawyerReviewsTable.$inferSelect;
