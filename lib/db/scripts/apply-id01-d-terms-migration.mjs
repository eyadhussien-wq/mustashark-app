import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "";
const parsed = databaseUrl ? new URL(databaseUrl) : null;
if (!parsed || !["localhost", "127.0.0.1", "::1"].includes(parsed.hostname) || !parsed.pathname.endsWith("_test")) {
  throw new Error("ID-01-D migration runner requires an isolated localhost *_test DATABASE_URL");
}

const migrationPath = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../migrations/0015_platform_terms_consent.sql",
);
const migrationSql = await readFile(migrationPath, "utf8");
const triggerSql = migrationSql.slice(migrationSql.indexOf("CREATE OR REPLACE FUNCTION validate_terms_consent_evidence()"));
const pool = new pg.Pool({ connectionString: databaseUrl });

try {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(`
      SELECT
        to_regclass('public.terms_versions') IS NOT NULL AS terms_versions_exists,
        to_regclass('public.terms_consents') IS NOT NULL AS terms_consents_exists
    `);
    if (!rows[0]?.terms_versions_exists || !rows[0]?.terms_consents_exists) {
      throw new Error("ID-01-D requires terms_versions and terms_consents from the base schema before installing migration guards");
    }
    await client.query(triggerSql);
    await client.query("COMMIT");
    console.log(JSON.stringify({ mode: "ID-01-D-MIGRATION-SETUP", migration: "0015_platform_terms_consent.sql", result: "MIGRATION-GUARDS-APPLIED-IN-ISOLATED-DB" }));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
