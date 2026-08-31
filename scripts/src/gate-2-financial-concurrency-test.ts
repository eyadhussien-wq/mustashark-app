import assert from "node:assert/strict";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import {
  db,
  pool,
  escrowAccountsTable,
  escrowTransactionsTable,
  lawyerWalletsTable,
  milestoneProofsTable,
  milestoneReleaseRequestsTable,
  representationMilestonesTable,
  representationQuotesTable,
  usersTable,
} from "@workspace/db";

const baseUrl = process.env.GATE_2_BASE_URL ?? "http://127.0.0.1:8081";
const clientEmail = process.env.GATE_2_CLIENT_EMAIL ?? "client@mustashark.com";
const clientPassword = process.env.GATE_2_CLIENT_PASSWORD ?? "test1234";
const lawyerEmail = process.env.GATE_2_LAWYER_EMAIL ?? "lawyer@mustashark.com";
const lawyerPassword = process.env.GATE_2_LAWYER_PASSWORD ?? "test1234";
const stressConcurrency = Number(process.env.GATE_2_STRESS_CONCURRENCY ?? "32");

type JsonBody = Record<string, unknown>;
type HttpResult = { status: number; body: JsonBody };

function asJsonBody(value: unknown): JsonBody {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonBody;
  }
  return { raw: String(value) };
}

async function post(path: string, body: unknown, token: string, key: string): Promise<HttpResult> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
  return { status: response.status, body: asJsonBody(parsed) };
}

async function login(email: string, password: string, role: "client" | "lawyer") {
  const response = await fetch(`${baseUrl}/api/auth/local-auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  const parsed: unknown = await response.json();
  const body = asJsonBody(parsed);
  assert.equal(response.status, 200, `login failed: ${JSON.stringify(body)}`);
  assert.equal(typeof body.jwt, "string", `login response missing jwt: ${JSON.stringify(body)}`);
  return body.jwt as string;
}

async function fixture(clientId: string, lawyerId: string, deposited: string) {
  const quoteId = crypto.randomUUID();
  const escrowId = crypto.randomUUID();
  const m1 = crypto.randomUUID();
  const m2 = crypto.randomUUID();
  const m3 = crypto.randomUUID();
  const now = new Date();

  await db.insert(representationQuotesTable).values({
    id: quoteId, clientId, lawyerId, title: "Gate 2 CI fixture", description: "ephemeral",
    totalAmount: "100.00", currency: "QAR", status: "funding", fundingMode: "per_stage", createdAt: now, updatedAt: now,
  });
  await db.insert(representationMilestonesTable).values([
    { id: m1, quoteId, stage: "stage_1", percentage: "50.00", amount: "50.00", title: "Stage 1", status: "funded", fundedAt: now, createdAt: now, updatedAt: now },
    { id: m2, quoteId, stage: "stage_2", percentage: "30.00", amount: "30.00", title: "Stage 2", status: "funded", fundedAt: now, createdAt: now, updatedAt: now },
    { id: m3, quoteId, stage: "stage_3", percentage: "20.00", amount: "20.00", title: "Stage 3", status: "funded", fundedAt: now, createdAt: now, updatedAt: now },
  ]);
  await db.insert(escrowAccountsTable).values({ id: escrowId, quoteId, currency: "QAR", depositedAmount: deposited, createdAt: now, updatedAt: now });
  await db.insert(escrowTransactionsTable).values({ id: crypto.randomUUID(), escrowAccountId: escrowId, milestoneId: null, type: "deposit", status: "posted", amount: deposited, currency: "QAR", reference: "gate2-fixture", createdBy: clientId, createdAt: now });
  return { quoteId, escrowId, m1, m2, m3 };
}

async function cleanup(f: Awaited<ReturnType<typeof fixture>>) {
  await db.delete(milestoneReleaseRequestsTable).where(eq(milestoneReleaseRequestsTable.milestoneId, f.m1));
  await db.delete(milestoneReleaseRequestsTable).where(eq(milestoneReleaseRequestsTable.milestoneId, f.m2));
  await db.delete(milestoneProofsTable).where(eq(milestoneProofsTable.milestoneId, f.m1));
  await db.delete(milestoneProofsTable).where(eq(milestoneProofsTable.milestoneId, f.m2));
  await db.delete(escrowTransactionsTable).where(eq(escrowTransactionsTable.escrowAccountId, f.escrowId));
  await db.delete(representationMilestonesTable).where(eq(representationMilestonesTable.quoteId, f.quoteId));
  await db.delete(escrowAccountsTable).where(eq(escrowAccountsTable.id, f.escrowId));
  await db.delete(representationQuotesTable).where(eq(representationQuotesTable.id, f.quoteId));
}

async function assertWalletUnchanged(lawyerId: string, before: string) {
  const [wallet] = await db.select({ availableBalance: lawyerWalletsTable.availableBalance })
    .from(lawyerWalletsTable)
    .where(eq(lawyerWalletsTable.lawyerId, lawyerId))
    .limit(1);
  assert(wallet, "lawyer wallet must exist");
  assert.equal(wallet.availableBalance, before, "losing settlement path must not mutate wallet");
}

const clientToken = await login(clientEmail, clientPassword, "client");
const lawyerToken = await login(lawyerEmail, lawyerPassword, "lawyer");
const [client] = await db.select().from(usersTable).where(eq(usersTable.email, clientEmail)).limit(1);
const [lawyer] = await db.select().from(usersTable).where(eq(usersTable.email, lawyerEmail)).limit(1);
assert(client && lawyer, "CI users must exist");

let fixtureA: Awaited<ReturnType<typeof fixture>> | undefined;
let fixtureB: Awaited<ReturnType<typeof fixture>> | undefined;
let fixtureC: Awaited<ReturnType<typeof fixture>> | undefined;
let fixtureD: Awaited<ReturnType<typeof fixture>> | undefined;

try {
  // 1. Guard A: two different milestones race for an escrow with only 60 available.
  fixtureA = await fixture(client.id, lawyer.id, "60.00");
  const allocationRace = await Promise.all([
    post(`/api/representation-milestones/${fixtureA.m1}/allocate`, {}, clientToken, `g2-a-${crypto.randomUUID()}`),
    post(`/api/representation-milestones/${fixtureA.m2}/allocate`, {}, clientToken, `g2-b-${crypto.randomUUID()}`),
  ]);
  const winners = allocationRace.filter((r) => r.status === 200).length;
  const blocked = allocationRace.filter((r) => r.status === 409 && r.body.error === "insufficient_unallocated_funds").length;
  assert.equal(winners, 1, `Guard A must permit exactly one allocation: ${JSON.stringify(allocationRace)}`);
  assert.equal(blocked, 1, `Guard A must block the over-capacity allocation: ${JSON.stringify(allocationRace)}`);
  console.log("- Guard A two-way capacity race: PASS");

  // 2. Guard A stress: many unique requests target the same milestone/escrow concurrently.
  fixtureB = await fixture(client.id, lawyer.id, "50.00");
  const stressResults = await Promise.all(
    Array.from({ length: stressConcurrency }, (_, i) =>
      post(`/api/representation-milestones/${fixtureB!.m1}/allocate`, {}, clientToken, `g2-stress-${i}-${crypto.randomUUID()}`),
    ),
  );
  const stressWinners = stressResults.filter((r) => r.status === 200).length;
  assert.equal(stressWinners, 1, `high-concurrency allocation must have exactly one winner: ${JSON.stringify(stressResults)}`);
  assert.equal(stressResults.length - stressWinners, stressConcurrency - 1);
  console.log(`- Guard A ${stressConcurrency}-way same-milestone stress: PASS`);

  // 3. Guard B: stage 1 allocation cannot fund stage 2 settlement.
  await db.update(escrowAccountsTable).set({ allocatedAmount: "50.00" }).where(eq(escrowAccountsTable.id, fixtureB.escrowId));
  await db.insert(escrowTransactionsTable).values({ id: crypto.randomUUID(), escrowAccountId: fixtureB.escrowId, milestoneId: fixtureB.m1, type: "stage_allocation", status: "posted", amount: "50.00", currency: "QAR", reference: "gate2-stage1", createdBy: client.id, createdAt: new Date() });
  await db.update(representationMilestonesTable).set({ status: "under_review" }).where(eq(representationMilestonesTable.id, fixtureB.m2));
  const proofId = crypto.randomUUID();
  const requestId = crypto.randomUUID();
  await db.insert(milestoneProofsTable).values({ id: proofId, milestoneId: fixtureB.m2, lawyerId: lawyer.id, documentKey: `gate2/${proofId}`, status: "submitted", submittedAt: new Date() });
  await db.insert(milestoneReleaseRequestsTable).values({ id: requestId, milestoneId: fixtureB.m2, proofId, clientId: client.id, lawyerId: lawyer.id, status: "approved", reviewDeadlineAt: new Date(Date.now() + 3600000), decidedAt: new Date(), createdAt: new Date(), updatedAt: new Date() });
  const crossStage = await post(`/api/representation-release-requests/${requestId}/release`, {}, clientToken, `g2-cross-${crypto.randomUUID()}`);
  assert.equal(crossStage.status, 409, `Guard B must reject cross-stage release: ${JSON.stringify(crossStage)}`);
  console.log("- Guard B cross-stage causal conservation: PASS");

  // 4. Release vs refund race: exactly one settlement may win.
  fixtureC = await fixture(client.id, lawyer.id, "50.00");
  await db.update(escrowAccountsTable).set({ allocatedAmount: "50.00" }).where(eq(escrowAccountsTable.id, fixtureC.escrowId));
  await db.insert(escrowTransactionsTable).values({ id: crypto.randomUUID(), escrowAccountId: fixtureC.escrowId, milestoneId: fixtureC.m1, type: "stage_allocation", status: "posted", amount: "50.00", currency: "QAR", reference: "gate2-stage1", createdBy: client.id, createdAt: new Date() });
  await db.update(representationMilestonesTable).set({ status: "under_review" }).where(eq(representationMilestonesTable.id, fixtureC.m1));
  const proofC = crypto.randomUUID();
  const requestC = crypto.randomUUID();
  await db.insert(milestoneProofsTable).values({ id: proofC, milestoneId: fixtureC.m1, lawyerId: lawyer.id, documentKey: `gate2/${proofC}`, status: "submitted", submittedAt: new Date() });
  await db.insert(milestoneReleaseRequestsTable).values({ id: requestC, milestoneId: fixtureC.m1, proofId: proofC, clientId: client.id, lawyerId: lawyer.id, status: "approved", reviewDeadlineAt: new Date(Date.now() + 3600000), decidedAt: new Date(), createdAt: new Date(), updatedAt: new Date() });
  const [walletBefore] = await db.select({ availableBalance: lawyerWalletsTable.availableBalance }).from(lawyerWalletsTable).where(eq(lawyerWalletsTable.lawyerId, lawyer.id)).limit(1);
  assert(walletBefore, "lawyer wallet must exist");
  const settlementRace = await Promise.all([
    post(`/api/representation-release-requests/${requestC}/release`, {}, clientToken, `g2-release-${crypto.randomUUID()}`),
    post(`/api/representation-milestones/${fixtureC.m1}/refund`, {}, clientToken, `g2-refund-${crypto.randomUUID()}`),
  ]);
  assert.equal(settlementRace.filter((r) => r.status === 200).length, 1, `release/refund race must have one winner: ${JSON.stringify(settlementRace)}`);
  assert.equal(settlementRace.filter((r) => r.status === 409).length, 1, `release/refund race must have one loser: ${JSON.stringify(settlementRace)}`);
  await assertWalletUnchanged(lawyer.id, walletBefore.availableBalance);
  console.log("- Release ↔ Refund single-settlement race + wallet isolation: PASS");

  // 5. Dispute vs release race: the dispute must either win before release or lose cleanly;
  //    it must never produce a second financial settlement.
  fixtureD = await fixture(client.id, lawyer.id, "50.00");
  await db.update(escrowAccountsTable).set({ allocatedAmount: "50.00" }).where(eq(escrowAccountsTable.id, fixtureD.escrowId));
  await db.insert(escrowTransactionsTable).values({ id: crypto.randomUUID(), escrowAccountId: fixtureD.escrowId, milestoneId: fixtureD.m1, type: "stage_allocation", status: "posted", amount: "50.00", currency: "QAR", reference: "gate2-stage1", createdBy: client.id, createdAt: new Date() });
  await db.update(representationMilestonesTable).set({ status: "under_review" }).where(eq(representationMilestonesTable.id, fixtureD.m1));
  const proofD = crypto.randomUUID();
  const requestD = crypto.randomUUID();
  await db.insert(milestoneProofsTable).values({ id: proofD, milestoneId: fixtureD.m1, lawyerId: lawyer.id, documentKey: `gate2/${proofD}`, status: "submitted", submittedAt: new Date() });
  await db.insert(milestoneReleaseRequestsTable).values({ id: requestD, milestoneId: fixtureD.m1, proofId: proofD, clientId: client.id, lawyerId: lawyer.id, status: "pending", reviewDeadlineAt: new Date(Date.now() + 3600000), createdAt: new Date(), updatedAt: new Date() });
  const disputeRace = await Promise.all([
    post(`/api/representation-release-requests/${requestD}/dispute`, { disputeReason: "gate2 concurrency dispute" }, clientToken, `g2-dispute-${crypto.randomUUID()}`),
    post(`/api/representation-release-requests/${requestD}/release`, {}, clientToken, `g2-release-dispute-${crypto.randomUUID()}`),
  ]);
  const disputeSettlements = disputeRace.filter((r) => r.status === 200).length;
  const disputeConflicts = disputeRace.filter((r) => r.status === 409).length;
  assert(disputeSettlements <= 1, `dispute/release race cannot produce multiple winners: ${JSON.stringify(disputeRace)}`);
  assert.equal(disputeSettlements + disputeConflicts, 2, `dispute/release race must resolve both requests: ${JSON.stringify(disputeRace)}`);
  const [finalRequest] = await db.select({ status: milestoneReleaseRequestsTable.status }).from(milestoneReleaseRequestsTable).where(eq(milestoneReleaseRequestsTable.id, requestD)).limit(1);
  assert(finalRequest, "final release request must exist");
  assert.notEqual(finalRequest.status, "released", `dispute winner must prevent release transition: ${JSON.stringify(disputeRace)}`);
  console.log("- Dispute ↔ Release race: PASS");

  // 6. Idempotency replay: the same financial request must not create a second outcome.
  const idemKey = `g2-idem-${crypto.randomUUID()}`;
  const first = await post(`/api/representation-milestones/${fixtureD.m3}/allocate`, {}, clientToken, idemKey);
  const replay = await post(`/api/representation-milestones/${fixtureD.m3}/allocate`, {}, clientToken, idemKey);
  assert.equal(replay.status, first.status, `idempotency replay status must match first response: ${JSON.stringify({ first, replay })}`);
  assert.deepEqual(replay.body, first.body, `idempotency replay body must match first response: ${JSON.stringify({ first, replay })}`);
  console.log("- Idempotency replay stability: PASS");

  // 7. Database rollback sanity: a forced exception must leave the transactional fixture absent.
  const rollbackQuoteId = crypto.randomUUID();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(representationQuotesTable).values({
        id: rollbackQuoteId, clientId: client.id, lawyerId: lawyer.id, title: "Gate 2 rollback fixture", description: "ephemeral",
        totalAmount: "1.00", currency: "QAR", status: "funding", fundingMode: "per_stage", createdAt: new Date(), updatedAt: new Date(),
      });
      throw new Error("GATE2_FORCED_ROLLBACK");
    });
    assert.fail("forced rollback transaction unexpectedly committed");
  } catch (error) {
    assert(error instanceof Error && error.message === "GATE2_FORCED_ROLLBACK", `unexpected rollback error: ${String(error)}`);
  }
  const rollbackRows = await db.select({ id: representationQuotesTable.id }).from(representationQuotesTable).where(eq(representationQuotesTable.id, rollbackQuoteId)).limit(1);
  assert.equal(rollbackRows.length, 0, "rolled-back fixture must not remain in database");
  console.log("- Transaction rollback integrity: PASS");

  console.log("GATE #2 FINANCIAL INTEGRATION & CONCURRENCY TEST PASSED");
} finally {
  if (fixtureA) await cleanup(fixtureA);
  if (fixtureB) await cleanup(fixtureB);
  if (fixtureC) await cleanup(fixtureC);
  if (fixtureD) await cleanup(fixtureD);
  await pool.end();
}
