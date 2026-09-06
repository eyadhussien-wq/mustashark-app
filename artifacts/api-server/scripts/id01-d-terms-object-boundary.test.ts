import assert from "node:assert/strict";
import test from "node:test";
import { and, eq } from "drizzle-orm";
import {
  agreementsTable,
  caseMembershipsTable,
  casesTable,
  db,
  representationQuotesTable,
  termsConsentsTable,
  termsVersionsTable,
  usersTable,
} from "@workspace/db";
import { getCaseById, transitionCase } from "../src/services/cases.ts";
import { getCurrentMandatoryTerms, hasCurrentMandatoryTermsConsent, recordTermsConsent, sha256 } from "../src/lib/platformTerms.ts";

const databaseUrl = process.env.DATABASE_URL ?? "";
const parsed = databaseUrl ? new URL(databaseUrl) : null;
if (!parsed || !["localhost", "127.0.0.1", "::1"].includes(parsed.hostname) || !parsed.pathname.endsWith("_test")) {
  throw new Error("ID-01-D requires an isolated localhost *_test DATABASE_URL");
}

const suffix = cryptoRandom();
const ids = {
  clientA: `id01d-client-a-${suffix}`,
  clientB: `id01d-client-b-${suffix}`,
  lawyerA: `id01d-lawyer-a-${suffix}`,
  lawyerB: `id01d-lawyer-b-${suffix}`,
  outsider: `id01d-outsider-${suffix}`,
  quoteA: `id01d-quote-a-${suffix}`,
  quoteB: `id01d-quote-b-${suffix}`,
  agreementA: `id01d-agreement-a-${suffix}`,
  agreementB: `id01d-agreement-b-${suffix}`,
  caseA: `id01d-case-a-${suffix}`,
  caseB: `id01d-case-b-${suffix}`,
  termsV1: `id01d-terms-v1-${suffix}`,
  termsV2: `id01d-terms-v2-${suffix}`,
};

function cryptoRandom() {
  return Math.random().toString(36).slice(2, 10);
}

async function expectReject(action: () => Promise<unknown>, expected: RegExp) {
  await assert.rejects(action, expected);
}

async function seedUsers() {
  await db.insert(usersTable).values([
    { id: ids.clientA, name: "ID01D Client A", email: `${ids.clientA}@example.test`, role: "client", accountStatus: "active" },
    { id: ids.clientB, name: "ID01D Client B", email: `${ids.clientB}@example.test`, role: "client", accountStatus: "active" },
    { id: ids.lawyerA, name: "ID01D Lawyer A", email: `${ids.lawyerA}@example.test`, role: "lawyer", accountStatus: "active" },
    { id: ids.lawyerB, name: "ID01D Lawyer B", email: `${ids.lawyerB}@example.test`, role: "lawyer", accountStatus: "active" },
    { id: ids.outsider, name: "ID01D Outsider", email: `${ids.outsider}@example.test`, role: "client", accountStatus: "active" },
  ]);
}

async function seedCases() {
  await db.insert(representationQuotesTable).values([
    { id: ids.quoteA, clientId: ids.clientA, lawyerId: ids.lawyerA, title: "Private Case A", description: "A-private-description", totalAmount: "1000.00", currency: "JOD", status: "active", fundingMode: "full" },
    { id: ids.quoteB, clientId: ids.clientB, lawyerId: ids.lawyerB, title: "Private Case B", description: "B-private-description", totalAmount: "2000.00", currency: "JOD", status: "active", fundingMode: "full" },
  ]);
  await db.insert(agreementsTable).values([
    { id: ids.agreementA, quoteId: ids.quoteA, clientId: ids.clientA, lawyerId: ids.lawyerA, status: "confirmed", confirmedAt: new Date(), confirmedBy: ids.clientA },
    { id: ids.agreementB, quoteId: ids.quoteB, clientId: ids.clientB, lawyerId: ids.lawyerB, status: "confirmed", confirmedAt: new Date(), confirmedBy: ids.clientB },
  ]);
  await db.insert(casesTable).values([
    { id: ids.caseA, agreementId: ids.agreementA, clientId: ids.clientA, lawyerId: ids.lawyerA, status: "active" },
    { id: ids.caseB, agreementId: ids.agreementB, clientId: ids.clientB, lawyerId: ids.lawyerB, status: "active" },
  ]);
  await db.insert(caseMembershipsTable).values([
    { id: `id01d-member-a-client-${suffix}`, caseId: ids.caseA, userId: ids.clientA, role: "client", status: "active" },
    { id: `id01d-member-a-lawyer-${suffix}`, caseId: ids.caseA, userId: ids.lawyerA, role: "lawyer", status: "active" },
    { id: `id01d-member-b-client-${suffix}`, caseId: ids.caseB, userId: ids.clientB, role: "client", status: "active" },
    { id: `id01d-member-b-lawyer-${suffix}`, caseId: ids.caseB, userId: ids.lawyerB, role: "lawyer", status: "active" },
  ]);
}

async function cleanup() {
  await db.delete(caseMembershipsTable).where(eq(caseMembershipsTable.caseId, ids.caseA));
  await db.delete(caseMembershipsTable).where(eq(caseMembershipsTable.caseId, ids.caseB));
  await db.delete(casesTable).where(eq(casesTable.id, ids.caseA));
  await db.delete(casesTable).where(eq(casesTable.id, ids.caseB));
  await db.delete(agreementsTable).where(eq(agreementsTable.id, ids.agreementA));
  await db.delete(agreementsTable).where(eq(agreementsTable.id, ids.agreementB));
  await db.delete(representationQuotesTable).where(eq(representationQuotesTable.id, ids.quoteA));
  await db.delete(representationQuotesTable).where(eq(representationQuotesTable.id, ids.quoteB));
  await db.delete(termsConsentsTable).where(eq(termsConsentsTable.userId, ids.clientA));
  await db.delete(termsConsentsTable).where(eq(termsConsentsTable.userId, ids.clientB));
  await db.delete(termsVersionsTable).where(eq(termsVersionsTable.id, ids.termsV1));
  await db.delete(termsVersionsTable).where(eq(termsVersionsTable.id, ids.termsV2));
  await db.delete(usersTable).where(eq(usersTable.id, ids.clientA));
  await db.delete(usersTable).where(eq(usersTable.id, ids.clientB));
  await db.delete(usersTable).where(eq(usersTable.id, ids.lawyerA));
  await db.delete(usersTable).where(eq(usersTable.id, ids.lawyerB));
  await db.delete(usersTable).where(eq(usersTable.id, ids.outsider));
}

test.before(async () => {
  await seedUsers();
});

test.after(async () => {
  await cleanup();
});

test("ID-01-D Terms Enforcement Oracle", async () => {
  const contentV1 = `ID01-D Terms v1 ${suffix}`;
  const hashV1 = sha256(contentV1);
  await db.insert(termsVersionsTable).values({
    id: ids.termsV1,
    version: 1,
    status: "published",
    content: contentV1,
    contentHash: hashV1,
    hashAlgorithm: "sha256",
    mandatory: true,
    effectiveAt: new Date(Date.now() - 60_000),
    publishedAt: new Date(),
  });

  const noConsent = await hasCurrentMandatoryTermsConsent(ids.clientA);
  assert.equal(noConsent.allowed, false);
  assert.equal(noConsent.reason, "consent_required");

  const consent = await recordTermsConsent({
    userId: ids.clientA,
    termsVersionId: ids.termsV1,
    contentHash: hashV1,
    source: "required_action",
  });
  assert.equal(consent?.userId, ids.clientA);
  assert.equal((await hasCurrentMandatoryTermsConsent(ids.clientA)).allowed, true);

  const replay = await recordTermsConsent({
    userId: ids.clientA,
    termsVersionId: ids.termsV1,
    contentHash: hashV1,
    source: "required_action",
  });
  assert.equal(replay?.id, consent?.id, "duplicate consent must be idempotent");

  await expectReject(
    () => recordTermsConsent({ userId: ids.clientA, termsVersionId: "forged-version", contentHash: hashV1, source: "required_action" }),
    /invalid_terms_version/,
  );
  await expectReject(
    () => recordTermsConsent({ userId: ids.clientA, termsVersionId: ids.termsV1, contentHash: sha256("tampered"), source: "required_action" }),
    /terms_content_hash_mismatch/,
  );

  await expectReject(
    () => db.update(termsVersionsTable).set({ content: "tampered-published-content" }).where(eq(termsVersionsTable.id, ids.termsV1)),
    /published|immutable|terms/i,
  );

  await db.update(termsVersionsTable).set({ status: "superseded" }).where(eq(termsVersionsTable.id, ids.termsV1));
  const contentV2 = `ID01-D Terms v2 ${suffix}`;
  const hashV2 = sha256(contentV2);
  await db.insert(termsVersionsTable).values({
    id: ids.termsV2,
    version: 2,
    status: "published",
    content: contentV2,
    contentHash: hashV2,
    hashAlgorithm: "sha256",
    mandatory: true,
    effectiveAt: new Date(Date.now() - 30_000),
    publishedAt: new Date(),
  });

  const oldConsent = await hasCurrentMandatoryTermsConsent(ids.clientA);
  assert.equal(oldConsent.allowed, false, "old Terms consent must not satisfy a newer mandatory version");
  assert.equal(oldConsent.reason, "consent_required");

  const current = await getCurrentMandatoryTerms();
  assert.equal(current?.id, ids.termsV2);

  await expectReject(
    () => db.delete(termsConsentsTable).where(and(eq(termsConsentsTable.userId, ids.clientA), eq(termsConsentsTable.termsVersionId, ids.termsV1))),
    /immutable|consent/i,
  );

  console.log(JSON.stringify({
    harness: "M0-PROOF-HARNESS-001",
    mode: "ID-01-D-TERMS",
    proofs: ["T01-no-consent", "T02-version-invalidation", "T03-current-consent", "T04-forged-version", "T05-hash-mismatch", "T07-idempotent-replay", "T08-published-immutable", "T09-consent-immutable"],
    result: "DB-ORACLE-PASS",
  }));
});

test("ID-01-D Cases Object Boundary Oracle", async () => {
  await seedCases();

  const caseAForClientA = await getCaseById(ids.caseA, ids.clientA, "client");
  assert.equal(caseAForClientA.case.id, ids.caseA);
  assert.equal(caseAForClientA.case.agreement.quote.title, "Private Case A");

  const caseAForLawyerA = await getCaseById(ids.caseA, ids.lawyerA, "lawyer");
  assert.equal(caseAForLawyerA.case.id, ids.caseA);

  await expectReject(() => getCaseById(ids.caseA, ids.clientB, "client"), /FORBIDDEN/);
  await expectReject(() => getCaseById(ids.caseA, ids.lawyerB, "lawyer"), /FORBIDDEN/);
  await expectReject(() => getCaseById(ids.caseB, ids.clientA, "client"), /FORBIDDEN/);
  await expectReject(() => getCaseById(ids.caseB, ids.lawyerA, "lawyer"), /FORBIDDEN/);
  await expectReject(() => getCaseById(ids.caseA, ids.outsider, "client"), /FORBIDDEN/);

  const beforeMutation = await db.select({ status: casesTable.status }).from(casesTable).where(eq(casesTable.id, ids.caseA)).limit(1);
  await expectReject(
    () => transitionCase({ caseId: ids.caseA, targetStatus: "completed", actorUserId: ids.clientB, actorRole: "client" }),
    /FORBIDDEN/,
  );
  const afterMutation = await db.select({ status: casesTable.status }).from(casesTable).where(eq(casesTable.id, ids.caseA)).limit(1);
  assert.equal(afterMutation[0]?.status, beforeMutation[0]?.status, "unauthorized mutation must not change case state");

  const adminView = await getCaseById(ids.caseA, ids.outsider, "admin");
  assert.equal(adminView.case.id, ids.caseA, "admin access must be explicit via admin role");

  console.log(JSON.stringify({
    harness: "M0-PROOF-HARNESS-001",
    mode: "ID-01-D-CASES",
    proofs: ["C01-authorized-client", "C03-authorized-lawyer", "C02-cross-client-deny", "C04-cross-lawyer-deny", "C05-id-substitution-client", "C06-id-substitution-lawyer", "C07-non-member-deny", "C08-unauthorized-mutation-no-change", "C10-child-DTO-only-after-authorization", "C12-explicit-admin"],
    result: "DB-ORACLE-PASS",
  }));
});
