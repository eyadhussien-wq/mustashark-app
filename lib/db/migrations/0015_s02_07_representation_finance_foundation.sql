BEGIN;

CREATE TYPE "quote_currency" AS ENUM ('QAR', 'JOD');

CREATE TYPE "representation_quote_status" AS ENUM (
  'draft',
  'sent',
  'accepted',
  'funding',
  'active',
  'completed',
  'cancelled',
  'disputed'
);

CREATE TYPE "escrow_funding_mode" AS ENUM ('full', 'per_stage');

CREATE TYPE "representation_milestone_stage" AS ENUM (
  'stage_1',
  'stage_2',
  'stage_3'
);

CREATE TYPE "representation_milestone_status" AS ENUM (
  'awaiting_deposit',
  'funded',
  'in_progress',
  'proof_submitted',
  'under_review',
  'released',
  'disputed',
  'paused',
  'cancelled'
);

CREATE TYPE "escrow_transaction_type" AS ENUM (
  'deposit',
  'stage_allocation',
  'release',
  'refund',
  'commission',
  'adjustment'
);

CREATE TYPE "escrow_transaction_status" AS ENUM (
  'pending',
  'posted',
  'reversed'
);

CREATE TYPE "milestone_proof_status" AS ENUM (
  'submitted',
  'approved',
  'disputed',
  'auto_released',
  'rejected'
);

CREATE TYPE "milestone_release_request_status" AS ENUM (
  'pending',
  'approved',
  'disputed',
  'auto_released',
  'cancelled'
);

CREATE TYPE "lawyer_wallet_transaction_type" AS ENUM (
  'milestone_payout',
  'withdrawal',
  'withdrawal_reversal',
  'adjustment'
);

CREATE TYPE "lawyer_wallet_transaction_status" AS ENUM (
  'pending',
  'posted',
  'reversed'
);

CREATE TABLE "lawyer_settings" (
  "lawyer_id" text PRIMARY KEY NOT NULL,
  "representation_installments_enabled" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "lawyer_settings_lawyer_id_fk"
    FOREIGN KEY ("lawyer_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "representation_quotes" (
  "id" text PRIMARY KEY NOT NULL,
  "client_id" text NOT NULL,
  "lawyer_id" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "total_amount" numeric(14,2) NOT NULL,
  "currency" "quote_currency" NOT NULL,
  "status" "representation_quote_status" DEFAULT 'draft' NOT NULL,
  "funding_mode" "escrow_funding_mode",
  "accepted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "representation_quotes_client_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "users"("id"),
  CONSTRAINT "representation_quotes_lawyer_id_fk"
    FOREIGN KEY ("lawyer_id") REFERENCES "users"("id")
);

CREATE TABLE "representation_milestones" (
  "id" text PRIMARY KEY NOT NULL,
  "quote_id" text NOT NULL,
  "stage" "representation_milestone_stage" NOT NULL,
  "percentage" numeric(5,2) NOT NULL,
  "amount" numeric(14,2) NOT NULL,
  "title" text NOT NULL,
  "status" "representation_milestone_status" DEFAULT 'awaiting_deposit' NOT NULL,
  "funded_at" timestamp,
  "started_at" timestamp,
  "completed_at" timestamp,
  "paused_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "representation_milestones_quote_id_fk"
    FOREIGN KEY ("quote_id") REFERENCES "representation_quotes"("id") ON DELETE CASCADE
);

CREATE TABLE "escrow_accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "quote_id" text NOT NULL,
  "currency" "quote_currency" NOT NULL,
  "deposited_amount" numeric(14,2) DEFAULT '0' NOT NULL,
  "allocated_amount" numeric(14,2) DEFAULT '0' NOT NULL,
  "released_amount" numeric(14,2) DEFAULT '0' NOT NULL,
  "refunded_amount" numeric(14,2) DEFAULT '0' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "escrow_accounts_quote_id_fk"
    FOREIGN KEY ("quote_id") REFERENCES "representation_quotes"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "escrow_accounts_quote_id_uidx"
  ON "escrow_accounts" USING btree ("quote_id");

CREATE TABLE "escrow_transactions" (
  "id" text PRIMARY KEY NOT NULL,
  "escrow_account_id" text NOT NULL,
  "milestone_id" text,
  "type" "escrow_transaction_type" NOT NULL,
  "status" "escrow_transaction_status" DEFAULT 'pending' NOT NULL,
  "amount" numeric(14,2) NOT NULL,
  "currency" "quote_currency" NOT NULL,
  "reference" text,
  "created_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "escrow_transactions_escrow_account_id_fk"
    FOREIGN KEY ("escrow_account_id") REFERENCES "escrow_accounts"("id") ON DELETE CASCADE,
  CONSTRAINT "escrow_transactions_milestone_id_fk"
    FOREIGN KEY ("milestone_id") REFERENCES "representation_milestones"("id"),
  CONSTRAINT "escrow_transactions_created_by_fk"
    FOREIGN KEY ("created_by") REFERENCES "users"("id")
);

CREATE TABLE "milestone_proofs" (
  "id" text PRIMARY KEY NOT NULL,
  "milestone_id" text NOT NULL,
  "lawyer_id" text NOT NULL,
  "document_key" text NOT NULL,
  "proof_type" text,
  "note" text,
  "status" "milestone_proof_status" DEFAULT 'submitted' NOT NULL,
  "submitted_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "milestone_proofs_milestone_id_fk"
    FOREIGN KEY ("milestone_id") REFERENCES "representation_milestones"("id") ON DELETE CASCADE,
  CONSTRAINT "milestone_proofs_lawyer_id_fk"
    FOREIGN KEY ("lawyer_id") REFERENCES "users"("id")
);

CREATE TABLE "milestone_release_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "milestone_id" text NOT NULL,
  "proof_id" text NOT NULL,
  "client_id" text NOT NULL,
  "lawyer_id" text NOT NULL,
  "status" "milestone_release_request_status" DEFAULT 'pending' NOT NULL,
  "review_deadline_at" timestamp NOT NULL,
  "decided_at" timestamp,
  "dispute_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "milestone_release_requests_milestone_id_fk"
    FOREIGN KEY ("milestone_id") REFERENCES "representation_milestones"("id") ON DELETE CASCADE,
  CONSTRAINT "milestone_release_requests_proof_id_fk"
    FOREIGN KEY ("proof_id") REFERENCES "milestone_proofs"("id"),
  CONSTRAINT "milestone_release_requests_client_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "users"("id"),
  CONSTRAINT "milestone_release_requests_lawyer_id_fk"
    FOREIGN KEY ("lawyer_id") REFERENCES "users"("id")
);

CREATE TABLE "commission_tiers" (
  "id" text PRIMARY KEY NOT NULL,
  "country" text NOT NULL,
  "currency" "quote_currency" NOT NULL,
  "min_quote_amount" numeric(14,2) NOT NULL,
  "max_quote_amount" numeric(14,2),
  "commission_rate" numeric(5,2) NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "effective_from" timestamp DEFAULT now() NOT NULL,
  "effective_to" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "lawyer_wallets" (
  "id" text PRIMARY KEY NOT NULL,
  "lawyer_id" text NOT NULL,
  "currency" "quote_currency" NOT NULL,
  "available_balance" numeric(14,2) DEFAULT '0' NOT NULL,
  "pending_balance" numeric(14,2) DEFAULT '0' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "lawyer_wallets_lawyer_id_fk"
    FOREIGN KEY ("lawyer_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "lawyer_wallets_lawyer_id_uidx"
  ON "lawyer_wallets" USING btree ("lawyer_id");

CREATE TABLE "lawyer_wallet_transactions" (
  "id" text PRIMARY KEY NOT NULL,
  "wallet_id" text NOT NULL,
  "milestone_id" text,
  "type" "lawyer_wallet_transaction_type" NOT NULL,
  "status" "lawyer_wallet_transaction_status" DEFAULT 'pending' NOT NULL,
  "gross_amount" numeric(14,2) DEFAULT '0' NOT NULL,
  "commission_amount" numeric(14,2) DEFAULT '0' NOT NULL,
  "net_amount" numeric(14,2) DEFAULT '0' NOT NULL,
  "currency" "quote_currency" NOT NULL,
  "reference" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "lawyer_wallet_transactions_wallet_id_fk"
    FOREIGN KEY ("wallet_id") REFERENCES "lawyer_wallets"("id") ON DELETE CASCADE,
  CONSTRAINT "lawyer_wallet_transactions_milestone_id_fk"
    FOREIGN KEY ("milestone_id") REFERENCES "representation_milestones"("id")
);

COMMIT;
