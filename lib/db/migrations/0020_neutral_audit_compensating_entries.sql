BEGIN;

ALTER TABLE neutral_audit_events
  ADD COLUMN IF NOT EXISTS target_event_id text;

CREATE INDEX IF NOT EXISTS neutral_audit_events_target_event_idx
  ON neutral_audit_events (target_event_id);

CREATE TABLE IF NOT EXISTS neutral_security_alerts (
  id text PRIMARY KEY,
  alert_type text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  actor_user_id text REFERENCES users(id) ON DELETE RESTRICT,
  resource_type text,
  resource_id text,
  correlation_id text,
  reason_code text NOT NULL,
  details jsonb,
  detected_at timestamp NOT NULL DEFAULT now(),
  resolved_at timestamp
);

CREATE INDEX IF NOT EXISTS neutral_security_alerts_status_detected_idx
  ON neutral_security_alerts (status, detected_at);
CREATE INDEX IF NOT EXISTS neutral_security_alerts_actor_detected_idx
  ON neutral_security_alerts (actor_user_id, detected_at);
CREATE INDEX IF NOT EXISTS neutral_security_alerts_correlation_idx
  ON neutral_security_alerts (correlation_id);

COMMIT;
