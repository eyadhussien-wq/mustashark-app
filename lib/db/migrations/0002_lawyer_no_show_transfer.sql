-- Lawyer no-show recovery, escrow state, smart transfer, notifications and wallet credits.
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
