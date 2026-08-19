import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import {
  db,
  escrowAccountsTable,
  lawyerProposalsTable,
  pool,
  representationMilestonesTable,
  representationQuoteRequestsTable,
  representationQuotesTable,
} from "@workspace/db";

const baseUrl = process.env.S02_03_BASE_URL ?? "http://127.0.0.1:8081";
const clientEmail = process.env.S02_03_CLIENT_EMAIL ?? "client@mustashark.com";
const clientPassword = process.env.S02_03_CLIENT_PASSWORD ?? "test1234";
const lawyerEmail = process.env.S02_03_LAWYER_EMAIL ?? "lawyer@mustashark.com";
const lawyerPassword = process.env.S02_03_LAWYER_PASSWORD ?? "test1234";

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

async function createRequest(clientToken: string) {
  const key = `s02-03-request-${Date.now()}-${Math.random()}`;
  const result = await post(
    "/api/representation/quote-requests",
    { title: `S02.3 concurrency ${Date.now()}`, description: "Accept/pay orchestration fixture" },
    clientToken,
    key,
  );
  assertOk(result.status === 201, `request creation failed: ${JSON.stringify(result.body)}`);
  assertOk(typeof result.body?.request?.id === "string", "request id missing");
  return result.body.request.id as string;
}

async function createProposal(requestId: string, lawyerToken: string, amount = "125.50") {
  const key = `s02-03-proposal-${Date.now()}-${Math.random()}`;
  const result = await post(
    `/api/representation-quote-requests/${requestId}/proposals`,
    { amount, currency: "QAR" },
    lawyerToken,
    key,
  );
  assertOk(result.status === 201, `proposal creation failed: ${JSON.stringify(result.body)}`);
  assertOk(typeof result.body?.proposal?.id === "string", "proposal id missing");
  return result.body.proposal as { id: string; status: string };
}

const clientToken = await login(clientEmail, clientPassword, "client");
const lawyerToken = await login(lawyerEmail, lawyerPassword, "lawyer");

// Scenario A: same idempotency key under concurrency must produce one financial initialization
// and replay the exact successful result to every caller.
{
  const requestId = await createRequest(clientToken);
  const proposal = await createProposal(requestId, lawyerToken, "125.50");
  const key = `s02-03-accept-replay-${Date.now()}-${Math.random()}`;

  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      post(`/api/representation-quote-requests/${requestId}/proposals/${proposal.id}/accept`, {}, clientToken, key),
    ),
  );

  assert.ok(results.every((result) => result.status === 200), `all idempotent accepts must replay 200: ${JSON.stringify(results)}`);
  const quoteIds = new Set(results.map((result) => result.body?.quote?.id));
  assert.equal(quoteIds.size, 1, "idempotent accept must create exactly one quote id");
  assert.ok(results.every((result) => result.body?.quote?.status === "funding"), "quote must remain in funding state");

  const [request] = await db
    .select()
    .from(representationQuoteRequestsTable)
    .where(eq(representationQuoteRequestsTable.id, requestId));
  assert.equal(request?.status, "converted_to_quote", "request must convert exactly once");
  assert.ok(request?.quoteId, "converted request must reference its quote");

  const quotes = await db
    .select()
    .from(representationQuotesTable)
    .where(eq(representationQuotesTable.id, request?.quoteId ?? ""));
  assert.equal(quotes.length, 1, "exactly one representation quote must exist");

  const milestones = await db
    .select()
    .from(representationMilestonesTable)
    .where(eq(representationMilestonesTable.quoteId, request?.quoteId ?? ""));
  assert.equal(milestones.length, 3, "exactly three milestones must be created");
  assert.equal(milestones.reduce((sum, milestone) => sum + Number(milestone.amount), 0), 125.5, "milestones must reconcile to quote total");

  const escrows = await db
    .select()
    .from(escrowAccountsTable)
    .where(eq(escrowAccountsTable.quoteId, request?.quoteId ?? ""));
  assert.equal(escrows.length, 1, "exactly one escrow account must exist");
}

// Scenario B: distinct idempotency keys must still allow only one proposal acceptance
// because the parent request is serialized and converted atomically.
{
  const requestId = await createRequest(clientToken);
  const proposal = await createProposal(requestId, lawyerToken, "200.00");
  const results = await Promise.all([
    post(`/api/representation-quote-requests/${requestId}/proposals/${proposal.id}/accept`, {}, clientToken, `accept-a-${Date.now()}-${Math.random()}`),
    post(`/api/representation-quote-requests/${requestId}/proposals/${proposal.id}/accept`, {}, clientToken, `accept-b-${Date.now()}-${Math.random()}`),
  ]);

  const statuses = results.map((result) => result.status).sort((a, b) => a - b);
  assert.deepEqual(statuses, [200, 409], `distinct-key acceptance race must yield one winner: ${JSON.stringify(results)}`);

  const [request] = await db
    .select()
    .from(representationQuoteRequestsTable)
    .where(eq(representationQuoteRequestsTable.id, requestId));
  assert.equal(request?.status, "converted_to_quote", "winning accept must convert the request");

  const quotes = await db
    .select()
    .from(representationQuotesTable)
    .where(eq(representationQuotesTable.clientId, request?.clientId ?? ""));
  assert.ok(quotes.some((quote) => quote.id === request?.quoteId), "winning quote must be linked to the request");
}

// Scenario C: once a request is converted, a different submitted proposal cannot be accepted.
{
  const requestId = await createRequest(clientToken);
  const first = await createProposal(requestId, lawyerToken, "150.00");
  const second = await createProposal(requestId, lawyerToken, "175.00");

  const firstAccept = await post(
    `/api/representation-quote-requests/${requestId}/proposals/${first.id}/accept`,
    {},
    clientToken,
    `first-${Date.now()}-${Math.random()}`,
  );
  assert.equal(firstAccept.status, 200, `first proposal must be accepted: ${JSON.stringify(firstAccept)}`);

  const secondAccept = await post(
    `/api/representation-quote-requests/${requestId}/proposals/${second.id}/accept`,
    {},
    clientToken,
    `second-${Date.now()}-${Math.random()}`,
  );
  assert.equal(secondAccept.status, 409, `second proposal must be blocked after conversion: ${JSON.stringify(secondAccept)}`);
  assert.equal(secondAccept.body?.error, "request_already_converted", "converted request must be terminal for S02.3");

  const secondPersisted = await db
    .select({ status: lawyerProposalsTable.status })
    .from(lawyerProposalsTable)
    .where(and(
      eq(lawyerProposalsTable.id, second.id),
      eq(lawyerProposalsTable.requestId, requestId),
    ));
  assert.equal(secondPersisted[0]?.status, "submitted", "blocked proposal must remain submitted");
}

await pool.end();
console.log("S02-03 ACCEPT & PAY CONCURRENCY TEST PASSED");
console.log("- concurrent same-key accept/replay: PASS");
console.log("- distinct-key accept race: PASS");
console.log("- one financial quote + one escrow account: PASS");
console.log("- exact 3-milestone financial invariant: PASS");
console.log("- converted parent blocks second proposal: PASS");
