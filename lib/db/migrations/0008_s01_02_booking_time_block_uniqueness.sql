-- S01-02: database-level exact-slot uniqueness for booking_time_blocks.
--
-- lawyer_availability and booking_time_blocks were introduced by 0005_booking_availability.sql.
-- The exact-slot constraint was later added to the Drizzle schema; this migration keeps the
-- repository migration history authoritative as well.
CREATE UNIQUE INDEX IF NOT EXISTS booking_time_blocks_exact_slot_uq
  ON booking_time_blocks (lawyer_id, scheduled_date, start_time, end_time);
