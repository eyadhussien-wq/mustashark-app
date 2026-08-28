-- Financial Foundation V1
-- Foundation only: no commercial policy is encoded here.

DO $$ BEGIN
  CREATE TYPE financial_entry_type AS ENUM (
    'payment', 'hold', 'refund', 'forfeit', 'commission',
    'settlement', 'payout', 'adjustment'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE financial_entry_direction AS ENUM ('credit', 'debit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE financial_entry_status AS ENUM ('pending', 'posted', 'voided');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS financial_ledger (
  id text PRIMARY KEY,
  booking_id text REFERENCES bookings(id),
  actor_id text REFERENCES users(id),
  entry_type financial_entry_type NOT NULL,
  direction financial_entry_direction NOT NULL,
  status financial_entry_status NOT NULL DEFAULT 'posted',
  currency text NOT NULL DEFAULT 'QAR',
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  idempotency_key text,
  correlation_id text,
  reference text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS financial_ledger_idempotency_uq
  ON financial_ledger(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS financial_ledger_booking_idx
  ON financial_ledger(booking_id);

CREATE INDEX IF NOT EXISTS financial_ledger_created_at_idx
  ON financial_ledger(created_at);

CREATE INDEX IF NOT EXISTS financial_ledger_correlation_idx
  ON financial_ledger(correlation_id);
