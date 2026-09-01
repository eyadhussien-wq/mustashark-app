BEGIN;

CREATE TYPE "neutral_document_status" AS ENUM ('draft', 'active', 'archived');
CREATE TYPE "neutral_document_share_status" AS ENUM ('active', 'revoked');

CREATE TABLE "neutral_documents" (
  "id" text PRIMARY KEY NOT NULL,
  "lawyer_id" text NOT NULL,
  "matter_id" text,
  "title" text NOT NULL,
  "storage_key" text NOT NULL,
  "content_hash" text,
  "status" "neutral_document_status" DEFAULT 'draft' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "archived_at" timestamp,
  CONSTRAINT "neutral_documents_lawyer_id_fk"
    FOREIGN KEY ("lawyer_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "neutral_documents_matter_id_fk"
    FOREIGN KEY ("matter_id") REFERENCES "neutral_matters"("id") ON DELETE SET NULL
);

CREATE TABLE "neutral_document_shares" (
  "id" text PRIMARY KEY NOT NULL,
  "document_id" text NOT NULL,
  "client_id" text NOT NULL,
  "status" "neutral_document_share_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "revoked_at" timestamp,
  CONSTRAINT "neutral_document_shares_document_id_fk"
    FOREIGN KEY ("document_id") REFERENCES "neutral_documents"("id") ON DELETE CASCADE,
  CONSTRAINT "neutral_document_shares_client_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "neutral_documents_lawyer_id_idx"
  ON "neutral_documents" USING btree ("lawyer_id");
CREATE INDEX "neutral_documents_matter_id_idx"
  ON "neutral_documents" USING btree ("matter_id");
CREATE INDEX "neutral_documents_lawyer_status_idx"
  ON "neutral_documents" USING btree ("lawyer_id", "status");

CREATE UNIQUE INDEX "neutral_document_shares_document_client_uq"
  ON "neutral_document_shares" USING btree ("document_id", "client_id");
CREATE INDEX "neutral_document_shares_client_status_idx"
  ON "neutral_document_shares" USING btree ("client_id", "status");
CREATE INDEX "neutral_document_shares_document_status_idx"
  ON "neutral_document_shares" USING btree ("document_id", "status");

COMMIT;
