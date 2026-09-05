import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.join(
  scriptDir,
  "..",
  "migrations",
  "0015_notifications_rls_pilot.sql",
);
const migrationSql = await readFile(migrationPath, "utf8");

const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query(migrationSql);
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}

console.log("Applied 0015_notifications_rls_pilot.sql");
