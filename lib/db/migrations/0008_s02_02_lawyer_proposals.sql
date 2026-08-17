-- S02.2: Lawyer Proposal & 24h Expiry.
-- Repository-only migration specification. Do not execute against production.
-- Financial Isolation Gate: this migration creates proposal state only and does
-- not alter representation_quotes or any payment/settlement/ledger tables.

CREATE TYPE lawyer_proposal_status AS ENUM (
  'draft',
  'submitted',
  'accepted',
  'rejected',
  'withdrawn',
  'expired'
);

CREATE TABLE lawyer_proposals (
  id text PRIMARY KEY,
  request_id text NOT NULL REFERENCES representation_quote_requests(id),
  lawyer_id text NOT NULL REFERENCES users(id),
  amount numeric(14, 2) NOT NULL,
  currency quote_currency NOT NULL,
  status lawyer_proposal_status NOT NULL DEFAULT 'draft',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  withdrawn_at timestamptz,
  CONSTRAINT lawyer_proposals_amount_non_negative CHECK (amount >= 0)
);

CREATE INDEX lawyer_proposals_request_id_idx
  ON lawyer_proposals (request_id);

CREATE INDEX lawyer_proposals_lawyer_id_idx
  ON lawyer_proposals (lawyer_id);

CREATE INDEX lawyer_proposals_status_idx
  ON lawyer_proposals (status);

CREATE INDEX lawyer_proposals_expires_at_idx
  ON lawyer_proposals (expires_at);
