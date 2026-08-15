-- S01-02: exact-slot uniqueness with an explicit release marker.
--
-- A booking block represents a currently reserved slot. Terminal booking states
-- release that reservation without deleting historical booking data.
ALTER TABLE booking_time_blocks
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMP;

DROP INDEX IF EXISTS booking_time_blocks_exact_slot_uq;

UPDATE booking_time_blocks AS block
SET released_at = COALESCE(block.released_at, NOW())
FROM bookings AS booking
WHERE booking.id = block.booking_id
  AND booking.status IN ('rejected', 'cancelled_by_lawyer', 'cancelled_by_client', 'refunded_absent')
  AND block.released_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS booking_time_blocks_exact_slot_uq
  ON booking_time_blocks (lawyer_id, scheduled_date, start_time, end_time)
  WHERE released_at IS NULL;

CREATE OR REPLACE FUNCTION release_booking_time_block_on_terminal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('rejected', 'cancelled_by_lawyer', 'cancelled_by_client', 'refunded_absent')
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE booking_time_blocks
    SET released_at = COALESCE(released_at, NOW())
    WHERE booking_id = NEW.id
      AND released_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_time_blocks_release_on_terminal ON bookings;

CREATE TRIGGER booking_time_blocks_release_on_terminal
AFTER UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION release_booking_time_block_on_terminal();
