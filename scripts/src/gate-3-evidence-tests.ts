import assert from "node:assert/strict";
import crypto, { randomBytes, scryptSync } from "node:crypto";
import { eq } from "drizzle-orm";
import {
  db,
  pool,
  adminAuditLogsTable,
  escrowAccountsTable,
  escrowTransactionsTable,
  lawyerVerificationsTable,
  lawyerWalletTransactionsTable,
  lawyerWalletsTable,
  milestoneProofsTable,
  milestoneReleaseRequestsTable,
  representationMilestonesTable,
  representationQuotesTable,
  usersTable,
} from "@workspace/db";

type JsonBody = Record<string, unknown>;
type HttpResult = { status: number; body: JsonBody };

const baseUrl = process.env.GATE_3_BASE_URL ?? "http://127.0.0.1:8081";
const adminEmail = "admin@mustashark.com";
const fixturePassword = "Gate3Fixture!2026";

function body(value: unknown): JsonBody {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonBody : { raw: String(value) };
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function request(path: string, method: "GET" | "POST" | "PATCH", token: string, payload?: unknown, key?: string): Promise<HttpResult> {
  const headers: Record<string, string> = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  if (key) headers["Idempotency-Key"] = key;
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: payload === undefined ? undefined : JSON.stringify(payload) });
  const text = await response.text();
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
  return { status: response.status, body: body(parsed) };
}

async function localLogin(email: string, password: string, role: "client" | "lawyer") {
  const response = await fetch(`${baseUrl}/api/auth/local-auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  const result = body(await response.json());
  assert.equal(response.status, 200, `local login failed for ${email}: ${JSON.stringify(result)}`);
  assert.equal(result.authProvider, "local", `local auth provenance missing for ${email}`);
  assert.equal(typeof result.jwt, "string", `JWT missing for ${email}`);
  return result.jwt as string;
}

async function adminLogin() {
  const response = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: "test1234" }),
  });
  const result = body(await response.json());
  assert.equal(response.status, 200, `canonical admin login failed: ${JSON.stringify(result)}`);
  assert.equal(result.user?.email, adminEmail);
  assert.equal(result.user?.role, "admin");
  assert.equal(typeof result.token, "string");
  return result.token as string;
}

async function provisionFixtureIdentities() {
  const clientId = `gate3-client-${crypto.randomUUID()}`;
  const lawyerId = `gate3-lawyer-${crypto.randomUUID()}`;
  const now = new Date();
  await db.insert(usersTable).values([
    { id: clientId, name: "Gate 3 Client Fixture", email: `${clientId}@mustashark.test`, passwordHash: hashPassword(fixturePassword), role: "client", country: "qatar", authProvider: "local", accountStatus: "active", createdAt: now, updatedAt: now },
    { id: lawyerId, name: "Gate 3 Lawyer Fixture", email: `${lawyerId}@mustashark.test`, passwordHash: hashPassword(fixturePassword), role: "lawyer", country: "qatar", authProvider: "local", accountStatus: "pending", createdAt: now, updatedAt: now },
  ]);
  return { clientId, lawyerId, clientEmail: `${clientId}@mustashark.test`, lawyerEmail: `${lawyerId}@mustashark.test` };
}

async function provisionLawyerThroughAdminLifecycle(lawyerId: string, adminToken: string) {
  const verificationId = `gate3-verification-${crypto.randomUUID()}`;
  const now = new Date();
  await db.insert(lawyerVerificationsTable).values({
    id: verificationId,
    userId: lawyerId,
    licenseNumber: `G3-${verificationId.slice(-8)}`,
    barAssociation: "Gate 3 Evidence Fixture",
    documentStorageKey: `gate3/verification/${verificationId}`,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  const pending = await request(`/api/admin/lawyer-verifications/pending`, "GET", adminToken);
  assert.equal(pending.status, 200, `pending verification list failed: ${JSON.stringify(pending)}`);
  const reviewed = await request(`/api/admin/lawyer-verifications/${verificationId}/review`, "PATCH", adminToken, { status: "approved" });
  assert.equal(reviewed.status, 200, `admin approval failed: ${JSON.stringify(reviewed)}`);
  const [verification] = await db.select({ status: lawyerVerificationsTable.status, reviewedBy: lawyerVerificationsTable.reviewedBy }).from(lawyerVerificationsTable).where(eq(lawyerVerificationsTable.id, verificationId)).limit(1);
  const [lawyer] = await db.select({ accountStatus: usersTable.accountStatus }).from(usersTable).where(eq(usersTable.id, lawyerId)).limit(1);
  assert.equal(verification?.status, "approved");
  assert.equal(lawyer?.accountStatus, "active");
  return verificationId;
}

async function provisionWallet(lawyerId: string) {
  const walletId = `gate3-wallet-${crypto.randomUUID()}`;
  await db.insert(lawyerWalletsTable).values({ id: walletId, lawyerId, currency: "QAR", availableBalance: "0.00", pendingBalance: "0.00", createdAt: new Date(), updatedAt: new Date() });
  return walletId;
}

async function makeSettlementFixture(clientId: string, lawyerId: string, requestStatus: "approved" | "pending") {
  const quoteId = crypto.randomUUID();
  const escrowId = crypto.randomUUID();
  const milestoneId = crypto.randomUUID();
  const proofId = crypto.randomUUID();
  const requestId = crypto.randomUUID();
  const now = new Date();
  await db.insert(representationQuotesTable).values({ id: quoteId, clientId, lawyerId, title: "Gate 3 evidence fixture", description: "ephemeral", totalAmount: "50.00", currency: "QAR", status: "funding", fundingMode: "per_stage", createdAt: now, updatedAt: now });
  await db.insert(representationMilestonesTable).values({ id: milestoneId, quoteId, stage: "stage_1", percentage: "100.00", amount: "50.00", title: "Gate 3 Stage", status: "under_review", createdAt: now, updatedAt: now });
  await db.insert(escrowAccountsTable).values({ id: escrowId, quoteId, currency: "QAR", depositedAmount: "50.00", allocatedAmount: "50.00", createdAt: now, updatedAt: now });
  await db.insert(escrowTransactionsTable).values([
    { id: crypto.randomUUID(), escrowAccountId: escrowId, milestoneId, type: "deposit", status: "posted", amount: "50.00", currency: "QAR", reference: "gate3-deposit", createdBy: clientId, createdAt: now },
    { id: crypto.randomUUID(), escrowAccountId: escrowId, milestoneId, type: "stage_allocation", status: "posted", amount: "50.00", currency: "QAR", reference: "gate3-allocation", createdBy: clientId, createdAt: now },
  ]);
  await db.insert(milestoneProofsTable).values({ id: proofId, milestoneId, lawyerId, documentKey: `gate3/${proofId}`, status: "submitted", submittedAt: now });
  await db.insert(milestoneReleaseRequestsTable).values({ id: requestId, milestoneId, proofId, clientId, lawyerId, status: requestStatus, reviewDeadlineAt: new Date(Date.now() + 3600000), decidedAt: requestStatus === "approved" ? now : null, createdAt: now, updatedAt: now });
  return { quoteId, escrowId, milestoneId, proofId, requestId };
}

async function cleanupSettlement(f: Awaited<ReturnType<typeof makeSettlementFixture>>) {
  await db.delete(milestoneReleaseRequestsTable).where(eq(milestoneReleaseRequestsTable.id, f.requestId));
  await db.delete(milestoneProofsTable).where(eq(milestoneProofsTable.id, f.proofId));
  await db.delete(escrowTransactionsTable).where(eq(escrowTransactionsTable.escrowAccountId, f.escrowId));
  await db.delete(representationMilestonesTable).where(eq(representationMilestonesTable.id, f.milestoneId));
  await db.delete(escrowAccountsTable).where(eq(escrowAccountsTable.id, f.escrowId));
  await db.delete(representationQuotesTable).where(eq(representationQuotesTable.id, f.quoteId));
}

const adminToken = await adminLogin();
const [admin] = await db.select({ id: usersTable.id, role: usersTable.role, accountStatus: usersTable.accountStatus }).from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
assert(admin, "canonical admin must exist");
assert.equal(admin.role, "admin");
assert.equal(admin.accountStatus, "active");

const identities = await provisionFixtureIdentities();
const verificationId = await provisionLawyerThroughAdminLifecycle(identities.lawyerId, adminToken);
const walletId = await provisionWallet(identities.lawyerId);
const clientToken = await localLogin(identities.clientEmail, fixturePassword, "client");
const lawyerToken = await localLogin(identities.lawyerEmail, fixturePassword, "lawyer");
void lawyerToken;
console.log(`AUTH LIFECYCLE PASS | lawyer=pending→approved→active | wallet=${walletId}`);

console.log("=== G3-D Dispute Controls ===");
const disputeFixture = await makeSettlementFixture(identities.clientId, identities.lawyerId, "pending");
try {
  const [dispute, duplicate] = await Promise.all([
    request(`/api/representation-release-requests/${disputeFixture.requestId}/dispute`, "POST", clientToken, { disputeReason: "Gate 3 evidence dispute" }, `g3-dispute-${crypto.randomUUID()}`),
    request(`/api/representation-release-requests/${disputeFixture.requestId}/dispute`, "POST", clientToken, { disputeReason: "Gate 3 evidence dispute" }, `g3-dispute-race-${crypto.randomUUID()}`),
  ]);
  assert.equal(dispute.status, 200, `dispute must transition pending request: ${JSON.stringify(dispute)}`);
  assert.equal(duplicate.status, 409, `concurrent second dispute must conflict: ${JSON.stringify(duplicate)}`);
  const [requestRow] = await db.select({ status: milestoneReleaseRequestsTable.status }).from(milestoneReleaseRequestsTable).where(eq(milestoneReleaseRequestsTable.id, disputeFixture.requestId)).limit(1);
  const [proofRow] = await db.select({ status: milestoneProofsTable.status }).from(milestoneProofsTable).where(eq(milestoneProofsTable.id, disputeFixture.proofId)).limit(1);
  const [milestoneRow] = await db.select({ status: representationMilestonesTable.status }).from(representationMilestonesTable).where(eq(representationMilestonesTable.id, disputeFixture.milestoneId)).limit(1);
  assert.equal(requestRow?.status, "disputed");
  assert.equal(proofRow?.status, "disputed");
  assert.equal(milestoneRow?.status, "disputed");
  console.log(`G3-D PASS | winner=200 | duplicate=${duplicate.status} | request=${requestRow?.status} | proof=${proofRow?.status} | milestone=${milestoneRow?.status}`);
} finally {
  await cleanupSettlement(disputeFixture);
}

console.log("=== G3-E Release / Refund Boundary ===");
const settlementFixture = await makeSettlementFixture(identities.clientId, identities.lawyerId, "approved");
try {
  const [walletBefore] = await db.select({ id: lawyerWalletsTable.id, availableBalance: lawyerWalletsTable.availableBalance }).from(lawyerWalletsTable).where(eq(lawyerWalletsTable.id, walletId)).limit(1);
  assert(walletBefore, "approved lawyer wallet must exist before G3-E settlement race");
  const [release, refund] = await Promise.all([
    request(`/api/representation-release-requests/${settlementFixture.requestId}/release`, "POST", clientToken, {}, `g3-release-${crypto.randomUUID()}`),
    request(`/api/representation-milestones/${settlementFixture.milestoneId}/refund`, "POST", clientToken, {}, `g3-refund-${crypto.randomUUID()}`),
  ]);
  const winners = [release, refund].filter((r) => r.status === 200).length;
  const conflicts = [release, refund].filter((r) => r.status === 409).length;
  assert.equal(winners, 1, `release/refund boundary must have exactly one winner: ${JSON.stringify({ release, refund })}`);
  assert.equal(conflicts, 1, `release/refund boundary must have exactly one conflict loser: ${JSON.stringify({ release, refund })}`);
  const [finalMilestone] = await db.select({ status: representationMilestonesTable.status }).from(representationMilestonesTable).where(eq(representationMilestonesTable.id, settlementFixture.milestoneId)).limit(1);
  const [finalEscrow] = await db.select({ releasedAmount: escrowAccountsTable.releasedAmount, refundedAmount: escrowAccountsTable.refundedAmount }).from(escrowAccountsTable).where(eq(escrowAccountsTable.id, settlementFixture.escrowId)).limit(1);
  assert(finalMilestone && finalEscrow, "settlement state must remain observable");
  assert.ok(["released", "cancelled"].includes(finalMilestone.status));
  assert.equal(Number(finalEscrow.releasedAmount) + Number(finalEscrow.refundedAmount), 50, "escrow settlement must conserve the milestone amount");
  const [walletAfter] = await db.select({ availableBalance: lawyerWalletsTable.availableBalance }).from(lawyerWalletsTable).where(eq(lawyerWalletsTable.id, walletBefore.id)).limit(1);
  assert(walletAfter, "lawyer wallet must remain present");
  if (refund.status === 200) assert.equal(walletAfter.availableBalance, walletBefore.availableBalance, "refund winner must not mutate lawyer wallet");
  console.log(`G3-E PASS | release=${release.status} refund=${refund.status} | milestone=${finalMilestone.status} | escrow_settled=50.00`);
} finally {
  await cleanupSettlement(settlementFixture);
}

console.log("=== G3-G Administrative Monitoring & Intervention ===");
const overview = await request("/api/admin/overview", "GET", adminToken);
assert.equal(overview.status, 200, `admin overview must be accessible: ${JSON.stringify(overview)}`);
const lawyers = await request("/api/admin/lawyers", "GET", adminToken);
assert.equal(lawyers.status, 200, `admin lawyer monitoring must be accessible: ${JSON.stringify(lawyers)}`);
const forbiddenOverview = await request("/api/admin/overview", "GET", clientToken);
assert.equal(forbiddenOverview.status, 401, `client must be denied admin monitoring: ${JSON.stringify(forbiddenOverview)}`);
const [audit] = await db.select({ adminId: adminAuditLogsTable.adminId, action: adminAuditLogsTable.action, entityId: adminAuditLogsTable.entityId }).from(adminAuditLogsTable).where(eq(adminAuditLogsTable.entityId, verificationId)).limit(1);
assert(audit, "admin approval must emit an audit record");
assert.equal(audit.adminId, admin.id);
assert.equal(audit.action, "LAWYER_VERIFICATION_APPROVED");
console.log(`G3-G PASS | overview=200 | lawyers=200 | client_denied=${forbiddenOverview.status} | audit_admin=${audit.adminId} | audit_action=${audit.action}`);

await db.delete(adminAuditLogsTable).where(eq(adminAuditLogsTable.entityId, verificationId));
await db.delete(lawyerVerificationsTable).where(eq(lawyerVerificationsTable.id, verificationId));
await db.delete(lawyerWalletTransactionsTable).where(eq(lawyerWalletTransactionsTable.walletId, walletId));
await db.delete(lawyerWalletsTable).where(eq(lawyerWalletsTable.id, walletId));
await db.delete(usersTable).where(eq(usersTable.id, identities.clientId));
await db.delete(usersTable).where(eq(usersTable.id, identities.lawyerId));

console.log("GATE #3 EVIDENCE TESTS PASSED | G3-D PASS | G3-E PASS | G3-G PASS");
await pool.end();
