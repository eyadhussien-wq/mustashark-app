BEGIN;

ALTER TABLE neutral_audit_events
  ADD COLUMN chain_version text NOT NULL DEFAULT '1',
  ADD COLUMN canonicalization_version text NOT NULL DEFAULT '1',
  ADD COLUMN genesis_hash text,
  ADD COLUMN previous_hash text,
  ADD COLUMN event_hash text;

UPDATE neutral_audit_events
SET genesis_hash = encode(digest('legacy-neutral-audit-genesis-v1', 'sha256'), 'hex'),
    event_hash = encode(digest(id || ':' || action || ':' || resource_id || ':' || occurred_at::text, 'sha256'), 'hex')
WHERE genesis_hash IS NULL OR event_hash IS NULL;

ALTER TABLE neutral_audit_events
  ALTER COLUMN genesis_hash SET NOT NULL,
  ALTER COLUMN event_hash SET NOT NULL;

CREATE INDEX neutral_audit_events_actor_chain_idx
  ON neutral_audit_events (actor_user_id, occurred_at, id);

CREATE OR REPLACE FUNCTION prevent_neutral_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'neutral_audit_events is immutable';
END;
$$;

CREATE TRIGGER neutral_audit_events_immutable_trigger
BEFORE UPDATE OR DELETE ON neutral_audit_events
FOR EACH ROW
EXECUTE FUNCTION prevent_neutral_audit_event_mutation();

COMMIT;
