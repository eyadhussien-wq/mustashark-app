-- S01 architecture closure
-- Persist the lawyer's IANA scheduling timezone as metadata.
-- No booking rows are rewritten; existing UTC fields remain untouched.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS scheduling_timezone TEXT;

-- Timezone validity is enforced by the API against the runtime's IANA timezone
-- database. PostgreSQL CHECK constraints cannot safely contain subqueries into
-- pg_timezone_names, so no invalid dynamic CHECK is introduced here.
