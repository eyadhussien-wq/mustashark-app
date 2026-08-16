-- S01-03: idempotent state-changing requests and optimistic booking versioning.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  route TEXT NOT NULL,
  method TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes')
);

ALTER TABLE idempotency_keys
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes');

CREATE UNIQUE INDEX IF NOT EXISTS idempotency_keys_request_uq
  ON idempotency_keys (user_id, key, route, method);

CREATE INDEX IF NOT EXISTS idempotency_keys_created_at_idx
  ON idempotency_keys (created_at);

CREATE INDEX IF NOT EXISTS idempotency_keys_expires_at_idx
  ON idempotency_keys (expires_at);
