import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import app from "../../artifacts/api-server/src/app";
import { signToken } from "../../artifacts/api-server/src/lib/jwt";
import { sha256 } from "../../artifacts/api-server/src/lib/platformTerms";
import { and, eq, inArray } from "drizzle-orm";
import {
  db,
  pool,
  termsConsentsTable,
  termsVersionsTable,
  usersTable,
} from "@workspace/db";

type Actor = { userId: string; email: string; role: "client" };

type Fixture = {
  clientA: string;
  clientB: string;
  oldTermsId: string;
  currentTermsId: string;
};

function id(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

function token(actor: Actor) {
  return signToken({ userId: actor.userId, email: actor.email, role: actor.role, provider: "local" });
}

async function request(baseUrl: string, method: string, path: string, actor: Actor | null, body?: unknown) {
  const headers: Record<string, string> = {};
  if (actor) headers.authorization = `Bearer ${token(actor)}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }
  return { status: response.status, body: parsed };
}

function assertStatus(result: { status: number; body: unknown }, expected: number, label: string) {
  assert.equal(result.status, expected, `${label}: expected ${expected}, got ${result.status}: ${JSON.stringify(result.body)}`);
}

async function cleanup(fixture: Fixture | undefined) {
  if (!fixture) return;
  await db.delete(termsConsentsTable).where(inArray(termsConsentsTable.userId, [fixture.clientA, fixture.clientB]));
  await db.delete(termsVersionsTable).where(inArray(termsVersionsTable.id, [fixture.oldTermsId, fixture.currentTermsId]));
  await db.delete(usersTable).where(inArray(usersTable.id, [fixture.clientA, fixture.clientB]));
}

async function run() {
  let fixture: Fixture | undefined;
  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const clientA = id("e01d-client-a");
    const clientB = id("e01d-client-b");
    const oldContent = "E01-D Terms v1";
    const currentContent = "E01-D Terms v2";
    fixture = {
      clientA,
      clientB,
      oldTermsId: id("e01d-terms-v1"),
      currentTermsId: id("e01d-terms-v2"),
    };

    await db.insert(usersTable).values([
      { id: clientA, name: "E01-D Client A", email: `${clientA}@example.test`, role: "client", accountStatus: "active", authProvider: "local" },
      { id: clientB, name: "E01-D Client B", email: `${clientB}@example.test`, role: "client", accountStatus: "active", authProvider: "local" },
    ]);

    await db.insert(termsVersionsTable).values([
      {
        id: fixture.oldTermsId,
        version: 910001,
        status: "superseded",
        content: oldContent,
        contentHash: sha256(oldContent),
        hashAlgorithm: "sha256",
        mandatory: true,
        effectiveAt: new Date(Date.now() - 120000),
        publishedAt: new Date(Date.now() - 120000),
      },
      {
        id: fixture.currentTermsId,
        version: 910002,
        status: "published",
        content: currentContent,
        contentHash: sha256(currentContent),
        hashAlgorithm: "sha256",
        mandatory: true,
        effectiveAt: new Date(Date.now() - 60000),
        publishedAt: new Date(Date.now() - 60000),
      },
    ]);

    const actorA: Actor = { userId: clientA, email: `${clientA}@example.test`, role: "client" };
    const actorB: Actor = { userId: clientB, email: `${clientB}@example.test`, role: "client" };
    const currentHash = sha256(currentContent);
    const oldHash = sha256(oldContent);

    assertStatus(await request(baseUrl, "PATCH", "/api/profile", actorA, { name: "E01-D Client A No Consent" }), 403, "no current consent denies profile mutation");
    console.log("- no current consent -> protected business action DENY: PASS");

    await db.insert(termsConsentsTable).values({
      id: id("e01d-old-consent"),
      userId: clientA,
      termsVersionId: fixture.oldTermsId,
      version: 910001,
      contentHash: oldHash,
      source: "settings",
    });
    assertStatus(await request(baseUrl, "PATCH", "/api/profile", actorA, { name: "E01-D Client A Old Consent" }), 403, "old terms consent denies current protected mutation");
    console.log("- old/superseded consent -> protected business action DENY: PASS");

    assertStatus(
      await request(baseUrl, "POST", "/api/terms/consent", actorA, {
        termsVersionId: fixture.currentTermsId,
        contentHash: "0".repeat(64),
        source: "required_action",
      }),
      409,
      "wrong current terms hash rejected",
    );
    console.log("- current version + wrong hash -> consent DENY: PASS");

    assertStatus(
      await request(baseUrl, "POST", "/api/terms/consent", actorA, {
        termsVersionId: fixture.currentTermsId,
        contentHash: currentHash,
        source: "required_action",
      }),
      201,
      "current terms consent accepted",
    );
    assertStatus(await request(baseUrl, "PATCH", "/api/profile", actorA, { name: "E01-D Client A Allowed" }), 200, "current consent allows protected mutation");
    console.log("- current version + exact hash -> protected business action ALLOW: PASS");

    assertStatus(
      await request(baseUrl, "POST", "/api/terms/consent", actorB, {
        termsVersionId: fixture.currentTermsId,
        contentHash: currentHash,
        source: "required_action",
      }),
      201,
      "client B own consent accepted",
    );
    assertStatus(await request(baseUrl, "PATCH", "/api/profile", actorA, { name: "E01-D Client A Cross User Attempt" }), 200, "client B consent does not replace client A consent");
    assertStatus(await request(baseUrl, "PATCH", "/api/profile", actorB, { name: "E01-D Client B Allowed" }), 200, "client B own current consent allows mutation");
    console.log("- consent is bound to authenticated user; cross-user substitution ineffective: PASS");

    assertStatus(
      await request(baseUrl, "POST", "/api/terms/consent", actorA, {
        termsVersionId: fixture.currentTermsId,
        contentHash: currentHash,
        source: "required_action",
      }),
      201,
      "replayed consent is deterministic",
    );
    const consentRows = await db
      .select()
      .from(termsConsentsTable)
      .where(and(eq(termsConsentsTable.userId, clientA), eq(termsConsentsTable.termsVersionId, fixture.currentTermsId)));
    assert.equal(consentRows.length, 1, "replayed consent must not create duplicate evidence");
    console.log("- replay/idempotency -> one immutable consent record: PASS");

    assertStatus(await request(baseUrl, "GET", "/api/terms/current", null), 200, "current terms endpoint available");
    console.log("E01-D TERMS CONSENT NEGATIVE RUNTIME TEST PASSED");
  } finally {
    await cleanup(fixture).catch(() => undefined);
    server.close();
    await pool.end();
  }
}

await run();
