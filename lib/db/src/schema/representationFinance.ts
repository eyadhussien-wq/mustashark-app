import { pgEnum, pgTable, text, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users.ts";

export const quoteCurrencyEnum = pgEnum("quote_currency", ["QAR", "JOD"]);
export const representationQuoteStatusEnum = pgEnum("representation_quote_status", [
  "draft",
  "sent",
  "accepted",
  "funding",
  "active",
  "completed",
  "cancelled",
  "disputed",
]);
export const escrowFundingModeEnum = pgEnum("escrow_funding_mode", ["full", "per_stage"]);
export const milestoneStageEnum = pgEnum("representation_milestone_stage", ["stage_1", "stage_2", "stage_3"]);
export const milestoneStatusEnum = pgEnum("representation_milestone_status", [
  "awaiting_deposit",
  "funded",
  "in_progress",
  "proof_submitted",
  "under_review",
  "released",
  "disputed",
  "paused",
  "cancelled",
]);
export const escrowTransactionTypeEnum = pgEnum("escrow_transaction_type", [
  "deposit",
  "stage_allocation",
  "release",
  "refund",
  "commission",
  "adjustment",
]);
export const escrowTransactionStatusEnum = pgEnum("escrow_transaction_status", ["pending", "posted", "reversed"]);
export const proofStatusEnum = pgEnum("milestone_proof_status", ["submitted", "approved", "disputed", "auto_released", "rejected"]);
export const releaseRequestStatusEnum = pgEnum("milestone_release_request_status", ["pending", "approved", "disputed", "auto_released", "cancelled"]);
export const walletTransactionTypeEnum = pgEnum("lawyer_wallet_transaction_type", ["milestone_payout", "withdrawal", "withdrawal_reversal", "adjustment"]);
export const walletTransactionStatusEnum = pgEnum("lawyer_wallet_transaction_status", ["pending", "posted", "reversed"]);

export const lawyerSettingsTable = pgTable("lawyer_settings", {
  lawyerId: text("lawyer_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  representationInstallmentsEnabled: boolean("representation_installments_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const representationQuotesTable = pgTable("representation_quotes", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => usersTable.id),
  lawyerId: text("lawyer_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  description: text("description"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
  currency: quoteCurrencyEnum("currency").notNull(),
  status: representationQuoteStatusEnum("status").notNull().default("draft"),
  fundingMode: escrowFundingModeEnum("funding_mode"),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const representationMilestonesTable = pgTable("representation_milestones", {
  id: text("id").primaryKey(),
  quoteId: text("quote_id").notNull().references(() => representationQuotesTable.id, { onDelete: "cascade" }),
  stage: milestoneStageEnum("stage").notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  title: text("title").notNull(),
  status: milestoneStatusEnum("status").notNull().default("awaiting_deposit"),
  fundedAt: timestamp("funded_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  pausedAt: timestamp("paused_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const escrowAccountsTable = pgTable("escrow_accounts", {
  id: text("id").primaryKey(),
  quoteId: text("quote_id").notNull().unique().references(() => representationQuotesTable.id, { onDelete: "cascade" }),
  currency: quoteCurrencyEnum("currency").notNull(),
  depositedAmount: numeric("deposited_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  allocatedAmount: numeric("allocated_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  releasedAmount: numeric("released_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  refundedAmount: numeric("refunded_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const escrowTransactionsTable = pgTable("escrow_transactions", {
  id: text("id").primaryKey(),
  escrowAccountId: text("escrow_account_id").notNull().references(() => escrowAccountsTable.id, { onDelete: "cascade" }),
  milestoneId: text("milestone_id").references(() => representationMilestonesTable.id),
  type: escrowTransactionTypeEnum("type").notNull(),
  status: escrowTransactionStatusEnum("status").notNull().default("pending"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: quoteCurrencyEnum("currency").notNull(),
  reference: text("reference"),
  createdBy: text("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const milestoneProofsTable = pgTable("milestone_proofs", {
  id: text("id").primaryKey(),
  milestoneId: text("milestone_id").notNull().references(() => representationMilestonesTable.id, { onDelete: "cascade" }),
  lawyerId: text("lawyer_id").notNull().references(() => usersTable.id),
  documentKey: text("document_key").notNull(),
  proofType: text("proof_type"),
  note: text("note"),
  status: proofStatusEnum("status").notNull().default("submitted"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const milestoneReleaseRequestsTable = pgTable("milestone_release_requests", {
  id: text("id").primaryKey(),
  milestoneId: text("milestone_id").notNull().references(() => representationMilestonesTable.id, { onDelete: "cascade" }),
  proofId: text("proof_id").notNull().references(() => milestoneProofsTable.id),
  clientId: text("client_id").notNull().references(() => usersTable.id),
  lawyerId: text("lawyer_id").notNull().references(() => usersTable.id),
  status: releaseRequestStatusEnum("status").notNull().default("pending"),
  reviewDeadlineAt: timestamp("review_deadline_at").notNull(),
  decidedAt: timestamp("decided_at"),
  disputeReason: text("dispute_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const commissionTiersTable = pgTable("commission_tiers", {
  id: text("id").primaryKey(),
  country: text("country").notNull(),
  currency: quoteCurrencyEnum("currency").notNull(),
  minQuoteAmount: numeric("min_quote_amount", { precision: 14, scale: 2 }).notNull(),
  maxQuoteAmount: numeric("max_quote_amount", { precision: 14, scale: 2 }),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lawyerWalletsTable = pgTable("lawyer_wallets", {
  id: text("id").primaryKey(),
  lawyerId: text("lawyer_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  currency: quoteCurrencyEnum("currency").notNull(),
  availableBalance: numeric("available_balance", { precision: 14, scale: 2 }).notNull().default("0"),
  pendingBalance: numeric("pending_balance", { precision: 14, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lawyerWalletTransactionsTable = pgTable("lawyer_wallet_transactions", {
  id: text("id").primaryKey(),
  walletId: text("wallet_id").notNull().references(() => lawyerWalletsTable.id, { onDelete: "cascade" }),
  milestoneId: text("milestone_id").references(() => representationMilestonesTable.id),
  type: walletTransactionTypeEnum("type").notNull(),
  status: walletTransactionStatusEnum("status").notNull().default("pending"),
  grossAmount: numeric("gross_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  commissionAmount: numeric("commission_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  netAmount: numeric("net_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  currency: quoteCurrencyEnum("currency").notNull(),
  reference: text("reference"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LawyerSettings = typeof lawyerSettingsTable.$inferSelect;
export type RepresentationQuote = typeof representationQuotesTable.$inferSelect;
export type RepresentationMilestone = typeof representationMilestonesTable.$inferSelect;
export type EscrowAccount = typeof escrowAccountsTable.$inferSelect;
export type EscrowTransaction = typeof escrowTransactionsTable.$inferSelect;
export type MilestoneProof = typeof milestoneProofsTable.$inferSelect;
export type MilestoneReleaseRequest = typeof milestoneReleaseRequestsTable.$inferSelect;
export type CommissionTier = typeof commissionTiersTable.$inferSelect;
export type LawyerWallet = typeof lawyerWalletsTable.$inferSelect;
export type LawyerWalletTransaction = typeof lawyerWalletTransactionsTable.$inferSelect;
