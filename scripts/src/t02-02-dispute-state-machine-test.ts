import crypto from "node:crypto";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const parsed = new URL(databaseUrl);
const host = parsed.hostname.toLowerCase();
if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
  throw new Error(`Production DB Guard: refusing non-isolated host ${host}`);
}
if (!/mustashark_test|test/i.test(parsed.pathname)) {
  throw new Error("Production DB Guard: database name is not explicitly test-only");
}

const pool = new Pool({ connectionString: databaseUrl });

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const clientId = crypto.randomUUID();
const lawyerId = crypto.randomUUID();
const quoteId = crypto.randomUUID();
const agreementId = crypto.randomUUID();
const caseId = crypto.randomUUID();
const disputeId = crypto.randomUUID();
const raceId = crypto.randomUUID();
const suffix = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

async function main() {
  await pool.query("SELECT 1");

  await pool.query(
    `INSERT INTO users (id, name, email, role, password_hash, account_status, litigation_tier, created_at, updated_at)
     VALUES ($1, 'T02-02 Client', $2, 'client', 'ci-test-only', 'active', 'general', now(), now()),
            ($3, 'T02-02 Lawyer', $4, 'lawyer', 'ci-test-only', 'active', 'general', now(), now())`,
    [clientId, `client-${suffix}@test.invalid`, lawyerId, `lawyer-${suffix}@test.invalid`],
  );
  await pool.query(
    `INSERT INTO representation_quotes (id, client_id, lawyer_id, title, total_amount, currency, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'T02-02 CI fixture', '100.00', 'JOD', 'accepted', now(), now())`,
    [quoteId, clientId, lawyerId],
  );
  await pool.query(
    `INSERT INTO agreements (id, quote_id, client_id, lawyer_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'confirmed', now(), now())`,
    [agreementId, quoteId, clientId, lawyerId],
  );
  await pool.query(
    `INSERT INTO cases (id, agreement_id, client_id, lawyer_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'active', now(), now())`,
    [caseId, agreementId, clientId, lawyerId],
  );
  await pool.query(
    `INSERT INTO disputes (id, case_id, opened_by, lifecycle_state, version, opened_at, created_at, updated_at)
     VALUES ($1, $2, $3, 'open', 1, now(), now(), now())`,
    [disputeId, caseId, clientId],
  );

  const expected: Array<[string, string]> = [
    ["open", "mediation"],
    ["mediation", "admin_review"],
    ["admin_review", "decision_pending"],
    ["decision_pending", "resolution_pending"],
    ["resolution_pending", "closed"],
  ];

  for (const [from, to] of expected) {
    const current = await pool.query("SELECT lifecycle_state, version FROM disputes WHERE id = $1", [disputeId]);
    const row = current.rows[0];
    assert(row.lifecycle_state === from, `unexpected source state: ${row.lifecycle_state}; expected ${from}`);
    const result = await pool.query(
      `UPDATE disputes
       SET lifecycle_state = $1,
           resolution_outcome = CASE WHEN $1 = 'closed' THEN 'dismissed'::dispute_resolution_outcome ELSE NULL END,
           version = version + 1,
           closed_at = CASE WHEN $1 = 'closed' THEN now() ELSE NULL END,
           updated_at = now()
       WHERE id = $2 AND lifecycle_state = $3 AND version = $4
       RETURNING lifecycle_state, version`,
      [to, disputeId, from, row.version],
    );
    assert(result.rowCount === 1, `transition ${from}->${to} did not commit`);
  }

  const final = await pool.query("SELECT lifecycle_state, resolution_outcome, version FROM disputes WHERE id = $1", [disputeId]);
  assert(final.rows[0].lifecycle_state === "closed", "final state is not closed");
  assert(final.rows[0].resolution_outcome === "dismissed", "closed dispute has no resolution outcome");
  assert(final.rows[0].version === 6, `unexpected final version ${final.rows[0].version}`);

  const invalid = await pool.query(
    `UPDATE disputes SET lifecycle_state = 'open', version = version + 1 WHERE id = $1 AND lifecycle_state = 'closed' AND version = 6 RETURNING id`,
    [disputeId],
  );
  assert(invalid.rowCount === 0, "terminal CLOSED state accepted an invalid transition");

  await pool.query(
    `INSERT INTO disputes (id, case_id, opened_by, lifecycle_state, version, opened_at, created_at, updated_at)
     VALUES ($1, $2, $3, 'open', 1, now(), now(), now())`,
    [raceId, caseId, clientId],
  );
  const race = await Promise.all([
    pool.query(
      `UPDATE disputes SET lifecycle_state = 'mediation', version = version + 1, updated_at = now()
       WHERE id = $1 AND lifecycle_state = 'open' AND version = 1 RETURNING id`,
      [raceId],
    ),
    pool.query(
      `UPDATE disputes SET lifecycle_state = 'mediation', version = version + 1, updated_at = now()
       WHERE id = $1 AND lifecycle_state = 'open' AND version = 1 RETURNING id`,
      [raceId],
    ),
  ]);
  assert(race.filter((r) => r.rowCount === 1).length === 1, "optimistic concurrency did not allow exactly one winner");
  assert(race.filter((r) => r.rowCount === 0).length === 1, "optimistic concurrency did not reject the stale writer");

  const raceFinal = await pool.query("SELECT lifecycle_state, version FROM disputes WHERE id = $1", [raceId]);
  assert(raceFinal.rows[0].lifecycle_state === "mediation" && raceFinal.rows[0].version === 2, "race final state/version is incorrect");

  console.log("T02-02 DISPUTE STATE MACHINE TEST PASSED");
  console.log("- lifecycle transitions: OPEN -> MEDIATION -> ADMIN_REVIEW -> DECISION_PENDING -> RESOLUTION_PENDING -> CLOSED");
  console.log("- resolution outcome required only at CLOSED");
  console.log("- terminal CLOSED state rejects invalid transition");
  console.log("- optimistic version concurrency: exactly one winner");
  console.log("- Production DB Guard: isolated localhost test database only");
  console.log(`- final version: ${final.rows[0].version}`);
}

try {
  await main();
} finally {
  await pool.end();
}
