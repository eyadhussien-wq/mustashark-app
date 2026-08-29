-- S02-08: database-level immutability for administrative audit events.
-- Audit rows are append-only: UPDATE and DELETE are rejected regardless of caller.
-- INSERT remains available so the canonical intervention transaction can append
-- the event atomically with the protected business-state transition.

CREATE OR REPLACE FUNCTION prevent_admin_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'admin_audit_logs is immutable: % is not permitted', TG_OP
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS admin_audit_logs_immutable_update ON admin_audit_logs;
CREATE TRIGGER admin_audit_logs_immutable_update
BEFORE UPDATE ON admin_audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_admin_audit_log_mutation();

DROP TRIGGER IF EXISTS admin_audit_logs_immutable_delete ON admin_audit_logs;
CREATE TRIGGER admin_audit_logs_immutable_delete
BEFORE DELETE ON admin_audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_admin_audit_log_mutation();
