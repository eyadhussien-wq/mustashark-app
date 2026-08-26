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

CREATE TABLE "disputes" (
  "id" text PRIMARY KEY NOT NULL,
  "release_request_id" text NOT NULL,
  "milestone_id" text NOT NULL,
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
  CONSTRAINT "disputes_release_request_id_fk"
    FOREIGN KEY ("release_request_id") REFERENCES "milestone_release_requests"("id") ON DELETE RESTRICT,
  CONSTRAINT "disputes_milestone_id_fk"
    FOREIGN KEY ("milestone_id") REFERENCES "representation_milestones"("id") ON DELETE RESTRICT,
  CONSTRAINT "disputes_quote_id_fk"
    FOREIGN KEY ("quote_id") REFERENCES "representation_quotes"("id") ON DELETE RESTRICT,
  CONSTRAINT "disputes_client_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "users"("id"),
  CONSTRAINT "disputes_lawyer_id_fk"
    FOREIGN KEY ("lawyer_id") REFERENCES "users"("id"),
  CONSTRAINT "disputes_resolved_by_fk"
    FOREIGN KEY ("resolved_by") REFERENCES "users"("id")
);

CREATE UNIQUE INDEX "disputes_release_request_uidx" ON "disputes" USING btree ("release_request_id");
CREATE INDEX "disputes_milestone_id_idx" ON "disputes" USING btree ("milestone_id");
CREATE INDEX "disputes_quote_id_idx" ON "disputes" USING btree ("quote_id");
CREATE INDEX "disputes_client_id_idx" ON "disputes" USING btree ("client_id");
CREATE INDEX "disputes_lawyer_id_idx" ON "disputes" USING btree ("lawyer_id");
CREATE INDEX "disputes_status_idx" ON "disputes" USING btree ("status");

COMMIT;
