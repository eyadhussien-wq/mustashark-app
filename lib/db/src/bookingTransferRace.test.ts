import { strict as assert } from "node:assert";
import test from "node:test";
import pg from "pg";

const { Client } = pg;

function databaseUrl() {
  const value = process.env.DATABASE_URL;
  assert(value, "DATABASE_URL must point to a dedicated test database for the transfer race test");
  return value;
}

test("T1: two concurrent transfer gates yield exactly one winner", async (t) => {
  const setup = new Client({ connectionString: databaseUrl() });
  await setup.connect();
  t.after(async () => setup.end());

  await setup.query(`
    CREATE TEMP TABLE transfer_gate_test (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      escrow_status TEXT NOT NULL
    )
  `);
  await setup.query(`INSERT INTO transfer_gate_test VALUES ('booking-1', 'no_show_lawyer', 'held')`);

  // The two clients deliberately use independent transactions against the same row.
  const a = new Client({ connectionString: databaseUrl() });
  const b = new Client({ connectionString: databaseUrl() });
  await Promise.all([a.connect(), b.connect()]);
  t.after(async () => Promise.all([a.end(), b.end()]));

  // Recreate the shared test row outside the TEMP table so both connections can see it.
  await setup.query(`DROP TABLE transfer_gate_test`);
  await setup.query(`CREATE TABLE transfer_gate_test_shared (id TEXT PRIMARY KEY, status TEXT NOT NULL, escrow_status TEXT NOT NULL)`);
  await setup.query(`INSERT INTO transfer_gate_test_shared VALUES ('booking-1', 'no_show_lawyer', 'held')`);
  t.after(async () => setup.query(`DROP TABLE IF EXISTS transfer_gate_test_shared`));

  await Promise.all([a.query("BEGIN"), b.query("BEGIN")]);
  const update = `
    UPDATE transfer_gate_test_shared
    SET escrow_status = 'refunded'
    WHERE id = 'booking-1'
      AND status = 'no_show_lawyer'
      AND escrow_status = 'held'
    RETURNING id
  `;

  const [resultA, resultB] = await Promise.all([a.query(update), b.query(update)]);
  const winners = Number(resultA.rowCount ?? 0) + Number(resultB.rowCount ?? 0);
  assert.equal(winners, 1, "exactly one concurrent transfer must consume the held escrow");

  await Promise.all([a.query("ROLLBACK"), b.query("ROLLBACK")]);
});
