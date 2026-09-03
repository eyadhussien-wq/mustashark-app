BEGIN;

CREATE TYPE neutral_audit_outcome AS ENUM ('allowed', 'denied');
CREATE TYPE neutral_audit_resource_type AS ENUM ('client', 'matter', 'document', 'schedule', 'message', 'export');

CREATE TABLE neutral_audit_events (
  id text PRIMARY KEY,
  actor_user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_role text NOT NULL,
  action text NOT NULL,
  resource_type neutral_audit_resource_type NOT NULL,
  resource_id text NOT NULL,
  outcome neutral_audit_outcome NOT NULL,
  reason_code text,
  correlation_id text,
  metadata jsonb,
  occurred_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX neutral_audit_events_actor_occurred_idx
  ON neutral_audit_events (actor_user_id, occurred_at);
CREATE INDEX neutral_audit_events_resource_occurred_idx
  ON neutral_audit_events (resource_type, resource_id, occurred_at);
CREATE INDEX neutral_audit_events_correlation_idx
  ON neutral_audit_events (correlation_id);

COMMIT;
