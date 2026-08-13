-- T01-08: consultation archive metadata.
-- Repository-only migration specification. Do not execute against heliumdb.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by text REFERENCES users(id);

CREATE INDEX IF NOT EXISTS bookings_archived_at_idx
  ON bookings (archived_at)
  WHERE archived_at IS NOT NULL;
