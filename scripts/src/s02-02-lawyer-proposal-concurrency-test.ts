import assert from "node:assert/strict";
import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  db,
  lawyerProposalsTable,
  lawyerVerificationsTable,
  pool,
  representationQuoteRequestsTable,
  usersTable,
} from "@workspace/db";

const baseUrl = process.env.S02_02_BASE_URL ?? "http://127.0.0.1:8081";
const clientEmail = process.env.S02_02_CLIENT_EMAIL ?? "client@mustashark.com";
const clientPassword = process.env.S02_02_CLIENT_PASSWORD ?? "test1234";
const lawyerEmail = process.env.S02_02_LAWYER_EMAIL ?? "lawyer@mustashark.com";
const lawyerPassword = process.env.S02_02_LAWYER_PASSWORD ?? "test1234";

function assertOk(condition: unknown, message: string): asserts condition {
  assert(condition, message);
}

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body };
}

async function post(path: string, body: unknown, token: string, idempotencyKey?: string) {
  return request(path, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function login(email: string, password: string, role: "client" | "lawyer") {
  const result = await postWithoutAuth("/api/auth/local-auth", { email, password, role });
  assertOk(result.status === 200, `login failed for ${role}: ${JSON.stringify(result.body)}`);
  assertOk(typeof result.body?.jwt === "string", `missing JWT for ${role}`);
  return result.body.jwt as string;
}

async function postWithoutAuth(path: string, body: unknown) {
  return request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function prepareApprovedLawyerFixture() {
  const lawyer = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, lawyerEmail),
  });
  assertOk(lawyer, `lawyer fixture user not found: ${lawyerEmail}`);

  const now = new Date();
  const verification = await db.query.lawyerVerificationsTable.findFirst({
    where: eq(lawyerVerificationsTable.userId, lawyer.id),
  });

  if (!verification) {
    await db.insert(lawyerVerificationsTable).values({
      id: `s02-02-verification-${crypto.randomUUID()}`,
      userId: lawyer.id,
      status: "approved",
      reviewedAt: now,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  await db
    .update(lawyerVerificationsTable)
    .set({
      status: "approved",
      reviewedAt: now,
      rejectionReason: null,
      updatedAt: now,
    })
    .where(eq(lawyerVerificationsTable.userId, lawyer.id));
}

async function createRequest(clientToken: string) {
  const key = `s02-02-request-${Date.now()}-${Math.random()}`;
  const result = await post(
    "/api/representation/quote-requests",
    { title: `S02.2 concurrency ${Date.now()}`, description: "Proposal concurrency fixture" },
    clientToken,
    key,
  );
  assertOk(result.status === 201, `request creation failed: ${JSON.stringify(result.body)}`);
  assertOk(typeof result.body?.request?.id === "string", "request id missing");
  return result.body.request.id as string;
}

async function createProposal(requestId: string, lawyerToken: string, key = `s02-02-proposal-${Date.now()}-${Math.random()}`) {
  const result = await post(
    `/api/representation-quote-requests/${requestId}/proposals`,
    { amount: "125.50", currency: "QAR" },
    lawyerToken,
    key,
  );
  assertOk(result.status === 201, `proposal creation failed: ${JSON.stringify(result.body)}`);
  assertOk(typeof result.body?.proposal?.id === "string", "proposal id missing");
  return result.body.proposal as { id: string; status: string; expiresAt: string };
}

const clientToken = await login(clientEmail, clientPassword, "client");
const lawyerToken = await login(lawyerEmail, lawyerPassword, "lawyer");
await prepareApprovedLawyerFixture();

// Scenario A: concurrent acceptance + replay.
{
  const requestId = await createRequest(clientToken);
  const proposal = await createProposal(requestId, lawyerToken);
  const key = `s02-02-accept-${Date.now()}-${Math.random()}`;
  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      post(`/api/representation-quote-requests/${requestId}/proposals/${proposal.id}/accept`, {}, clientToken, key),
    ),
  );
  assert.ok(results.every((r) => r.status === 200), `concurrent accept must replay 200: ${JSON.stringify(results)}`);
  const ids = new Set(results.map((r) => r.body?.proposal?.id));
  assert.equal(ids.size, 1, "concurrent accept must resolve to one proposal id");
  assert.equal(results[0]?.body?.proposal?.status, "accepted", "accepted state must be persisted");

  const retry = await post(
    `/api/representation-quote-requests/${requestId}/proposals/${proposal.id}/accept`,
    {},
    clientToken,
    key,
  );
  assert.equal(retry.status, 200, "idempotent accept retry must replay 200");
  assert.equal(retry.body?.proposal?.status, "accepted", "idempotent retry must preserve accepted state");
}

// Scenario B: concurrent accept vs reject with distinct idempotency keys.
{
  const requestId = await createRequest(clientToken);
  const proposal = await createProposal(requestId, lawyerToken);
  const [accept, reject] = await Promise.all([
    post(`/api/representation-quote-requests/${requestId}/proposals/${proposal.id}/accept`, {}, clientToken, `accept-${Date.now()}-${Math.random()}`),
    post(`/api/representation-quote-requests/${requestId}/proposals/${proposal.id}/reject`, {}, clientToken, `reject-${Date.now()}-${Math.random()}`),
  ]);
  const statuses = [accept.status, reject.status].sort((a, b) => a - b);
  assert.deepEqual(statuses, [200, 409], `accept/reject race must yield one winner and one conflict: ${JSON.stringify({ accept, reject })}`);

  const persisted = await db.query.lawyerProposalsTable.findFirst({ where: eq(lawyerProposalsTable.id, proposal.id) });
  assert.ok(persisted, "proposal must remain persisted after accept/reject race");
  assert.ok(["accepted", "rejected"].includes(persisted.status), `unexpected final state: ${persisted.status}`);
}

// Scenario C: parent request state guard. Once the parent request is no longer active,
// proposal transitions must be rejected and the proposal must remain submitted.
{
  const requestId = await createRequest(clientToken);
  const proposal = await createProposal(requestId, lawyerToken);
  await db
    .update(representationQuoteRequestsTable)
    .set({ status: "converted_to_quote", updatedAt: new Date() })
    .where(eq(representationQuoteRequestsTable.id, requestId));

  const accept = await post(
    `/api/representation-quote-requests/${requestId}/proposals/${proposal.id}/accept`,
    {},
    clientToken,
    `parent-guard-${Date.now()}-${Math.random()}`,
  );
  assert.equal(accept.status, 409, `transition must be blocked by parent state guard: ${JSON.stringify(accept)}`);
  assert.equal(
    accept.body?.error,
    "request_already_converted",
    "converted parent request must report request_already_converted",
  );

  const persisted = await db.query.lawyerProposalsTable.findFirst({ where: eq(lawyerProposalsTable.id, proposal.id) });
  assert.ok(persisted, "proposal must remain persisted after parent state rejection");
  assert.equal(persisted.status, "submitted", "blocked transition must not mutate proposal state");
}

// Scenario D: expiry vs withdrawal. Force the proposal to the expired side of the boundary,
// then race the lazy server expiry reconciliation (GET) against lawyer withdrawal.
{
  const requestId = await createRequest(clientToken);
  const proposal = await createProposal(requestId, lawyerToken);
  const expiredAt = new Date(Date.now() - 1_000);
  await db
    .update(lawyerProposalsTable)
    .set({ expiresAt: expiredAt, updatedAt: expiredAt })
    .where(and(eq(lawyerProposalsTable.id, proposal.id), eq(lawyerProposalsTable.status, "submitted")));

  const [read, withdraw] = await Promise.all([
    request(`/api/representation-quote-requests/${requestId}/proposals/${proposal.id}`, {
      headers: { authorization: `Bearer ${clientToken}` },
    }),
    post(`/api/representation-quote-requests/${requestId}/proposals/${proposal.id}/withdraw`, {}, lawyerToken, `withdraw-${Date.now()}-${Math.random()}`),
  ]);

  assert.ok([200, 409].includes(withdraw.status), `withdraw must be successful or conflict: ${JSON.stringify(withdraw)}`);
  const persisted = await db.query.lawyerProposalsTable.findFirst({ where: eq(lawyerProposalsTable.id, proposal.id) });
  assert.ok(persisted, "expired proposal must remain persisted");
  assert.equal(persisted.status, "expired", `expired proposal must end expired, got ${persisted.status}; read=${JSON.stringify(read)} withdraw=${JSON.stringify(withdraw)}`);
  assert.ok(read.status === 200 || read.status === 409, `expiry read must not fail unexpectedly: ${JSON.stringify(read)}`);
}

// Scenario E: duplicate submission with the same request + lawyer + idempotency key.
{
  const requestId = await createRequest(clientToken);
  const key = `s02-02-duplicate-submit-${Date.now()}-${Math.random()}`;
  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      post(`/api/representation-quote-requests/${requestId}/proposals`, { amount: "99.00", currency: "JOD" }, lawyerToken, key),
    ),
  );
  assert.ok(results.every((r) => r.status === 201), `duplicate submission must replay 201: ${JSON.stringify(results)}`);
  const ids = new Set(results.map((r) => r.body?.proposal?.id));
  assert.equal(ids.size, 1, `duplicate submission must persist one proposal, got ${ids.size}`);

  const persisted = await db.query.lawyerProposalsTable.findMany({ where: eq(lawyerProposalsTable.requestId, requestId) });
  assert.equal(persisted.length, 1, `duplicate submission must create exactly one proposal, got ${persisted.length}`);
}

await pool.end();
console.log("S02-02 LAWYER PROPOSAL CONCURRENCY TEST PASSED");
console.log("- concurrent accept × N: PASS");
console.log("- idempotent accept retry: PASS");
console.log("- accept vs reject race: PASS");
console.log("- parent request state guard: PASS");
console.log("- withdraw vs server expiry race: PASS");
console.log("- duplicate proposal submission: PASS");
