BEGIN;

CREATE TYPE "neutral_matter_status" AS ENUM ('active', 'completed', 'archived');

CREATE TABLE "neutral_matters" (
  "id" text PRIMARY KEY NOT NULL,
  "lawyer_id" text NOT NULL,
  "client_id" text NOT NULL,
  "title" text NOT NULL,
  "status" "neutral_matter_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "archived_at" timestamp,
  CONSTRAINT "neutral_matters_lawyer_id_fk"
    FOREIGN KEY ("lawyer_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "neutral_matters_client_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "neutral_matters_lawyer_id_idx"
  ON "neutral_matters" USING btree ("lawyer_id");
CREATE INDEX "neutral_matters_client_id_idx"
  ON "neutral_matters" USING btree ("client_id");
CREATE INDEX "neutral_matters_status_idx"
  ON "neutral_matters" USING btree ("status");

COMMIT;
