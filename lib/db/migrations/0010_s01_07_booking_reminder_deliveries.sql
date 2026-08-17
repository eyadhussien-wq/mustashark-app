-- S01-07: concurrency-safe, extensible reminder delivery ledger.

CREATE TABLE IF NOT EXISTS booking_reminder_deliveries (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  recipient_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  reminder_type TEXT NOT NULL,
  scheduled_occurrence TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'claimed',
  attempt_count INTEGER NOT NULL DEFAULT 1,
  provider_message_id TEXT,
  metadata JSONB,
  claimed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS booking_reminder_deliveries_occurrence_uq
  ON booking_reminder_deliveries (
    booking_id,
    recipient_user_id,
    channel,
    reminder_type,
    scheduled_occurrence
  );

CREATE INDEX IF NOT EXISTS booking_reminder_deliveries_due_idx
  ON booking_reminder_deliveries (scheduled_occurrence, status);

CREATE INDEX IF NOT EXISTS booking_reminder_deliveries_booking_idx
  ON booking_reminder_deliveries (booking_id);
