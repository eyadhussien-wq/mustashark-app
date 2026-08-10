DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bank_verification_status') THEN
    CREATE TYPE "bank_verification_status" AS ENUM (
      'not_submitted',
      'pending',
      'verified',
      'rejected',
      'suspended'
    );
  END IF;
END
$$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "bank_name" text,
  ADD COLUMN IF NOT EXISTS "bank_account_holder_name" text,
  ADD COLUMN IF NOT EXISTS "bank_country" "country",
  ADD COLUMN IF NOT EXISTS "bank_iban_encrypted" text,
  ADD COLUMN IF NOT EXISTS "bank_iban_last4" text,
  ADD COLUMN IF NOT EXISTS "bank_swift_encrypted" text,
  ADD COLUMN IF NOT EXISTS "bank_verification_status" "bank_verification_status" NOT NULL DEFAULT 'not_submitted',
  ADD COLUMN IF NOT EXISTS "bank_verification_document_key" text,
  ADD COLUMN IF NOT EXISTS "bank_verification_note" text,
  ADD COLUMN IF NOT EXISTS "bank_verified_at" timestamp,
  ADD COLUMN IF NOT EXISTS "bank_verified_by" text,
  ADD COLUMN IF NOT EXISTS "bank_updated_at" timestamp;

CREATE INDEX IF NOT EXISTS "users_bank_verification_status_idx"
  ON "users" ("role", "bank_verification_status");
