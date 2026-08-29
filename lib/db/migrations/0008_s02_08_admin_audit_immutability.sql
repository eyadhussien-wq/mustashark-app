-- S02-08: database-enforced immutability for administrative audit events.
-- UPDATE and DELETE are forbidden even for application paths; only INSERT is allowed.

CREATE OR REPLACE FUNCTION prevent_admin_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'admin_audit_logs are immutable: % is forbidden', TG_OP
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS admin_audit_logs_immutable_update_delete
  ON admin_audit_logs;

CREATE TRIGGER admin_audit_logs_immutable_update_delete
BEFORE UPDATE OR DELETE ON admin_audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_admin_audit_log_mutation();
