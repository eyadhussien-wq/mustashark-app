BEGIN;

CREATE TYPE "dispute_status" AS ENUM (
  'open',
  'under_review',
  'resolved_client',
  'resolved_lawyer',
  'resolved_split',
  'closed',
  'cancelled'
);

CREATE TYPE "dispute_resolution" AS ENUM ('client', 'lawyer', 'split', 'dismissed');

CREATE TYPE "dispute_evidence_type" AS ENUM (
  'document',
  'message',
  'payment',
  'milestone_proof',
  'other'
);

CREATE TYPE "dispute_evidence_status" AS ENUM ('submitted', 'accepted', 'rejected');

CREATE TABLE "disputes" (
  "id" text PRIMARY KEY NOT NULL,
  "case_id" text NOT NULL,
  "release_request_id" text NOT NULL,
  "milestone_id" text NOT NULL,
  "escrow_account_id" text NOT NULL,
  "quote_id" text NOT NULL,
  "client_id" text NOT NULL,
  "lawyer_id" text NOT NULL,
  "reason" text NOT NULL,
  "status" "dispute_status" DEFAULT 'open' NOT NULL,
  "resolution" "dispute_resolution",
  "resolution_note" text,
  "resolved_by" text,
  "resolved_at" timestamp,
  "closed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "disputes_case_id_fk"
    FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT,
  CONSTRAINT "disputes_release_request_id_fk"
    FOREIGN KEY ("release_request_id") REFERENCES "milestone_release_requests"("id") ON DELETE RESTRICT,
  CONSTRAINT "disputes_milestone_id_fk"
    FOREIGN KEY ("milestone_id") REFERENCES "representation_milestones"("id") ON DELETE RESTRICT,
  CONSTRAINT "disputes_escrow_account_id_fk"
    FOREIGN KEY ("escrow_account_id") REFERENCES "escrow_accounts"("id") ON DELETE RESTRICT,
  CONSTRAINT "disputes_quote_id_fk"
    FOREIGN KEY ("quote_id") REFERENCES "representation_quotes"("id") ON DELETE RESTRICT,
  CONSTRAINT "disputes_client_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "users"("id"),
  CONSTRAINT "disputes_lawyer_id_fk"
    FOREIGN KEY ("lawyer_id") REFERENCES "users"("id"),
  CONSTRAINT "disputes_resolved_by_fk"
    FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "disputes_release_request_uidx" ON "disputes" USING btree ("release_request_id");
CREATE INDEX "disputes_case_id_idx" ON "disputes" USING btree ("case_id");
CREATE INDEX "disputes_milestone_id_idx" ON "disputes" USING btree ("milestone_id");
CREATE INDEX "disputes_escrow_account_id_idx" ON "disputes" USING btree ("escrow_account_id");
CREATE INDEX "disputes_quote_id_idx" ON "disputes" USING btree ("quote_id");
CREATE INDEX "disputes_client_id_idx" ON "disputes" USING btree ("client_id");
CREATE INDEX "disputes_lawyer_id_idx" ON "disputes" USING btree ("lawyer_id");
CREATE INDEX "disputes_status_idx" ON "disputes" USING btree ("status");

CREATE TABLE "dispute_evidence" (
  "id" text PRIMARY KEY NOT NULL,
  "dispute_id" text NOT NULL,
  "submitted_by" text NOT NULL,
  "evidence_type" "dispute_evidence_type" NOT NULL,
  "storage_key" text,
  "content_hash" text,
  "description" text,
  "source_reference" text,
  "status" "dispute_evidence_status" DEFAULT 'submitted' NOT NULL,
  "submitted_at" timestamp DEFAULT now() NOT NULL,
  "reviewed_at" timestamp,
  "reviewed_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "dispute_evidence_dispute_id_fk"
    FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE,
  CONSTRAINT "dispute_evidence_submitted_by_fk"
    FOREIGN KEY ("submitted_by") REFERENCES "users"("id"),
  CONSTRAINT "dispute_evidence_reviewed_by_fk"
    FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "dispute_evidence_dispute_id_idx" ON "dispute_evidence" USING btree ("dispute_id");
CREATE INDEX "dispute_evidence_submitted_by_idx" ON "dispute_evidence" USING btree ("submitted_by");
CREATE INDEX "dispute_evidence_status_idx" ON "dispute_evidence" USING btree ("status");
CREATE INDEX "dispute_evidence_content_hash_idx" ON "dispute_evidence" USING btree ("content_hash");
CREATE UNIQUE INDEX "dispute_evidence_source_reference_uidx" ON "dispute_evidence" USING btree ("source_reference");

COMMIT;
