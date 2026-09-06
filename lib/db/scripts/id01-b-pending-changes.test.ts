import assert from "node:assert/strict";
import { Client } from "pg";
import { test } from "node:test";
import { db, pool } from "../src/index.ts";
import { getPendingChanges } from "../../artifacts/api-server/src/controllers/profilePendingChanges.ts";
import { assertNoUebDbActorContext } from "../src/ueb.ts";

function isolatedUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("ID01B_DATABASE_URL_MISSING");
  const url = new URL(value);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
  if (!local || !database.endsWith("_test")) throw new Error("ID01B_REFUSES_NON_ISOLATED_DATABASE");
  return value;
}

type AuthUser = { userId: string; role: "lawyer" };

function makeRequest(authUser: AuthUser) {
  return {
    authUser,
    log: { error: () => undefined },
  } as any;
}

function makeResponse() {
  let statusCode = 200;
  let body: unknown;
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
    read() {
      return { statusCode, body };
    },
  };
}

async function callPendingChanges(userId: string) {
  const response = makeResponse();
  await getPendingChanges(makeRequest({ userId, role: "lawyer" }), response as any);
  return response.read();
}

test("ID-01-B pending-changes UEB + negative/isolation oracle", async () => {
  const observer = new Client({ connectionString: isolatedUrl() });
  await observer.connect();
  const suffix = `${process.pid}_${Date.now()}`;
  const lawyerA = `id01b-lawyer-a-${suffix}`;
  const lawyerB = `id01b-lawyer-b-${suffix}`;
  const emailA = `${lawyerA}@example.test`;
  const emailB = `${lawyerB}@example.test`;

  try {
    await observer.query(
      `insert into users (id, name, email, role, account_status, auth_provider) values ($1, $2, $3, 'lawyer', 'active', 'local'), ($4, $5, $6, 'lawyer', 'active', 'local')`,
      [lawyerA, "ID01B Lawyer A", emailA, lawyerB, "ID01B Lawyer B", emailB],
    );

    await observer.query(
      `insert into lawyer_profile_change_requests (id, lawyer_id, field, new_value, status, reviewed_by) values
       ($1, $2, 'specialization', 'A pending specialization', 'pending', null),
       ($3, $2, 'bio', 'A rejected bio', 'rejected', $4),
       ($5, $2, 'hourlyRate', '999', 'rejected', null),
       ($6, $7, 'specialization', 'B private specialization', 'pending', null)`,
      [
        `id01b-spec-${suffix}`,
        lawyerA,
        `id01b-bio-${suffix}`,
        lawyerB,
        `id01b-rate-${suffix}`,
        `id01b-b-spec-${suffix}`,
        lawyerB,
      ],
    );

    const a = await callPendingChanges(lawyerA);
    const b = await callPendingChanges(lawyerB);

    assert.equal(a.statusCode, 200);
    assert.equal(b.statusCode, 200);

    const aRows = (a.body as any).requests;
    const bRows = (b.body as any).requests;
    assert.deepEqual(aRows.map((row: any) => row.id), [
      `id01b-spec-${suffix}`,
      `id01b-bio-${suffix}`,
    ]);
    assert.equal(aRows.some((row: any) => row.id === `id01b-rate-${suffix}`), false);
    assert.deepEqual(bRows.map((row: any) => row.id), [`id01b-b-spec-${suffix}`]);
    assert.equal(aRows.some((row: any) => row.id === `id01b-b-spec-${suffix}`), false);
    assert.equal(bRows.some((row: any) => row.id === `id01b-spec-${suffix}`), false);

    const concurrent = await Promise.all([
      callPendingChanges(lawyerA),
      callPendingChanges(lawyerB),
      callPendingChanges(lawyerA),
      callPendingChanges(lawyerB),
    ]);
    assert.equal(concurrent[0].statusCode, 200);
    assert.equal(concurrent[1].statusCode, 200);
    assert.equal((concurrent[0].body as any).requests.some((row: any) => row.id === `id01b-b-spec-${suffix}`), false);
    assert.equal((concurrent[1].body as any).requests.some((row: any) => row.id === `id01b-spec-${suffix}`), false);

    await assertNoUebDbActorContext(db);

    console.log(JSON.stringify({
      harness: "M0-PROOF-HARNESS-001",
      mode: "ID-01-B-PENDING-CHANGES",
      proofs: ["trusted-actor", "UEB-transaction", "A/B-negative-isolation", "rejected-filter", "concurrency", "context-cleanup"],
      result: "DB-ORACLE-PASS",
    }));
  } finally {
    await observer.query(`delete from lawyer_profile_change_requests where id like 'id01b-%'`);
    await observer.query(`delete from users where id in ($1, $2)`, [lawyerA, lawyerB]);
    await observer.end();
    await pool.end();
  }
});
