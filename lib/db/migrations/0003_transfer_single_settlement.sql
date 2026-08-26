-- B-03: transfer single-settlement guard.
-- Conservative legacy handling: only redundant unselected `offered` rows are removable automatically.
-- Any duplicate that already points at a replacement booking, or has progressed beyond `offered`, aborts
-- the migration rather than silently discarding a potentially financial/operational record.
DO $$
DECLARE
  unsafe_duplicates INTEGER;
BEGIN
  SELECT COUNT(*) INTO unsafe_duplicates
  FROM (
    SELECT original_booking_id
    FROM booking_transfer_requests
    GROUP BY original_booking_id
    HAVING COUNT(*) > 1
       AND BOOL_AND(status = 'offered' AND new_booking_id IS NULL)
       = FALSE
  ) duplicates;

  IF unsafe_duplicates > 0 THEN
    RAISE EXCEPTION
      'B-03 migration blocked: booking_transfer_requests contains % unsafe duplicate originalBookingId group(s)',
      unsafe_duplicates;
  END IF;

  DELETE FROM booking_transfer_requests a
  USING booking_transfer_requests b
  WHERE a.original_booking_id = b.original_booking_id
    AND a.status = 'offered'
    AND a.new_booking_id IS NULL
    AND b.status = 'offered'
    AND b.new_booking_id IS NULL
    AND a.created_at > b.created_at;
END $$;

ALTER TABLE booking_transfer_requests
  ADD CONSTRAINT booking_transfer_requests_original_booking_id_unique
  UNIQUE (original_booking_id);
