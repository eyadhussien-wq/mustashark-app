BEGIN;

CREATE TYPE "dispute_lifecycle_state" AS ENUM (
  'open',
  'mediation',
  'admin_review',
  'decision_pending',
  'resolution_pending',
  'closed'
);

CREATE TYPE "dispute_resolution_outcome" AS ENUM (
  'client',
  'lawyer',
  'split',
  'dismissed'
);

CREATE TABLE "disputes" (
  "id" text PRIMARY KEY NOT NULL,
  "case_id" text NOT NULL,
  "opened_by" text NOT NULL,
  "lifecycle_state" "dispute_lifecycle_state" DEFAULT 'open' NOT NULL,
  "resolution_outcome" "dispute_resolution_outcome",
  "version" integer DEFAULT 1 NOT NULL,
  "opened_at" timestamp DEFAULT now() NOT NULL,
  "closed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "disputes_case_id_fk"
    FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT,
  CONSTRAINT "disputes_opened_by_fk"
    FOREIGN KEY ("opened_by") REFERENCES "users"("id") ON DELETE RESTRICT,
  CONSTRAINT "disputes_version_positive_ck"
    CHECK ("version" > 0),
  CONSTRAINT "disputes_closed_outcome_ck"
    CHECK (
      ("lifecycle_state" = 'closed' AND "resolution_outcome" IS NOT NULL)
      OR
      ("lifecycle_state" <> 'closed' AND "resolution_outcome" IS NULL)
    )
);

CREATE INDEX "disputes_case_id_idx"
  ON "disputes" USING btree ("case_id");
CREATE INDEX "disputes_lifecycle_state_idx"
  ON "disputes" USING btree ("lifecycle_state");
CREATE INDEX "disputes_opened_by_idx"
  ON "disputes" USING btree ("opened_by");

COMMIT;
