-- S01-08 Phase A / Migration 1 (Schema only)
-- Non-destructive: legacy scheduled_date/scheduled_time fields remain authoritative
-- for pre-migration rows until the controlled backfill phase.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS scheduled_at_utc TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_timezone TEXT;

ALTER TABLE booking_time_blocks
  ADD COLUMN IF NOT EXISTS scheduled_at_utc TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_timezone TEXT;

-- No backfill and no NOT NULL constraints in Phase A.
-- New writes are dual-written atomically by the API transaction.
