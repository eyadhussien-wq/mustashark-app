-- Mustasharek password recovery schema change.
-- Safe to run against an existing PostgreSQL database: every addition is idempotent.
-- The application stores only a SHA-256 OTP hash; the plaintext OTP is never persisted.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "password_reset_token_hash" text,
  ADD COLUMN IF NOT EXISTS "password_reset_expires_at" timestamp,
  ADD COLUMN IF NOT EXISTS "password_reset_channel" text,
  ADD COLUMN IF NOT EXISTS "password_reset_attempts" integer NOT NULL DEFAULT 0;

-- Keep the attempt counter bounded even if a future code path writes an invalid value.
UPDATE "users"
SET "password_reset_attempts" = 0
WHERE "password_reset_attempts" < 0;

ALTER TABLE "users"
  DROP CONSTRAINT IF EXISTS "users_password_reset_attempts_nonnegative";

ALTER TABLE "users"
  ADD CONSTRAINT "users_password_reset_attempts_nonnegative"
  CHECK ("password_reset_attempts" >= 0);

-- Recovery state is short-lived and queried by user id during reset.
CREATE INDEX IF NOT EXISTS "users_password_reset_expires_at_idx"
  ON "users" ("password_reset_expires_at");
