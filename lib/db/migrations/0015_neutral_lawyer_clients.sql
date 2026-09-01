BEGIN;

CREATE TYPE "lawyer_client_status" AS ENUM ('active', 'archived');

CREATE TABLE "lawyer_clients" (
  "id" text PRIMARY KEY NOT NULL,
  "lawyer_id" text NOT NULL,
  "client_id" text NOT NULL,
  "status" "lawyer_client_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "archived_at" timestamp,
  CONSTRAINT "lawyer_clients_lawyer_id_fk"
    FOREIGN KEY ("lawyer_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "lawyer_clients_client_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "lawyer_clients_lawyer_client_uq"
  ON "lawyer_clients" USING btree ("lawyer_id", "client_id");
CREATE INDEX "lawyer_clients_lawyer_id_idx"
  ON "lawyer_clients" USING btree ("lawyer_id");
CREATE INDEX "lawyer_clients_client_id_idx"
  ON "lawyer_clients" USING btree ("client_id");
CREATE INDEX "lawyer_clients_status_idx"
  ON "lawyer_clients" USING btree ("status");

COMMIT;
