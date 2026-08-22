import assert from "node:assert/strict";
import { test, after } from "node:test";

// Security tests must never inherit a production DATABASE_URL. CI must provision
// an isolated SECURITY_TEST_DATABASE_URL and this suite deliberately refuses to run
// against a generic DATABASE_URL.
const testDatabaseUrl = process.env.SECURITY_TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  test("SECURITY GATE: isolated test database is required", () => {
    assert.fail("SECURITY_TEST_DATABASE_URL is required; refusing to run security tests without an isolated Test DB");
  });
}
if (testDatabaseUrl && /(prod|production|live)/i.test(testDatabaseUrl)) {
  test("SECURITY GATE: production database URL is forbidden", () => {
    assert.fail("SECURITY_TEST_DATABASE_URL appears to reference production; refusing to run");
  });
}

process.env.DATABASE_URL = testDatabaseUrl ?? "";
process.env.GOOGLE_CLIENT_ID = "security-gate-test-client";

const { db, pool, usersTable } = await import("@workspace/db");
const { eq, and, sql } = await import("drizzle-orm");
const bcrypt = (await import("bcryptjs")).default;
const { signToken } = await import("../lib/jwt");
const { requireAdmin } = await import("../middlewares/requireAdmin");
const { localAuth, socialAuth } = await import("../controllers/auth");

const createdUserIds: string[] = [];

function responseMock() {
  const result: { statusCode: number; body: any } = { statusCode: 200, body: null };
  return {
    result,
    status(code: number) { result.statusCode = code; return this; },
    json(body: unknown) { result.body = body; return this; },
  };
}

function requestMock(token: string) {
  return {
    headers: { authorization: `Bearer ${token}` },
    log: { error() {}, warn() {}, info() {} },
  } as any;
}

test("#1 Admin Fail-Closed: stale JWT is rejected after DB suspension", async () => {
  const id = `security-gate-admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  createdUserIds.push(id);
  await db.insert(usersTable).values({ id, name: "Security Gate Admin", email: `${id}@example.test`, role: "admin", authProvider: "local", accountStatus: "active", createdAt: new Date(), updatedAt: new Date() });
  const token = signToken({ userId: id, email: `${id}@example.test`, role: "admin", provider: "local" });
  await db.update(usersTable).set({ accountStatus: "suspended" }).where(eq(usersTable.id, id));

  const res = responseMock();
  let nextCalled = false;
  await requireAdmin(requestMock(token), res as any, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.ok([401, 403].includes(res.result.statusCode), `expected 401/403, got ${res.result.statusCode}`);
});

test("#2 Deactivation/Reactivation: wrong password cannot reactivate a soft-deleted account", async () => {
  const id = `security-gate-local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  createdUserIds.push(id);
  const passwordHash = await bcrypt.hash("Correct-Gate-Password-123!", 10);
  const deletedAt = new Date(Date.now() - 60_000);
  const scheduled = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.insert(usersTable).values({ id, name: "Deleted Security User", email: `${id}@example.test`, passwordHash, role: "client", authProvider: "local", accountStatus: "active", deletedAt, deletionScheduledAt: scheduled, createdAt: new Date(), updatedAt: new Date() });

  const req = { body: { email: `${id}@example.test`, password: "WRONG-GATE-PASSWORD", role: "client" }, log: { error() {}, warn() {}, info() {} } } as any;
  const res = responseMock();
  await localAuth(req, res as any);

  assert.equal(res.result.statusCode, 401);
  const [after] = await db.select({ deletedAt: usersTable.deletedAt, accountStatus: usersTable.accountStatus, deletionScheduledAt: usersTable.deletionScheduledAt }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
  assert.equal(after?.deletedAt?.getTime(), deletedAt.getTime());
  assert.equal(after?.accountStatus, "active");
  assert.equal(after?.deletionScheduledAt?.getTime(), scheduled.getTime());
});

test("#3 Provider Identity: unique index is real and concurrent OAuth creates one identity", async () => {
  const providerId = `security-gate-google-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const email = `${providerId}@example.test`;
  const indexes = await db.execute(sql`SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'users' AND indexname = 'users_auth_provider_provider_id_uq'`);
  assert.equal(indexes.rows.length, 1, "provider identity unique index is not installed in Test DB");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ sub: providerId, email, email_verified: "true", aud: "security-gate-test-client", name: "Concurrent OAuth User" }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;
  try {
    const body = { provider: "google", token: "synthetic-security-gate-token", role: "client" };
    const makeReq = () => ({ body, log: { error() {}, warn() {}, info() {} } }) as any;
    const r1 = responseMock();
    const r2 = responseMock();
    await Promise.all([socialAuth(makeReq(), r1 as any), socialAuth(makeReq(), r2 as any)]);

    assert.equal(r1.result.statusCode, 200, JSON.stringify(r1.result.body));
    assert.equal(r2.result.statusCode, 200, JSON.stringify(r2.result.body));
    const rows = await db.select({ id: usersTable.id }).from(usersTable).where(and(eq(usersTable.authProvider, "google"), eq(usersTable.providerId, providerId)));
    assert.equal(rows.length, 1, `expected exactly one provider identity, found ${rows.length}`);
    createdUserIds.push(rows[0]!.id);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

after(async () => {
  for (const id of createdUserIds) await db.delete(usersTable).where(eq(usersTable.id, id));
  await pool.end();
});
