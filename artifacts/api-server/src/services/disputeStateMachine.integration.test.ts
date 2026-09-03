import assert from "node:assert/strict";
import crypto from "node:crypto";
import test, { after } from "node:test";
import { eq, inArray } from "drizzle-orm";
import { db, pool } from "@workspace/db";
import {
  agreementsTable,
  casesTable,
  disputesTable,
  representationQuotesTable,
  usersTable,
} from "@workspace/db";

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

const clientId = crypto.randomUUID();
const lawyerId = crypto.randomUUID();
const quoteId = crypto.randomUUID();
const agreementId = crypto.randomUUID();
const caseId = crypto.randomUUID();
const disputeId = crypto.randomUUID();
const raceId = crypto.randomUUID();
const resolutionFixtureId = crypto.randomUUID();
const suffix = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

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

function transition(disputeIdValue: string, from: string, to: string, expectedVersion: number, outcome: string | null = null) {
  return pool.query(
    `UPDATE disputes
     SET lifecycle_state = $1::dispute_lifecycle_state,
         resolution_outcome = $2::dispute_resolution_outcome,
         version = version + 1,
         closed_at = CASE WHEN $1::dispute_lifecycle_state = 'closed'::dispute_lifecycle_state THEN now() ELSE NULL END,
         updated_at = now()
     WHERE id = $3 AND lifecycle_state = $4 AND version = $5
     RETURNING lifecycle_state, version`,
    [to, outcome, disputeIdValue, from, expectedVersion],
  );
}

test("T02-02 lifecycle follows the approved transition contract", async () => {
  await pool.query(
    `INSERT INTO disputes (id, case_id, opened_by, lifecycle_state, version, opened_at, created_at, updated_at)
     VALUES ($1, $2, $3, 'open', 1, now(), now(), now())`,
    [disputeId, caseId, clientId],
  );

  const states: Array<[string, string]> = [
    ["open", "mediation"],
    ["mediation", "admin_review"],
    ["admin_review", "decision_pending"],
    ["decision_pending", "resolution_pending"],
  ];

  let version = 1;
  for (const [from, to] of states) {
    const result = await transition(disputeId, from, to, version);
    assert.equal(result.rowCount, 1, `${from}->${to} must succeed`);
    version += 1;
  }

  const closed = await transition(disputeId, "resolution_pending", "closed", version, "dismissed");
  assert.equal(closed.rowCount, 1);

  const final = await pool.query(
    "SELECT lifecycle_state, resolution_outcome, version FROM disputes WHERE id = $1",
    [disputeId],
  );
  assert.deepEqual(final.rows[0], {
    lifecycle_state: "closed",
    resolution_outcome: "dismissed",
    version: 6,
  });
});

test("T02-02 rejects illegal terminal transitions", async () => {
  const result = await transition(disputeId, "closed", "open", 6);
  assert.equal(result.rowCount, 0);
});

test("T02-02 optimistic concurrency allows exactly one winner", async () => {
  await pool.query(
    `INSERT INTO disputes (id, case_id, opened_by, lifecycle_state, version, opened_at, created_at, updated_at)
     VALUES ($1, $2, $3, 'open', 1, now(), now(), now())`,
    [raceId, caseId, clientId],
  );

  const [a, b] = await Promise.all([
    transition(raceId, "open", "mediation", 1),
    transition(raceId, "open", "mediation", 1),
  ]);
  assert.equal([a, b].filter((r) => r.rowCount === 1).length, 1);
  assert.equal([a, b].filter((r) => r.rowCount === 0).length, 1);

  const final = await pool.query("SELECT lifecycle_state, version FROM disputes WHERE id = $1", [raceId]);
  assert.deepEqual(final.rows[0], { lifecycle_state: "mediation", version: 2 });
});

test("T02-02 enforces resolution outcome only at CLOSED", async () => {
  await pool.query(
    `INSERT INTO disputes (id, case_id, opened_by, lifecycle_state, version, opened_at, created_at, updated_at)
     VALUES ($1, $2, $3, 'open', 1, now(), now(), now())`,
    [resolutionFixtureId, caseId, clientId],
  );

  await assert.rejects(
    pool.query(
      `UPDATE disputes SET resolution_outcome = 'client' WHERE id = $1`,
      [resolutionFixtureId],
    ),
  );
});

after(async () => {
  await db.delete(disputesTable).where(inArray(disputesTable.id, [disputeId, raceId, resolutionFixtureId]));
  await db.delete(casesTable).where(eq(casesTable.id, caseId));
  await db.delete(agreementsTable).where(eq(agreementsTable.id, agreementId));
  await db.delete(representationQuotesTable).where(eq(representationQuotesTable.id, quoteId));
  await db.delete(usersTable).where(inArray(usersTable.id, [clientId, lawyerId]));
  await pool.end();
});
