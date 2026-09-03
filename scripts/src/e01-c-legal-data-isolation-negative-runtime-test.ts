import assert from "node:assert/strict";
import crypto from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import app from "../../artifacts/api-server/src/app";
import { signToken } from "../../artifacts/api-server/src/lib/jwt";
import { createAgreement } from "../../artifacts/api-server/src/services/agreements";
import {
  db,
  pool,
  agreementsTable,
  legalRepresentationDocumentsTable,
  representationQuotesTable,
  usersTable,
} from "@workspace/db";

type Fixture = {
  clientA: string;
  lawyerA: string;
  clientB: string;
  lawyerB: string;
  quoteA: string;
  quoteB: string;
  agreementA?: string;
  agreementB?: string;
  documentA?: string;
  documentB?: string;
};

type Actor = { userId: string; email: string; role: "client" | "lawyer" | "admin" };

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
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

async function seedUsersAndQuotes(): Promise<Fixture> {
  const fixture: Fixture = {
    clientA: id("e01c-client-a"),
    lawyerA: id("e01c-lawyer-a"),
    clientB: id("e01c-client-b"),
    lawyerB: id("e01c-lawyer-b"),
    quoteA: id("e01c-quote-a"),
    quoteB: id("e01c-quote-b"),
  };

  await db.insert(usersTable).values([
    { id: fixture.clientA, name: "E01-C Client A", email: `${fixture.clientA}@example.test`, role: "client", accountStatus: "active", authProvider: "local" },
    { id: fixture.lawyerA, name: "E01-C Lawyer A", email: `${fixture.lawyerA}@example.test`, role: "lawyer", accountStatus: "active", authProvider: "local" },
    { id: fixture.clientB, name: "E01-C Client B", email: `${fixture.clientB}@example.test`, role: "client", accountStatus: "active", authProvider: "local" },
    { id: fixture.lawyerB, name: "E01-C Lawyer B", email: `${fixture.lawyerB}@example.test`, role: "lawyer", accountStatus: "active", authProvider: "local" },
  ]);

  await db.insert(representationQuotesTable).values([
    { id: fixture.quoteA, clientId: fixture.clientA, lawyerId: fixture.lawyerA, title: "E01-C Agreement A", description: "Isolation fixture A", totalAmount: "100.00", currency: "JOD", status: "accepted", fundingMode: "full" },
    { id: fixture.quoteB, clientId: fixture.clientB, lawyerId: fixture.lawyerB, title: "E01-C Agreement B", description: "Isolation fixture B", totalAmount: "100.00", currency: "JOD", status: "accepted", fundingMode: "full" },
  ]);

  return fixture;
}

async function cleanup(fixture: Fixture | undefined) {
  if (!fixture) return;
  const agreementIds = [fixture.agreementA, fixture.agreementB].filter((value): value is string => Boolean(value));
  if (agreementIds.length) {
    await db.delete(legalRepresentationDocumentsTable).where(inArray(legalRepresentationDocumentsTable.agreementId, agreementIds));
    await db.delete(agreementsTable).where(inArray(agreementsTable.id, agreementIds));
  }
  await db.delete(representationQuotesTable).where(inArray(representationQuotesTable.id, [fixture.quoteA, fixture.quoteB]));
  await db.delete(usersTable).where(inArray(usersTable.id, [fixture.clientA, fixture.lawyerA, fixture.clientB, fixture.lawyerB]));
}

async function run() {
  let fixture: Fixture | undefined;
  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    fixture = await seedUsersAndQuotes();
    fixture.agreementA = (await createAgreement({ quoteId: fixture.quoteA, content: "E01-C agreement A", actorUserId: fixture.clientA })).agreement.id;
    fixture.agreementB = (await createAgreement({ quoteId: fixture.quoteB, content: "E01-C agreement B", actorUserId: fixture.clientB })).agreement.id;

    const clientA: Actor = { userId: fixture.clientA, email: `${fixture.clientA}@example.test`, role: "client" };
    const lawyerA: Actor = { userId: fixture.lawyerA, email: `${fixture.lawyerA}@example.test`, role: "lawyer" };
    const clientB: Actor = { userId: fixture.clientB, email: `${fixture.clientB}@example.test`, role: "client" };
    const lawyerB: Actor = { userId: fixture.lawyerB, email: `${fixture.lawyerB}@example.test`, role: "lawyer" };

    const uploadA = await request(baseUrl, "POST", `/api/agreements/${fixture.agreementA}/legal-representation-documents`, clientA, {
      agreementId: fixture.agreementA,
      documentType: "poa",
      fileName: "a.pdf",
      mimeType: "application/pdf",
      storageKey: id("e01c-doc-a"),
      content: "E01-C-DOCUMENT-A",
      title: "E01-C Document A",
    });
    assertStatus(uploadA, 201, "client A document upload");
    fixture.documentA = (uploadA.body as { document?: { id: string } }).document?.id;
    assert.ok(fixture.documentA);

    const uploadB = await request(baseUrl, "POST", `/api/agreements/${fixture.agreementB}/legal-representation-documents`, clientB, {
      agreementId: fixture.agreementB,
      documentType: "poa",
      fileName: "b.pdf",
      mimeType: "application/pdf",
      storageKey: id("e01c-doc-b"),
      content: "E01-C-DOCUMENT-B",
      title: "E01-C Document B",
    });
    assertStatus(uploadB, 201, "client B document upload");
    fixture.documentB = (uploadB.body as { document?: { id: string } }).document?.id;
    assert.ok(fixture.documentB);

    assertStatus(await request(baseUrl, "GET", `/api/agreements/${fixture.agreementA}/legal-representation-documents`, clientB), 403, "client B cannot list agreement A");
    assertStatus(await request(baseUrl, "GET", `/api/agreements/${fixture.agreementB}/legal-representation-documents`, clientA), 403, "client A cannot list agreement B");
    assertStatus(await request(baseUrl, "GET", `/api/legal-representation-documents/${fixture.documentA}`, clientB), 403, "client B cannot read document A");
    assertStatus(await request(baseUrl, "GET", `/api/legal-representation-documents/${fixture.documentB}`, clientA), 403, "client A cannot read document B");
    assertStatus(await request(baseUrl, "GET", `/api/legal-representation-documents/${fixture.documentA}`, lawyerB), 403, "lawyer B cannot read document A");
    assertStatus(await request(baseUrl, "GET", `/api/legal-representation-documents/${fixture.documentB}`, lawyerA), 403, "lawyer A cannot read document B");
    console.log("- cross-client and cross-lawyer document reads/lists: PASS");

    assertStatus(await request(baseUrl, "POST", `/api/legal-representation-documents/${fixture.documentA}/submit`, clientB), 403, "client B cannot submit document A");
    assertStatus(await request(baseUrl, "POST", `/api/legal-representation-documents/${fixture.documentA}/review`, lawyerB), 403, "lawyer B cannot review document A");
    assertStatus(await request(baseUrl, "POST", `/api/legal-representation-documents/${fixture.documentA}/verify`, lawyerB), 403, "lawyer B cannot verify document A");
    assertStatus(await request(baseUrl, "POST", `/api/legal-representation-documents/${fixture.documentA}/supersede`, lawyerB, {
      fileName: "cross.pdf", mimeType: "application/pdf", storageKey: id("e01c-cross"), content: "forbidden", title: "Cross agreement replacement",
    }), 403, "lawyer B cannot supersede document A");
    console.log("- cross-actor mutation/IDOR protection: PASS");

    assertStatus(await request(baseUrl, "GET", `/api/agreements/${fixture.agreementB}/legal-representation-documents`, lawyerA), 403, "wrong agreement + lawyer actor");
    assertStatus(await request(baseUrl, "GET", `/api/agreements/${fixture.agreementA}/legal-representation-documents`, lawyerB), 403, "wrong agreement + lawyer actor reverse");
    console.log("- wrong-agreement boundary: PASS");

    console.log("E01-C LEGAL DATA ISOLATION NEGATIVE RUNTIME TEST PASSED");
  } finally {
    await cleanup(fixture).catch(() => undefined);
    server.close();
    await pool.end();
  }
}

await run();
