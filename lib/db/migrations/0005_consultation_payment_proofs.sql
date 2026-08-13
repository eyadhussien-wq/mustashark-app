DO $$ BEGIN
  CREATE TYPE payment_proof_channel AS ENUM ('platform', 'external');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_proof_method AS ENUM ('visa_mastercard', 'local_wallet', 'bank_transfer', 'western_union', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_proof_status AS ENUM ('submitted', 'confirmed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS payment_proofs (
  id text PRIMARY KEY,
  booking_id text NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(14, 2) NOT NULL,
  currency text NOT NULL,
  channel payment_proof_channel NOT NULL DEFAULT 'external',
  method payment_proof_method NOT NULL,
  proof_uri text NOT NULL,
  reference text,
  note text,
  status payment_proof_status NOT NULL DEFAULT 'submitted',
  rejection_reason text,
  reviewed_by text REFERENCES users(id) ON DELETE SET NULL,
  submitted_at timestamp NOT NULL DEFAULT now(),
  reviewed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_proofs_booking_id_idx ON payment_proofs(booking_id);
CREATE INDEX IF NOT EXISTS payment_proofs_client_id_idx ON payment_proofs(client_id);
CREATE INDEX IF NOT EXISTS payment_proofs_status_idx ON payment_proofs(status);
