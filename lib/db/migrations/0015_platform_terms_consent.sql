-- E01-D: versioned, server-authoritative Platform Terms consent.
-- This migration is additive and does not alter or delete existing production data.

CREATE TYPE terms_version_status AS ENUM ('draft', 'published', 'superseded');
CREATE TYPE terms_consent_source AS ENUM ('registration', 'settings', 'required_action');

CREATE TABLE terms_versions (
  id text PRIMARY KEY,
  version integer NOT NULL CHECK (version > 0),
  status terms_version_status NOT NULL DEFAULT 'draft',
  content text NOT NULL,
  content_hash text NOT NULL CHECK (content_hash ~ '^[0-9a-fA-F]{64}$'),
  hash_algorithm text NOT NULL DEFAULT 'sha256' CHECK (lower(hash_algorithm) = 'sha256'),
  mandatory boolean NOT NULL DEFAULT true,
  effective_at timestamp,
  published_at timestamp,
  created_by text REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now(),
  metadata jsonb,
  CONSTRAINT terms_versions_version_uidx UNIQUE (version)
);

CREATE INDEX terms_versions_content_hash_idx ON terms_versions(content_hash);
CREATE INDEX terms_versions_status_effective_idx ON terms_versions(status, effective_at);

CREATE TABLE terms_consents (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  terms_version_id text NOT NULL REFERENCES terms_versions(id),
  version integer NOT NULL CHECK (version > 0),
  content_hash text NOT NULL CHECK (content_hash ~ '^[0-9a-fA-F]{64}$'),
  consented_at timestamp NOT NULL DEFAULT now(),
  source terms_consent_source NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb,
  CONSTRAINT terms_consents_user_version_uidx UNIQUE (user_id, terms_version_id)
);

CREATE INDEX terms_consents_user_id_idx ON terms_consents(user_id);
CREATE INDEX terms_consents_version_id_idx ON terms_consents(terms_version_id);

-- The evidence row must agree with the immutable Terms version it references.
CREATE OR REPLACE FUNCTION validate_terms_consent_evidence()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_version integer;
  v_hash text;
BEGIN
  SELECT version, content_hash
    INTO v_version, v_hash
  FROM terms_versions
  WHERE id = NEW.terms_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'terms_version_not_found';
  END IF;

  IF NEW.version <> v_version OR lower(NEW.content_hash) <> lower(v_hash) THEN
    RAISE EXCEPTION 'terms_consent_evidence_mismatch';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER terms_consents_validate_evidence
BEFORE INSERT OR UPDATE ON terms_consents
FOR EACH ROW
EXECUTE FUNCTION validate_terms_consent_evidence();

-- Published/superseded legal text is immutable. Corrections require a new version.
CREATE OR REPLACE FUNCTION prevent_published_terms_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IN ('published', 'superseded') THEN
    RAISE EXCEPTION 'published_terms_version_immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER terms_versions_immutable_after_publication
BEFORE UPDATE ON terms_versions
FOR EACH ROW
EXECUTE FUNCTION prevent_published_terms_mutation();

CREATE OR REPLACE FUNCTION prevent_terms_consent_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'terms_consent_immutable';
END;
$$;

CREATE TRIGGER terms_consents_immutable
BEFORE UPDATE OR DELETE ON terms_consents
FOR EACH ROW
EXECUTE FUNCTION prevent_terms_consent_mutation();
