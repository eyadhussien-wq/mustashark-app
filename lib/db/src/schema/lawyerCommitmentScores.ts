import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const lawyerCommitmentScoresTable = pgTable("lawyer_commitment_scores", {
  id: text("id").primaryKey(),
  lawyerId: text("lawyer_id").notNull().references(() => usersTable.id),
  pointsChange: integer("points_change").notNull(),
  reason: text("reason").notNull(),
  relatedBookingId: text("related_booking_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
