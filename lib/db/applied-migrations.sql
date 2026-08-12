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

-- 11. Lawyer aggregate review columns on users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 1),
  ADD COLUMN IF NOT EXISTS reviews_count INTEGER NOT NULL DEFAULT 0;

-- 12. Comment status enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comment_status') THEN
    CREATE TYPE comment_status AS ENUM ('none', 'pending', 'approved', 'rejected');
  END IF;
END $$;

-- 13. Lawyer reviews table
CREATE TABLE IF NOT EXISTS lawyer_reviews (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES users(id),
  lawyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  comment_status comment_status NOT NULL DEFAULT 'none',
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT lawyer_reviews_client_consultation_unique UNIQUE (client_id, consultation_id)
);

-- 14. Email consultation channel
ALTER TYPE booking_type ADD VALUE IF NOT EXISTS 'email';

-- 15. Lawyer no-show recovery / smart transfer
ALTER TABLE users ADD COLUMN IF NOT EXISTS litigation_tier TEXT NOT NULL DEFAULT 'general';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escrow_status') THEN
    CREATE TYPE escrow_status AS ENUM ('none', 'held', 'released', 'refunded');
  END IF;
END $$;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS escrow_status escrow_status NOT NULL DEFAULT 'none';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email_response_deadline_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS no_show_detected_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS no_show_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transferred_from_booking_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS lawyer_commitment_scores (
  lawyer_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL DEFAULT 100,
  no_show_count INTEGER NOT NULL DEFAULT 0,
  last_no_show_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL,
  urgent BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_transfer_requests (
  id TEXT PRIMARY KEY,
  original_booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  new_booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  client_id TEXT NOT NULL REFERENCES users(id),
  original_lawyer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  new_lawyer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'offered',
  reason TEXT NOT NULL DEFAULT 'lawyer_no_show',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  selected_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_wallets (
  client_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  available_credits NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_refunded NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 16. Lawyer weekly availability and server-owned booking time blocks
CREATE TABLE IF NOT EXISTS lawyer_availability (
  id TEXT PRIMARY KEY,
  lawyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT lawyer_availability_window_uq UNIQUE (lawyer_id, day_of_week, start_time, end_time)
);

CREATE TABLE IF NOT EXISTS booking_time_blocks (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  lawyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT booking_time_blocks_exact_slot_uq UNIQUE (lawyer_id, scheduled_date, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS booking_time_blocks_lawyer_date_idx
  ON booking_time_blocks (lawyer_id, scheduled_date, start_time);
