BEGIN;

CREATE TYPE "lawyer_verification_status" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "lawyer_verifications" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "license_number" text,
  "bar_association" text,
  "document_storage_key" text,
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

-- Existing lawyers are intentionally backfilled as pending. This prevents an
-- existing active account from being interpreted as professionally verified.
INSERT INTO "lawyer_verifications" ("id", "user_id", "status")
SELECT 'lawyer_verification_' || u."id", u."id", 'pending'
FROM "users" u
WHERE u."role" = 'lawyer'
  AND NOT EXISTS (
    SELECT 1 FROM "lawyer_verifications" lv WHERE lv."user_id" = u."id"
  );

COMMIT;
