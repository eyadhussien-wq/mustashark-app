import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "";
const parsed = databaseUrl ? new URL(databaseUrl) : null;
if (!parsed || !["localhost", "127.0.0.1", "::1"].includes(parsed.hostname) || !parsed.pathname.endsWith("_test")) {
  throw new Error("ID-01-D migration runner requires an isolated localhost *_test DATABASE_URL");
}

const migrationPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../lib/db/migrations/0015_platform_terms_consent.sql",
);
const migrationSql = await readFile(migrationPath, "utf8");
const pool = new pg.Pool({ connectionString: databaseUrl });

try {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DROP TABLE IF EXISTS terms_consents CASCADE");
    await client.query("DROP TABLE IF EXISTS terms_versions CASCADE");
    await client.query("DROP TYPE IF EXISTS terms_consent_source CASCADE");
    await client.query("DROP TYPE IF EXISTS terms_version_status CASCADE");
    await client.query(migrationSql);
    await client.query("COMMIT");
    console.log(JSON.stringify({ mode: "ID-01-D-MIGRATION-SETUP", migration: "0015_platform_terms_consent.sql", result: "MIGRATION-APPLIED-IN-ISOLATED-DB" }));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
