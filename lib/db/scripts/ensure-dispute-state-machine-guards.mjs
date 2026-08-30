import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query(`
    ALTER TABLE disputes
      DROP CONSTRAINT IF EXISTS disputes_version_positive_ck,
      DROP CONSTRAINT IF EXISTS disputes_closed_outcome_ck;

    ALTER TABLE disputes
      ADD CONSTRAINT disputes_version_positive_ck CHECK (version > 0),
      ADD CONSTRAINT disputes_closed_outcome_ck CHECK (
        (lifecycle_state = 'closed' AND resolution_outcome IS NOT NULL)
        OR
        (lifecycle_state <> 'closed' AND resolution_outcome IS NULL)
      );

    CREATE OR REPLACE FUNCTION enforce_dispute_state_machine()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF OLD.lifecycle_state = 'closed' AND NEW.lifecycle_state <> 'closed' THEN
        RETURN NULL;
      END IF;

      IF NEW.resolution_outcome IS NOT NULL AND NEW.lifecycle_state <> 'closed' THEN
        RAISE EXCEPTION 'dispute_resolution_outcome_forbidden_before_closed';
      END IF;

      IF NEW.lifecycle_state = 'closed' AND NEW.resolution_outcome IS NULL THEN
        RAISE EXCEPTION 'dispute_resolution_outcome_required';
      END IF;

      IF NEW.lifecycle_state <> OLD.lifecycle_state THEN
        IF NOT (
          (OLD.lifecycle_state = 'open' AND NEW.lifecycle_state = 'mediation') OR
          (OLD.lifecycle_state = 'mediation' AND NEW.lifecycle_state = 'admin_review') OR
          (OLD.lifecycle_state = 'admin_review' AND NEW.lifecycle_state = 'decision_pending') OR
          (OLD.lifecycle_state = 'decision_pending' AND NEW.lifecycle_state = 'resolution_pending') OR
          (OLD.lifecycle_state = 'resolution_pending' AND NEW.lifecycle_state = 'closed')
        ) THEN
          RETURN NULL;
        END IF;
      END IF;

      RETURN NEW;
    END;
    $$;

    DROP TRIGGER IF EXISTS disputes_state_machine_guard ON disputes;
    CREATE TRIGGER disputes_state_machine_guard
      BEFORE UPDATE ON disputes
      FOR EACH ROW
      EXECUTE FUNCTION enforce_dispute_state_machine();
  `);
} finally {
  await client.end();
}
