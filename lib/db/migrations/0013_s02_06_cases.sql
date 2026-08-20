BEGIN;

CREATE TYPE "case_status" AS ENUM ('active', 'completed', 'closed');

CREATE TABLE "cases" (
  "id" text PRIMARY KEY NOT NULL,
  "agreement_id" text NOT NULL,
  "client_id" text NOT NULL,
  "lawyer_id" text NOT NULL,
  "status" "case_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp,
  "closed_at" timestamp,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "cases_agreement_id_fk"
    FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id"),
  CONSTRAINT "cases_client_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "users"("id"),
  CONSTRAINT "cases_lawyer_id_fk"
    FOREIGN KEY ("lawyer_id") REFERENCES "users"("id")
);

CREATE UNIQUE INDEX "cases_agreement_id_uidx"
  ON "cases" USING btree ("agreement_id");
CREATE INDEX "cases_client_id_idx"
  ON "cases" USING btree ("client_id");
CREATE INDEX "cases_lawyer_id_idx"
  ON "cases" USING btree ("lawyer_id");
CREATE INDEX "cases_status_idx"
  ON "cases" USING btree ("status");

-- Safety gate: the existing loose references must be empty or already resolvable
-- before foreign keys are introduced. This migration intentionally aborts rather
-- than guessing or rewriting historical data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "case_memberships" cm
    LEFT JOIN "cases" c ON c."id" = cm."case_id"
    WHERE cm."case_id" IS NOT NULL AND c."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'S02.6 migration blocked: orphan case_memberships.case_id values exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "legal_representation_documents" lrd
    LEFT JOIN "cases" c ON c."id" = lrd."case_id"
    WHERE lrd."case_id" IS NOT NULL AND c."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'S02.6 migration blocked: orphan legal_representation_documents.case_id values exist';
  END IF;
END $$;

ALTER TABLE "case_memberships"
  ADD CONSTRAINT "case_memberships_case_id_fk"
  FOREIGN KEY ("case_id") REFERENCES "cases"("id");

ALTER TABLE "legal_representation_documents"
  ADD CONSTRAINT "legal_representation_documents_case_id_fk"
  FOREIGN KEY ("case_id") REFERENCES "cases"("id");

COMMIT;
