import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users.ts";

export const consultationEventsTable = pgTable("consultation_events", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  eventType: text("event_type").notNull(),
  actorId: text("actor_id").references(() => usersTable.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
