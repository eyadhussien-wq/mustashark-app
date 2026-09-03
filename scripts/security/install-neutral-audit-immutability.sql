CREATE OR REPLACE FUNCTION prevent_neutral_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'neutral_audit_events is immutable';
END;
$$;

DROP TRIGGER IF EXISTS neutral_audit_events_immutable_trigger ON neutral_audit_events;

CREATE TRIGGER neutral_audit_events_immutable_trigger
BEFORE UPDATE OR DELETE ON neutral_audit_events
FOR EACH ROW
EXECUTE FUNCTION prevent_neutral_audit_event_mutation();
