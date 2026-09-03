BEGIN;

ALTER TYPE "lawyer_verification_status" ADD VALUE IF NOT EXISTS 'verifying';
ALTER TYPE "lawyer_verification_status" ADD VALUE IF NOT EXISTS 'exception';
ALTER TYPE "lawyer_verification_status" ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE "lawyer_verification_status" ADD VALUE IF NOT EXISTS 'suspended';
ALTER TYPE "lawyer_verification_status" ADD VALUE IF NOT EXISTS 'revoked';

ALTER TABLE "lawyer_verifications"
  ALTER COLUMN "document_storage_key" SET NOT NULL,
  ADD COLUMN "document_hash" text,
  ADD COLUMN "verification_source" text,
  ADD COLUMN "source_reference" text,
  ADD COLUMN "source_status" text,
  ADD COLUMN "verification_method" text,
  ADD COLUMN "matched_name" text,
  ADD COLUMN "matched_license" text,
  ADD COLUMN "confidence" real,
  ADD COLUMN "verified_at" timestamp,
  ADD COLUMN "last_checked_at" timestamp,
  ADD COLUMN "exception_reason" text;

COMMIT;
