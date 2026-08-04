-- Applied migrations for profile management & account deletion feature
-- Applied directly via SQL (project uses drizzle-kit push, not drizzle-kit generate/migrate)
-- Run this script on a fresh database to reproduce the schema state.

-- 1. Soft-delete columns on users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deletion_rejection_note TEXT;

-- 2. Deletion-request status enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deletion_request_status') THEN
    CREATE TYPE deletion_request_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

-- 3. Lawyer deletion requests table
CREATE TABLE IF NOT EXISTS lawyer_deletion_requests (
  id TEXT PRIMARY KEY,
  lawyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status deletion_request_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by TEXT REFERENCES users(id),
  rejection_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Make bookings.lawyer_id nullable so historical audit records survive lawyer purge
ALTER TABLE bookings ALTER COLUMN lawyer_id DROP NOT NULL;

-- 5. Make bookings.client_id nullable so expired client PII can be purged without losing booking history
ALTER TABLE bookings ALTER COLUMN client_id DROP NOT NULL;

-- 6. Make platform_dues.lawyer_id nullable for the same reason
ALTER TABLE platform_dues ALTER COLUMN lawyer_id DROP NOT NULL;
-- Note: platform_dues.collected_by was already nullable; no ALTER needed.
-- Note: lawyer_deletion_requests.reviewed_by was already nullable; no ALTER needed.

-- 7. Lawyer profile fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS specialization TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2);

-- 8. Profile change field enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_change_field') THEN
    CREATE TYPE profile_change_field AS ENUM ('specialization', 'bio', 'hourlyRate');
  END IF;
END $$;

-- 9. Profile change status enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_change_status') THEN
    CREATE TYPE profile_change_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

-- 10. Lawyer profile change requests table
CREATE TABLE IF NOT EXISTS lawyer_profile_change_requests (
  id TEXT PRIMARY KEY,
  lawyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field profile_change_field NOT NULL,
  old_value TEXT,
  new_value TEXT,
  status profile_change_status NOT NULL DEFAULT 'pending',
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMP,
  rejection_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
