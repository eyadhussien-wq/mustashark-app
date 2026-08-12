-- Booking availability and atomic time blocks
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
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS booking_time_blocks_lawyer_date_idx
  ON booking_time_blocks (lawyer_id, scheduled_date, start_time);
