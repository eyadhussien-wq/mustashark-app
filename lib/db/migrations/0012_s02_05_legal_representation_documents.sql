BEGIN;

CREATE TYPE "legal_representation_document_type" AS ENUM (
  'poa',
  'court_proof',
  'expert_report'
);

CREATE TYPE "legal_representation_document_status" AS ENUM (
  'uploaded',
  'submitted',
  'under_review',
  'verified',
  'rejected',
  'superseded'
);

CREATE TYPE "legal_representation_document_uploader_role" AS ENUM (
  'client',
  'lawyer',
  'admin'
);

CREATE TABLE "legal_representation_documents" (
  "id" text PRIMARY KEY NOT NULL,
  "agreement_id" text NOT NULL,
  "case_id" text,
  "document_type" "legal_representation_document_type" NOT NULL,
  "status" "legal_representation_document_status" DEFAULT 'uploaded' NOT NULL,
  "uploaded_by" text NOT NULL,
  "uploaded_by_role" "legal_representation_document_uploader_role" NOT NULL,
  "file_name" text NOT NULL,
  "mime_type" text,
  "storage_key" text NOT NULL,
  "content_hash" text NOT NULL,
  "title" text NOT NULL,
  "court_name" text,
  "case_number_reference" text,
  "issued_at" timestamp,
  "submitted_at" timestamp,
  "review_started_at" timestamp,
  "verified_at" timestamp,
  "verified_by" text,
  "rejected_at" timestamp,
  "rejection_reason" text,
  "superseded_at" timestamp,
  "supersedes_document_id" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "legal_representation_documents_agreement_id_fk"
    FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id"),
  CONSTRAINT "legal_representation_documents_uploaded_by_fk"
    FOREIGN KEY ("uploaded_by") REFERENCES "users"("id"),
  CONSTRAINT "legal_representation_documents_verified_by_fk"
    FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE set null,
  CONSTRAINT "legal_representation_documents_supersedes_document_id_fk"
    FOREIGN KEY ("supersedes_document_id") REFERENCES "legal_representation_documents"("id") ON DELETE set null
);

CREATE INDEX "legal_representation_documents_agreement_id_idx"
  ON "legal_representation_documents" USING btree ("agreement_id");
CREATE INDEX "legal_representation_documents_case_id_idx"
  ON "legal_representation_documents" USING btree ("case_id");
CREATE INDEX "legal_representation_documents_status_idx"
  ON "legal_representation_documents" USING btree ("status");
CREATE INDEX "legal_representation_documents_type_idx"
  ON "legal_representation_documents" USING btree ("document_type");
CREATE INDEX "legal_representation_documents_content_hash_idx"
  ON "legal_representation_documents" USING btree ("content_hash");

COMMIT;
