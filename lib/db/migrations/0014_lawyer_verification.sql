BEGIN;

CREATE TYPE "lawyer_verification_status" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "lawyer_verifications" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "license_number" text NOT NULL,
  "bar_association" text NOT NULL,
  "document_storage_key" text NOT NULL,
  "status" "lawyer_verification_status" DEFAULT 'pending' NOT NULL,
  "reviewed_by" text,
  "reviewed_at" timestamp,
  "rejection_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "lawyer_verifications_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "lawyer_verifications_reviewed_by_fk"
    FOREIGN KEY ("reviewed_by") REFERENCES "users"("id")
);

CREATE UNIQUE INDEX "lawyer_verifications_user_id_uidx"
  ON "lawyer_verifications" USING btree ("user_id");
CREATE UNIQUE INDEX "lawyer_verifications_license_number_uidx"
  ON "lawyer_verifications" USING btree ("license_number");
CREATE INDEX "lawyer_verifications_status_idx"
  ON "lawyer_verifications" USING btree ("status");

COMMIT;
