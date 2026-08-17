import { pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { representationQuotesTable } from "./representationFinance";

export const representationQuoteRequestStatusEnum = pgEnum("representation_quote_request_status", [
  "draft",
  "submitted",
  "under_review",
  "withdrawn",
  "expired",
  "converted_to_quote",
]);

export const representationQuoteRequestsTable = pgTable(
  "representation_quote_requests",
  {
    id: text("id").primaryKey(),
    serialNumber: text("serial_number").notNull(),
    clientId: text("client_id").notNull().references(() => usersTable.id),
    lawyerId: text("lawyer_id").references(() => usersTable.id),
    quoteId: text("quote_id").references(() => representationQuotesTable.id),
    title: text("title").notNull(),
    description: text("description"),
    status: representationQuoteRequestStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    submittedAt: timestamp("submitted_at"),
    cancelledAt: timestamp("cancelled_at"),
    cancelledBy: text("cancelled_by").references(() => usersTable.id),
  },
  (table) => ({
    serialNumberUnique: uniqueIndex("representation_quote_requests_serial_number_uq").on(table.serialNumber),
    quoteIdUnique: uniqueIndex("representation_quote_requests_quote_id_uq").on(table.quoteId),
  }),
);

export type RepresentationQuoteRequest = typeof representationQuoteRequestsTable.$inferSelect;
export type NewRepresentationQuoteRequest = typeof representationQuoteRequestsTable.$inferInsert;
