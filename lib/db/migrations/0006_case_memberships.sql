CREATE TYPE case_membership_role AS ENUM ('client', 'lawyer', 'authorized_representative');
CREATE TYPE case_membership_status AS ENUM ('active', 'revoked');

CREATE TABLE case_memberships (
  id text PRIMARY KEY,
  case_id text NOT NULL,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role case_membership_role NOT NULL,
  status case_membership_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT case_memberships_case_user_unique UNIQUE (case_id, user_id)
);

CREATE INDEX case_memberships_case_idx ON case_memberships(case_id);
CREATE INDEX case_memberships_user_status_idx ON case_memberships(user_id, status);
