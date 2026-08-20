BEGIN;

CREATE TYPE "agreement_status" AS ENUM (
  'draft',
  'prepared',
  'awaiting_confirmation',
  'confirmed',
  'superseded',
  'cancelled',
  'expired'
);

CREATE TYPE "agreement_version_status" AS ENUM (
  'draft',
  'prepared',
  'published',
  'superseded'
);

CREATE TYPE "agreement_actor_role" AS ENUM (
  'client',
  'lawyer'
);

CREATE TABLE "agreements" (
  "id" text PRIMARY KEY NOT NULL,
  "quote_id" text NOT NULL,
  "client_id" text NOT NULL,
  "lawyer_id" text NOT NULL,
  "status" "agreement_status" DEFAULT 'draft' NOT NULL,
  "current_version_id" text,
  "confirmed_at" timestamp,
  "confirmed_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "agreements_quote_id_fk" FOREIGN KEY ("quote_id") REFERENCES "representation_quotes"("id"),
  CONSTRAINT "agreements_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "users"("id"),
  CONSTRAINT "agreements_lawyer_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "users"("id"),
  CONSTRAINT "agreements_confirmed_by_fk" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id")
);

CREATE TABLE "agreement_versions" (
  "id" text PRIMARY KEY NOT NULL,
  "agreement_id" text NOT NULL,
  "version" integer NOT NULL,
  "status" "agreement_version_status" DEFAULT 'draft' NOT NULL,
  "content" text NOT NULL,
  "content_hash" text NOT NULL,
  "created_by" text NOT NULL,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "agreement_versions_agreement_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id"),
  CONSTRAINT "agreement_versions_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id"),
  CONSTRAINT "agreement_versions_agreement_version_uidx" UNIQUE ("agreement_id", "version")
);

ALTER TABLE "agreements"
  ADD CONSTRAINT "agreements_current_version_id_fk"
  FOREIGN KEY ("current_version_id") REFERENCES "agreement_versions"("id");

CREATE TABLE "agreement_confirmations" (
  "id" text PRIMARY KEY NOT NULL,
  "agreement_id" text NOT NULL,
  "agreement_version_id" text NOT NULL,
  "actor_user_id" text NOT NULL,
  "actor_role" "agreement_actor_role" NOT NULL,
  "confirmed_at" timestamp DEFAULT now() NOT NULL,
  "content_hash" text NOT NULL,
  "idempotency_key" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "agreement_confirmations_agreement_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id"),
  CONSTRAINT "agreement_confirmations_version_id_fk" FOREIGN KEY ("agreement_version_id") REFERENCES "agreement_versions"("id"),
  CONSTRAINT "agreement_confirmations_actor_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id"),
  CONSTRAINT "agreement_confirmations_actor_uidx" UNIQUE ("agreement_id", "agreement_version_id", "actor_user_id"),
  CONSTRAINT "agreement_confirmations_idempotency_uidx" UNIQUE ("agreement_id", "idempotency_key")
);

CREATE TABLE "agreement_evidence" (
  "id" text PRIMARY KEY NOT NULL,
  "confirmation_id" text NOT NULL,
  "agreement_id" text NOT NULL,
  "agreement_version_id" text NOT NULL,
  "actor_user_id" text NOT NULL,
  "content_hash" text NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "agreement_evidence_confirmation_id_fk" FOREIGN KEY ("confirmation_id") REFERENCES "agreement_confirmations"("id"),
  CONSTRAINT "agreement_evidence_agreement_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id"),
  CONSTRAINT "agreement_evidence_version_id_fk" FOREIGN KEY ("agreement_version_id") REFERENCES "agreement_versions"("id"),
  CONSTRAINT "agreement_evidence_actor_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id"),
  CONSTRAINT "agreement_evidence_confirmation_uidx" UNIQUE ("confirmation_id")
);

CREATE INDEX "agreements_quote_id_idx" ON "agreements" USING btree ("quote_id");
CREATE INDEX "agreements_client_id_idx" ON "agreements" USING btree ("client_id");
CREATE INDEX "agreements_lawyer_id_idx" ON "agreements" USING btree ("lawyer_id");
CREATE INDEX "agreement_versions_content_hash_idx" ON "agreement_versions" USING btree ("content_hash");
CREATE INDEX "agreement_evidence_agreement_id_idx" ON "agreement_evidence" USING btree ("agreement_id");
CREATE INDEX "agreement_evidence_version_id_idx" ON "agreement_evidence" USING btree ("agreement_version_id");

COMMIT;
