BEGIN;

DO $$
BEGIN
  CREATE TYPE "dispute_evidence_review_status" AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "dispute_evidence" (
  "id" text PRIMARY KEY NOT NULL,
  "dispute_id" text NOT NULL,
  "submitted_by" text NOT NULL,
  "evidence_type" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "storage_key" text NOT NULL,
  "mime_type" text,
  "sha256" text,
  "review_status" "dispute_evidence_review_status" DEFAULT 'pending' NOT NULL,
  "reviewed_by" text,
  "review_note" text,
  "reviewed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "dispute_evidence_dispute_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE RESTRICT,
  CONSTRAINT "dispute_evidence_submitted_by_fk" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT,
  CONSTRAINT "dispute_evidence_reviewed_by_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "dispute_evidence_dispute_id_idx" ON "dispute_evidence" USING btree ("dispute_id");
CREATE INDEX IF NOT EXISTS "dispute_evidence_submitted_by_idx" ON "dispute_evidence" USING btree ("submitted_by");
CREATE INDEX IF NOT EXISTS "dispute_evidence_review_status_idx" ON "dispute_evidence" USING btree ("review_status");
CREATE UNIQUE INDEX IF NOT EXISTS "dispute_evidence_content_uidx" ON "dispute_evidence" USING btree ("dispute_id", "storage_key", "sha256");

COMMIT;
