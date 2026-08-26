BEGIN;

CREATE TYPE "terms_version_status" AS ENUM (
  'draft',
  'published',
  'superseded'
);

CREATE TABLE "terms_versions" (
  "id" text PRIMARY KEY NOT NULL,
  "version" integer NOT NULL,
  "status" "terms_version_status" DEFAULT 'draft' NOT NULL,
  "content" text NOT NULL,
  "content_hash" text NOT NULL,
  "created_by" text NOT NULL,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "terms_versions_created_by_fk"
    FOREIGN KEY ("created_by") REFERENCES "users"("id"),
  CONSTRAINT "terms_versions_version_uidx"
    UNIQUE ("version")
);

CREATE UNIQUE INDEX "terms_versions_single_published_uidx"
  ON "terms_versions" USING btree ("status")
  WHERE "status" = 'published';

CREATE INDEX "terms_versions_content_hash_idx"
  ON "terms_versions" USING btree ("content_hash");

CREATE TABLE "terms_consents" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "terms_version_id" text NOT NULL,
  "consented_at" timestamp DEFAULT now() NOT NULL,
  "content_hash" text NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "terms_consents_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id"),
  CONSTRAINT "terms_consents_terms_version_id_fk"
    FOREIGN KEY ("terms_version_id") REFERENCES "terms_versions"("id"),
  CONSTRAINT "terms_consents_user_version_uidx"
    UNIQUE ("user_id", "terms_version_id")
);

CREATE INDEX "terms_consents_user_id_idx"
  ON "terms_consents" USING btree ("user_id");

CREATE INDEX "terms_consents_version_id_idx"
  ON "terms_consents" USING btree ("terms_version_id");

COMMIT;
