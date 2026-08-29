import assert from "node:assert/strict";
import crypto from "node:crypto";
import pg from "pg";

const databaseUrl = process.env.ADMIN_INTERVENTION_TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("ADMIN_INTERVENTION_TEST_DATABASE_URL is required");
if (/(prod|production|live)/i.test(databaseUrl)) throw new Error("Refusing to run S02-08 database verification against a production-like database URL");

const pool = new pg.Pool({ connectionString: databaseUrl });
const client = await pool.connect();
const auditId = `s02-08-immutability-${crypto.randomUUID()}`;
const adminId = "s02-08-admin-reference";
const caseId = `s02-08-immutability-case-${crypto.randomUUID()}`;

try {
  await client.query("BEGIN");
  await client.query("SAVEPOINT s02_08_fixture");

  await client.query(
    "INSERT INTO admin_audit_logs (id, admin_id, action, entity_type, entity_id, description) VALUES ($1, $2, $3, $4, $5, $6)",
    [auditId, adminId, "s02-08.immutability.verify", "case", caseId, "isolated S02-08 immutability verification"],
  );

  await client.query("SAVEPOINT s02_08_update");
  try {
    await client.query("UPDATE admin_audit_logs SET description = 'tampered' WHERE id = $1", [auditId]);
    assert.fail("UPDATE unexpectedly succeeded on immutable admin_audit_logs");
  } catch (error) {
    assert.equal((error as { code?: string }).code, "42501");
    console.log("ADMIN_AUDIT_IMMUTABLE_UPDATE=42501");
  } finally {
    await client.query("ROLLBACK TO SAVEPOINT s02_08_update");
  }

  await client.query("SAVEPOINT s02_08_delete");
  try {
    await client.query("DELETE FROM admin_audit_logs WHERE id = $1", [auditId]);
    assert.fail("DELETE unexpectedly succeeded on immutable admin_audit_logs");
  } catch (error) {
    assert.equal((error as { code?: string }).code, "42501");
    console.log("ADMIN_AUDIT_IMMUTABLE_DELETE=42501");
  } finally {
    await client.query("ROLLBACK TO SAVEPOINT s02_08_delete");
  }

  const result = await client.query("SELECT id FROM admin_audit_logs WHERE id = $1", [auditId]);
  assert.equal(result.rowCount, 1, "Audit row must remain after rejected UPDATE/DELETE attempts");
  console.log(`ADMIN_AUDIT_IMMUTABILITY_VERIFIED=${auditId}`);

  await client.query("ROLLBACK TO SAVEPOINT s02_08_fixture");
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
