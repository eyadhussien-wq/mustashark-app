-- Z-AUTH hardening #3: social provider identities must be unique.
--
-- This intentionally fails before creating the index if legacy duplicate provider
-- identities exist. Do not silently merge identities: duplicates require an
-- explicit security-reviewed remediation before the constraint can be applied.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM users
    WHERE provider_id IS NOT NULL
    GROUP BY auth_provider, provider_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'SECURITY BLOCK: duplicate social provider identities exist; remediate duplicates before applying users_auth_provider_provider_id_uq';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_auth_provider_provider_id_uq
  ON users (auth_provider, provider_id);
