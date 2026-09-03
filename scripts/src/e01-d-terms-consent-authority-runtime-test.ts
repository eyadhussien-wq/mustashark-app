import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import app from "../../artifacts/api-server/src/app";
import { signToken } from "../../artifacts/api-server/src/lib/jwt";
import { sha256 } from "../../artifacts/api-server/src/lib/platformTerms";
import { and, eq, inArray } from "drizzle-orm";
import { db, pool, adminAuditLogsTable, termsConsentsTable, termsVersionsTable, usersTable } from "@workspace/db";

type Actor = { userId: string; email: string; role: "client" | "admin" };

const id = (prefix: string) => `${prefix}-${randomUUID()}`;
const token = (actor: Actor) => signToken({ userId: actor.userId, email: actor.email, role: actor.role, provider: "local" });

async function request(baseUrl: string, method: string, path: string, actor: Actor | null, body?: unknown) {
  const headers: Record<string, string> = {};
  if (actor) headers.authorization = `Bearer ${token(actor)}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  let parsed: unknown = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = { raw: text }; }
  return { status: response.status, body: parsed };
}

function assertStatus(result: { status: number; body: unknown }, expected: number, label: string) {
  assert.equal(result.status, expected, `${label}: expected ${expected}, got ${result.status}: ${JSON.stringify(result.body)}`);
}

async function run() {
  const server = app.listen(0, "127.0.0.1");
  const userIds: string[] = [];
  const termsIds: string[] = [];
  try {
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const currentId = id("e01d-current");
    const draftId = id("e01d-draft");
    const clientId = id("e01d-registration-client");
    const failedId = id("e01d-failed-registration");
    const adminId = id("e01d-admin");
    termsIds.push(currentId, draftId);
    userIds.push(clientId, failedId, adminId);

    const currentContent = "E01-D hardened Terms v100";
    const draftContent = "E01-D hardened Terms v101";
    await db.insert(usersTable).values([
      { id: adminId, name: "E01-D Admin", email: `${adminId}@example.test`, role: "admin", accountStatus: "active", authProvider: "local" },
    ]);
    await db.insert(termsVersionsTable).values({
      id: currentId, version: 920001, status: "published", content: currentContent, contentHash: sha256(currentContent), hashAlgorithm: "sha256", mandatory: true,
      effectiveAt: new Date(Date.now() - 60000), publishedAt: new Date(Date.now() - 60000), createdBy: adminId,
    });

    // Atomic Registration Consent: no consent evidence means no account may be created.
    assertStatus(await request(baseUrl, "POST", "/api/auth/local-auth", null, {
      email: `${failedId}@example.test`, password: "Correct-Registration-123!", name: "No Consent", phone: "+962790000001", role: "client",
    }), 400, "registration without terms consent rejected");
    const missingRows = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, failedId));
    assert.equal(missingRows.length, 0, "account must not exist after missing-consent registration");
    console.log("- registration without consent -> account absent: PASS");

    assertStatus(await request(baseUrl, "POST", "/api/auth/local-auth", null, {
      email: `${failedId}@example.test`, password: "Correct-Registration-123!", name: "Wrong Hash", phone: "+962790000002", role: "client",
      termsVersionId: currentId, termsContentHash: "0".repeat(64),
    }), 409, "registration with wrong terms hash rejected");
    const wrongHashRows = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, failedId));
    assert.equal(wrongHashRows.length, 0, "account must not exist after invalid-consent registration");
    console.log("- registration with wrong hash -> account absent: PASS");

    assertStatus(await request(baseUrl, "POST", "/api/auth/local-auth", null, {
      email: `${clientId}@example.test`, password: "Correct-Registration-123!", name: "Atomic Client", phone: "+962790000003", role: "client",
      termsVersionId: currentId, termsContentHash: sha256(currentContent),
    }), 201, "registration with exact current terms succeeds");
    const consentRows = await db.select().from(termsConsentsTable).where(and(eq(termsConsentsTable.userId, clientId), eq(termsConsentsTable.termsVersionId, currentId)));
    assert.equal(consentRows.length, 1, "successful registration must create exactly one consent evidence row");
    console.log("- registration + consent in same transaction -> PASS");

    // Privacy boundary: unauthenticated access is denied, and authenticated access is self-scoped.
    assertStatus(await request(baseUrl, "GET", "/api/terms/consents/me", null), 401, "unauthenticated consent evidence read denied");
    const clientActor: Actor = { userId: clientId, email: `${clientId}@example.test`, role: "client" };
    const own = await request(baseUrl, "GET", "/api/terms/consents/me", clientActor);
    assertStatus(own, 200, "authenticated own consent evidence read allowed");
    const ownBody = own.body as { consents?: Array<{ termsVersionId: string }> };
    assert.deepEqual(ownBody.consents?.map((row) => row.termsVersionId), [currentId]);
    assertStatus(await request(baseUrl, "POST", "/api/terms/consent", clientActor, { termsVersionId: currentId, contentHash: sha256(currentContent), source: "registration" }), 400, "public consent endpoint cannot forge registration source");
    console.log("- consent privacy/self-scope + registration-source isolation -> PASS");

    // Publication Authority: only an admin can publish a server-created draft.
    await db.insert(termsVersionsTable).values({
      id: draftId, version: 920002, status: "draft", content: draftContent, contentHash: sha256(draftContent), hashAlgorithm: "sha256", mandatory: true,
      createdBy: adminId,
    });
    assertStatus(await request(baseUrl, "POST", `/api/admin/terms/${draftId}/publish`, clientActor), 401, "non-admin publication denied");
    const adminActor: Actor = { userId: adminId, email: `${adminId}@example.test`, role: "admin" };
    assertStatus(await request(baseUrl, "POST", `/api/admin/terms/${draftId}/publish`, adminActor), 200, "admin publication allowed");
    const [oldVersion] = await db.select().from(termsVersionsTable).where(eq(termsVersionsTable.id, currentId));
    const [newVersion] = await db.select().from(termsVersionsTable).where(eq(termsVersionsTable.id, draftId));
    assert.equal(oldVersion.status, "superseded");
    assert.equal(newVersion.status, "published");
    const audits = await db.select().from(adminAuditLogsTable).where(eq(adminAuditLogsTable.entityId, draftId));
    assert.equal(audits.length, 1, "publication must create one admin audit event");
    console.log("- admin-only publication + supersession + audit -> PASS");

    // Published legal text and consent evidence remain immutable.
    await assert.rejects(
      () => db.update(termsVersionsTable).set({ content: "tampered" }).where(eq(termsVersionsTable.id, draftId)),
      /published_terms_version_immutable/,
    );
    await assert.rejects(
      () => db.delete(termsConsentsTable).where(eq(termsConsentsTable.userId, clientId)),
      /terms_consent_immutable/,
    );
    console.log("- published Terms / consent immutability -> PASS");

    console.log("E01-D AUTHORITY + PRIVACY HARDENING TEST PASSED");
  } finally {
    await db.delete(termsConsentsTable).where(inArray(termsConsentsTable.userId, userIds)).catch(() => undefined);
    await db.delete(adminAuditLogsTable).where(inArray(adminAuditLogsTable.adminId, userIds)).catch(() => undefined);
    await db.delete(termsVersionsTable).where(inArray(termsVersionsTable.id, termsIds)).catch(() => undefined);
    await db.delete(usersTable).where(inArray(usersTable.id, userIds)).catch(() => undefined);
    server.close();
    await pool.end();
  }
}

await run();
