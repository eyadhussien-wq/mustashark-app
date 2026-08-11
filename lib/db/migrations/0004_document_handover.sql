DO $$ BEGIN CREATE TYPE document_status AS ENUM ('draft','ready','handover_pending','handed_over','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE handover_mode AS ENUM ('local','office','courier','international'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE handover_status AS ENUM ('requested','approved','preparing','dispatched','in_transit','customs','ready_for_delivery','delivered','failed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE handover_tracking_event_type AS ENUM ('status_change','location_update','customs','delivery_attempt','note'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS documents (
  id text PRIMARY KEY,
  case_id text NOT NULL,
  owner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_name text,
  mime_type text,
  storage_key text,
  status document_status NOT NULL DEFAULT 'draft',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_handovers (
  id text PRIMARY KEY,
  case_id text NOT NULL,
  document_id text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  requested_by text NOT NULL REFERENCES users(id),
  recipient_id text REFERENCES users(id) ON DELETE SET NULL,
  mode handover_mode NOT NULL,
  status handover_status NOT NULL DEFAULT 'requested',
  tracking_number text UNIQUE,
  carrier text,
  origin_country text,
  destination_country text,
  origin_address text,
  destination_address text,
  delivery_otp_hash text,
  delivered_to_name text,
  delivered_at timestamp,
  delivery_proof_uri text,
  failure_reason text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS handover_tracking_events (
  id text PRIMARY KEY,
  handover_id text NOT NULL REFERENCES document_handovers(id) ON DELETE CASCADE,
  type handover_tracking_event_type NOT NULL,
  status handover_status,
  location text,
  note text,
  occurred_at timestamp NOT NULL DEFAULT now(),
  sequence integer NOT NULL DEFAULT 0,
  created_by text REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS documents_case_id_idx ON documents(case_id);
CREATE INDEX IF NOT EXISTS handovers_case_id_idx ON document_handovers(case_id);
CREATE INDEX IF NOT EXISTS handovers_document_id_idx ON document_handovers(document_id);
CREATE INDEX IF NOT EXISTS handovers_status_idx ON document_handovers(status);
CREATE INDEX IF NOT EXISTS handover_events_handover_id_idx ON handover_tracking_events(handover_id);
