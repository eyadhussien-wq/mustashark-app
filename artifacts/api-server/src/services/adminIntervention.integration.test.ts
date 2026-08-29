import assert from "node:assert/strict";
import { after, test } from "node:test";
import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";

const testDatabaseUrl = process.env.ADMIN_INTERVENTION_TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  test("S02-08 Admin Intervention: isolated test database is required", () => assert.fail("ADMIN_INTERVENTION_TEST_DATABASE_URL is required; refusing to run S02-08 tests without an isolated Test DB"));
}
if (testDatabaseUrl && /(prod|production|live)/i.test(testDatabaseUrl)) {
  test("S02-08 Admin Intervention: production database URL is forbidden", () => assert.fail("ADMIN_INTERVENTION_TEST_DATABASE_URL appears to reference production; refusing to run"));
}
process.env.DATABASE_URL = testDatabaseUrl ?? "";

const { db, pool, usersTable, casesTable, agreementsTable, representationQuotesTable, adminAuditLogsTable } = await import("@workspace/db");
const { transitionCase } = await import("./cases");
const createdCaseIds: string[] = [];
const createdAgreementIds: string[] = [];
const createdQuoteIds: string[] = [];
const createdUserIds: string[] = [];
const adminEmail = "admin@mustashark.com";
const adminSeedId = "s02-08-admin-reference";

const ensureReferenceAdmin = async () => {
  await db.insert(usersTable).values({
    id: adminSeedId, name: "Mustashark Admin", email: adminEmail, role: "admin", authProvider: "local", accountStatus: "active", createdAt: new Date(), updatedAt: new Date(),
  }).onConflictDoUpdate({ target: usersTable.email, set: { role: "admin", accountStatus: "active", deletedAt: null, updatedAt: new Date() } });
  const [admin] = await db.select({ id: usersTable.id, role: usersTable.role, accountStatus: usersTable.accountStatus, deletedAt: usersTable.deletedAt }).from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
  assert.ok(admin, `${adminEmail} must exist in the isolated Test DB`);
  assert.equal(admin.role, "admin");
  assert.equal(admin.accountStatus, "active");
  assert.equal(admin.deletedAt, null);
  return admin.id;
};

const createFixture = async () => {
  const adminId = await ensureReferenceAdmin();
  const suffix = crypto.randomUUID();
  const clientId = `s02-08-client-${suffix}`;
  const lawyerId = `s02-08-lawyer-${suffix}`;
  const quoteId = `s02-08-quote-${suffix}`;
  const agreementId = `s02-08-agreement-${suffix}`;
  const caseId = `s02-08-case-${suffix}`;
  await db.insert(usersTable).values([
    { id: clientId, name: "S02-08 Test Client", email: `${clientId}@example.test`, role: "client", authProvider: "local", accountStatus: "active", createdAt: new Date(), updatedAt: new Date() },
    { id: lawyerId, name: "S02-08 Test Lawyer", email: `${lawyerId}@example.test`, role: "lawyer", authProvider: "local", accountStatus: "active", createdAt: new Date(), updatedAt: new Date() },
  ]);
  createdUserIds.push(clientId, lawyerId);
  await db.insert(representationQuotesTable).values({ id: quoteId, clientId, lawyerId, title: "S02-08 Test Quote", description: "Isolated admin intervention fixture", totalAmount: "100.00", currency: "JOD", status: "active", fundingMode: "full", createdAt: new Date(), updatedAt: new Date() });
  createdQuoteIds.push(quoteId);
  await db.insert(agreementsTable).values({ id: agreementId, quoteId, clientId, lawyerId, status: "confirmed", createdAt: new Date(), updatedAt: new Date() });
  createdAgreementIds.push(agreementId);
  await db.insert(casesTable).values({ id: caseId, agreementId, clientId, lawyerId, status: "active", createdAt: new Date(), updatedAt: new Date() });
  createdCaseIds.push(caseId);
  return { adminId, caseId };
};

test("S02-08: failure after case update rolls back both case mutation and audit insert", async () => {
  const { adminId, caseId } = await createFixture();
  const escapedCaseId = caseId.replace(/'/g, "''");
  await pool.query(`CREATE OR REPLACE FUNCTION s02_08_force_admin_audit_fk_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'S02_08_FORCED_ROLLBACK'; END; $$`);
  await pool.query(`CREATE TRIGGER s02_08_force_admin_audit_fk_failure AFTER UPDATE OF status ON cases FOR EACH ROW WHEN (NEW.id = '${escapedCaseId}') EXECUTE FUNCTION s02_08_force_admin_audit_fk_failure()`);
  const auditBefore = await db.select({ id: adminAuditLogsTable.id }).from(adminAuditLogsTable).where(eq(adminAuditLogsTable.entityId, caseId));
  try {
    await assert.rejects(() => transitionCase({ caseId, targetStatus: "completed", actorUserId: adminId, actorRole: "admin" }), /S02_08_FORCED_ROLLBACK/);
  } finally {
    await pool.query("DROP TRIGGER IF EXISTS s02_08_force_admin_audit_fk_failure ON cases");
    await pool.query("DROP FUNCTION IF EXISTS s02_08_force_admin_audit_fk_failure()");
  }
  const [unchangedCase] = await db.select().from(casesTable).where(eq(casesTable.id, caseId)).limit(1);
  const auditAfter = await db.select({ id: adminAuditLogsTable.id }).from(adminAuditLogsTable).where(eq(adminAuditLogsTable.entityId, caseId));
  assert.equal(unchangedCase?.status, "active");
  assert.deepEqual(auditAfter, auditBefore);
  console.log(`ADMIN_INTERVENTION_ROLLBACK=${caseId} CASE=active AUDIT_COUNT=${auditAfter.length}`);
});

test("S02-08: admin intervention atomically changes case and writes immutable audit", async () => {
  const { adminId, caseId } = await createFixture();
  await transitionCase({ caseId, targetStatus: "completed", actorUserId: adminId, actorRole: "admin" });
  const [updatedCase] = await db.select().from(casesTable).where(eq(casesTable.id, caseId)).limit(1);
  assert.equal(updatedCase?.status, "completed");
  const [audit] = await db.select().from(adminAuditLogsTable).where(and(eq(adminAuditLogsTable.adminId, adminId), eq(adminAuditLogsTable.entityId, caseId))).limit(1);
  assert.ok(audit);
  assert.equal(audit.action, "case.status.completed");
  assert.deepEqual(audit.beforeData, { status: "active", completedAt: null, closedAt: null });
  assert.equal((audit.afterData as { status: string }).status, "completed");
  console.log(`ADMIN_INTERVENTION_SUCCESS=${caseId} AUDIT=${audit.id}`);
});

test("S02-08: admin audit logs reject UPDATE and DELETE with PostgreSQL 42501", async () => {
  const { adminId, caseId } = await createFixture();
  await transitionCase({ caseId, targetStatus: "completed", actorUserId: adminId, actorRole: "admin" });
  const [audit] = await db.select({ id: adminAuditLogsTable.id }).from(adminAuditLogsTable).where(eq(adminAuditLogsTable.entityId, caseId)).limit(1);
  assert.ok(audit);
  await assert.rejects(() => pool.query("UPDATE admin_audit_logs SET description = 'tampered' WHERE id = $1", [audit.id]), (error: unknown) => (error as { code?: string }).code === "42501");
  await assert.rejects(() => pool.query("DELETE FROM admin_audit_logs WHERE id = $1", [audit.id]), (error: unknown) => (error as { code?: string }).code === "42501");
  console.log(`ADMIN_AUDIT_IMMUTABLE=${audit.id} UPDATE=42501 DELETE=42501`);
});

after(async () => {
  for (const caseId of createdCaseIds) await db.delete(casesTable).where(eq(casesTable.id, caseId));
  for (const agreementId of createdAgreementIds) await db.delete(agreementsTable).where(eq(agreementsTable.id, agreementId));
  for (const quoteId of createdQuoteIds) await db.delete(representationQuotesTable).where(eq(representationQuotesTable.id, quoteId));
  for (const userId of createdUserIds) await db.delete(usersTable).where(eq(usersTable.id, userId));
  await pool.end();
});
