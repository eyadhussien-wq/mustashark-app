-- Separate phone-number country from residence country and nationality.
-- Safe to run against an existing PostgreSQL database.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "phone_country" text,
  ADD COLUMN IF NOT EXISTS "nationality" text;

-- Backfill the derived phone country for the two currently supported calling codes.
UPDATE "users"
SET "phone_country" = CASE
  WHEN regexp_replace("phone", '[^0-9+]', '', 'g') LIKE '+974%' THEN 'qatar'
  WHEN regexp_replace("phone", '[^0-9+]', '', 'g') LIKE '+962%' THEN 'jordan'
  ELSE "phone_country"
END
WHERE "phone" IS NOT NULL
  AND "phone_country" IS NULL;

CREATE INDEX IF NOT EXISTS "users_phone_country_idx"
  ON "users" ("phone_country");
