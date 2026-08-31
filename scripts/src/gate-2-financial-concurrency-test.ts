import assert from "node:assert/strict";
import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
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
  commissionTiersTable,
} from "@workspace/db";

const baseUrl = process.env.GATE_2_BASE_URL ?? "http://127.0.0.1:8081";
const clientEmail = process.env.GATE_2_CLIENT_EMAIL ?? "client@mustashark.com";
const clientPassword = process.env.GATE_2_CLIENT_PASSWORD ?? "test1234";
const lawyerEmail = process.env.GATE_2_LAWYER_EMAIL ?? "lawyer@mustashark.com";
const lawyerPassword = process.env.GATE_2_LAWYER_PASSWORD ?? "test1234";

async function post(path: string, body: unknown, token: string, key: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: any;
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
  return { status: response.status, body: parsed };
}

async function login(email: string, password: string, role: "client" | "lawyer") {
  const response = await fetch(`${baseUrl}/api/auth/local-auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  const body = await response.json();
  assert.equal(response.status, 200, `login failed: ${JSON.stringify(body)}`);
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
  await db.delete(milestoneProofsTable).where(eq(milestoneProofsTable.milestoneId, f.m1));
  await db.delete(escrowTransactionsTable).where(eq(escrowTransactionsTable.escrowAccountId, f.escrowId));
  await db.delete(representationMilestonesTable).where(eq(representationMilestonesTable.quoteId, f.quoteId));
  await db.delete(escrowAccountsTable).where(eq(escrowAccountsTable.id, f.escrowId));
  await db.delete(representationQuotesTable).where(eq(representationQuotesTable.id, f.quoteId));
}

const clientToken = await login(clientEmail, clientPassword, "client");
const lawyerToken = await login(lawyerEmail, lawyerPassword, "lawyer");
const [client] = await db.select().from(usersTable).where(eq(usersTable.email, clientEmail)).limit(1);
const [lawyer] = await db.select().from(usersTable).where(eq(usersTable.email, lawyerEmail)).limit(1);
assert(client && lawyer, "CI users must exist");

let fixtureA: Awaited<ReturnType<typeof fixture>> | undefined;
let fixtureB: Awaited<ReturnType<typeof fixture>> | undefined;
let fixtureC: Awaited<ReturnType<typeof fixture>> | undefined;

try {
  // Guard A: two different milestones race for an escrow with only 60 available.
  fixtureA = await fixture(client.id, lawyer.id, "60.00");
  const allocationRace = await Promise.all([
    post(`/api/representation-milestones/${fixtureA.m1}/allocate`, {}, clientToken, `g2-a-${crypto.randomUUID()}`),
    post(`/api/representation-milestones/${fixtureA.m2}/allocate`, {}, clientToken, `g2-b-${crypto.randomUUID()}`),
  ]);
  const winners = allocationRace.filter((r) => r.status === 200).length;
  const blocked = allocationRace.filter((r) => r.status === 409 && r.body?.error === "insufficient_unallocated_funds").length;
  assert.equal(winners, 1, `Guard A must permit exactly one allocation: ${JSON.stringify(allocationRace)}`);
  assert.equal(blocked, 1, `Guard A must block the over-capacity allocation: ${JSON.stringify(allocationRace)}`);

  // Guard B: stage 1 allocation cannot fund stage 2 settlement.
  fixtureB = await fixture(client.id, lawyer.id, "100.00");
  await db.update(escrowAccountsTable).set({ allocatedAmount: "50.00" }).where(eq(escrowAccountsTable.id, fixtureB.escrowId));
  await db.insert(escrowTransactionsTable).values({ id: crypto.randomUUID(), escrowAccountId: fixtureB.escrowId, milestoneId: fixtureB.m1, type: "stage_allocation", status: "posted", amount: "50.00", currency: "QAR", reference: "gate2-stage1", createdBy: client.id, createdAt: new Date() });
  await db.update(representationMilestonesTable).set({ status: "under_review" }).where(eq(representationMilestonesTable.id, fixtureB.m2));
  const proofId = crypto.randomUUID();
  const requestId = crypto.randomUUID();
  await db.insert(milestoneProofsTable).values({ id: proofId, milestoneId: fixtureB.m2, lawyerId: lawyer.id, documentKey: `gate2/${proofId}`, status: "submitted", submittedAt: new Date() });
  await db.insert(milestoneReleaseRequestsTable).values({ id: requestId, milestoneId: fixtureB.m2, proofId, clientId: client.id, lawyerId: lawyer.id, status: "approved", reviewDeadlineAt: new Date(Date.now() + 3600000), decidedAt: new Date(), createdAt: new Date(), updatedAt: new Date() });
  const crossStage = await post(`/api/representation-release-requests/${requestId}/release`, {}, clientToken, `g2-cross-${crypto.randomUUID()}`);
  assert.equal(crossStage.status, 409, `Guard B must reject cross-stage release: ${JSON.stringify(crossStage)}`);

  // Release vs refund race on one allocated milestone: exactly one settlement may win.
  fixtureC = await fixture(client.id, lawyer.id, "50.00");
  await db.update(escrowAccountsTable).set({ allocatedAmount: "50.00" }).where(eq(escrowAccountsTable.id, fixtureC.escrowId));
  await db.insert(escrowTransactionsTable).values({ id: crypto.randomUUID(), escrowAccountId: fixtureC.escrowId, milestoneId: fixtureC.m1, type: "stage_allocation", status: "posted", amount: "50.00", currency: "QAR", reference: "gate2-stage1", createdBy: client.id, createdAt: new Date() });
  await db.update(representationMilestonesTable).set({ status: "under_review" }).where(eq(representationMilestonesTable.id, fixtureC.m1));
  const proofC = crypto.randomUUID();
  const requestC = crypto.randomUUID();
  await db.insert(milestoneProofsTable).values({ id: proofC, milestoneId: fixtureC.m1, lawyerId: lawyer.id, documentKey: `gate2/${proofC}`, status: "submitted", submittedAt: new Date() });
  await db.insert(milestoneReleaseRequestsTable).values({ id: requestC, milestoneId: fixtureC.m1, proofId: proofC, clientId: client.id, lawyerId: lawyer.id, status: "approved", reviewDeadlineAt: new Date(Date.now() + 3600000), decidedAt: new Date(), createdAt: new Date(), updatedAt: new Date() });
  const race = await Promise.all([
    post(`/api/representation-release-requests/${requestC}/release`, {}, clientToken, `g2-release-${crypto.randomUUID()}`),
    post(`/api/representation-milestones/${fixtureC.m1}/refund`, {}, clientToken, `g2-refund-${crypto.randomUUID()}`),
  ]);
  assert.equal(race.filter((r) => r.status === 200).length, 1, `release/refund race must have one winner: ${JSON.stringify(race)}`);
  assert.equal(race.filter((r) => r.status === 409).length, 1, `release/refund race must have one loser: ${JSON.stringify(race)}`);

  console.log("GATE #2 FINANCIAL INTEGRATION & CONCURRENCY TEST PASSED");
  console.log("- Guard A escrow capacity race: PASS");
  console.log("- Guard B cross-stage causal conservation: PASS");
  console.log("- Release ↔ Refund single-settlement race: PASS");
} finally {
  if (fixtureA) await cleanup(fixtureA);
  if (fixtureB) await cleanup(fixtureB);
  if (fixtureC) await cleanup(fixtureC);
  await pool.end();
}
