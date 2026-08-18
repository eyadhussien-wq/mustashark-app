import { pgEnum, pgTable, text, timestamp, numeric, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";
import { representationQuoteRequestsTable } from "./representationQuoteRequests";
import { quoteCurrencyEnum } from "./representationFinance";

export const lawyerProposalStatusEnum = pgEnum("lawyer_proposal_status", [
  "draft",
  "submitted",
  "accepted",
  "rejected",
  "withdrawn",
  "expired",
]);

export const lawyerProposalsTable = pgTable(
  "lawyer_proposals",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id").notNull().references(() => representationQuoteRequestsTable.id),
    lawyerId: text("lawyer_id").notNull().references(() => usersTable.id),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: quoteCurrencyEnum("currency").notNull(),
    status: lawyerProposalStatusEnum("status").notNull().default("draft"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  },
  (table) => ({
    requestIdIdx: index("lawyer_proposals_request_id_idx").on(table.requestId),
    lawyerIdIdx: index("lawyer_proposals_lawyer_id_idx").on(table.lawyerId),
    statusIdx: index("lawyer_proposals_status_idx").on(table.status),
    expiresAtIdx: index("lawyer_proposals_expires_at_idx").on(table.expiresAt),
    amountNonNegative: check("lawyer_proposals_amount_non_negative", sql`${table.amount} >= 0`),
  }),
);

export type LawyerProposal = typeof lawyerProposalsTable.$inferSelect;
export type NewLawyerProposal = typeof lawyerProposalsTable.$inferInsert;
