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
  clientId: string;
  lawyerId: string;
  outsiderId: string;
  quoteId: string;
  agreementId?: string;
};

type Actor = {
  userId: string;
  email: string;
  role: "client" | "lawyer" | "admin";
};

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function token(actor: Actor) {
  return signToken({
    userId: actor.userId,
    email: actor.email,
    role: actor.role,
    provider: "local",
  });
}

async function request(
  baseUrl: string,
  method: string,
  path: string,
  actor: Actor | null,
  body?: unknown,
  extraHeaders: Record<string, string> = {},
) {
  const headers: Record<string, string> = { ...extraHeaders };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (actor) headers.authorization = `Bearer ${token(actor)}`;

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

  return { status: response.status, headers: response.headers, body: parsed };
}

function assertStatus(result: { status: number; body: unknown }, expected: number, label: string) {
  assert.equal(
    result.status,
    expected,
    `${label}: expected ${expected}, got ${result.status}: ${JSON.stringify(result.body)}`,
  );
}

async function seedFixture(): Promise<Fixture> {
  const fixture = {
    clientId: id("s02-05-api-client"),
    lawyerId: id("s02-05-api-lawyer"),
    outsiderId: id("s02-05-api-outsider"),
    quoteId: id("s02-05-api-quote"),
  };

  await db.insert(usersTable).values([
    {
      id: fixture.clientId,
      name: "S02.5 API Test Client",
      email: `${fixture.clientId}@example.test`,
      role: "client",
      accountStatus: "active",
      authProvider: "local",
    },
    {
      id: fixture.lawyerId,
      name: "S02.5 API Test Lawyer",
      email: `${fixture.lawyerId}@example.test`,
      role: "lawyer",
      accountStatus: "active",
      authProvider: "local",
    },
    {
      id: fixture.outsiderId,
      name: "S02.5 API Test Outsider",
      email: `${fixture.outsiderId}@example.test`,
      role: "client",
      accountStatus: "active",
      authProvider: "local",
    },
  ]);

  await db.insert(representationQuotesTable).values({
    id: fixture.quoteId,
    clientId: fixture.clientId,
    lawyerId: fixture.lawyerId,
    title: "S02.5 API Behavioral Fixture",
    description: "Live HTTP behavioral fixture",
    totalAmount: "100.00",
    currency: "JOD",
    status: "accepted",
    fundingMode: "full",
  });

  return fixture;
}

async function createAgreementFixture(fixture: Fixture) {
  const created = await createAgreement({
    quoteId: fixture.quoteId,
    content: "S02.5 API agreement content",
    actorUserId: fixture.clientId,
  });
  fixture.agreementId = created.agreement.id;
  return created;
}

async function cleanupFixture(fixture: Fixture | undefined) {
  if (!fixture) return;

  const agreementIds = fixture.agreementId
    ? [fixture.agreementId]
    : (
        await db
          .select({ id: agreementsTable.id })
          .from(agreementsTable)
          .where(eq(agreementsTable.quoteId, fixture.quoteId))
      ).map((row) => row.id);

  if (agreementIds.length > 0) {
    await db
      .delete(legalRepresentationDocumentsTable)
      .where(inArray(legalRepresentationDocumentsTable.agreementId, agreementIds));
    await db.delete(agreementsTable).where(inArray(agreementsTable.id, agreementIds));
  }

  await db.delete(representationQuotesTable).where(eq(representationQuotesTable.id, fixture.quoteId));
  await db
    .delete(usersTable)
    .where(inArray(usersTable.id, [fixture.clientId, fixture.lawyerId, fixture.outsiderId]));
}

async function run() {
  let fixture: Fixture | undefined;
  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    fixture = await seedFixture();
    const agreement = await createAgreementFixture(fixture);

    const client: Actor = {
      userId: fixture.clientId,
      email: `${fixture.clientId}@example.test`,
      role: "client",
    };
    const lawyer: Actor = {
      userId: fixture.lawyerId,
      email: `${fixture.lawyerId}@example.test`,
      role: "lawyer",
    };
    const outsider: Actor = {
      userId: fixture.outsiderId,
      email: `${fixture.outsiderId}@example.test`,
      role: "client",
    };

    const unauthenticated = await request(
      baseUrl,
      "GET",
      `/api/agreements/${agreement.agreement.id}/legal-representation-documents`,
      null,
    );
    assertStatus(unauthenticated, 401, "unauthenticated list");

    const invalidUpload = await request(
      baseUrl,
      "POST",
      `/api/agreements/${agreement.agreement.id}/legal-representation-documents`,
      client,
      { agreementId: agreement.agreement.id, documentType: "poa" },
    );
    assertStatus(invalidUpload, 400, "strict upload validation");

    const poaContent = "S02.5-LIVE-POA-CONTENT";
    const upload = await request(
      baseUrl,
      "POST",
      `/api/agreements/${agreement.agreement.id}/legal-representation-documents`,
      client,
      {
        agreementId: agreement.agreement.id,
        documentType: "poa",
        fileName: "poa-live.pdf",
        mimeType: "application/pdf",
        storageKey: id("s02-05-api-poa"),
        content: poaContent,
        title: "Power of Attorney",
        issuedAt: "2026-08-01T00:00:00.000Z",
        metadata: { fixture: true },
      },
    );
    assertStatus(upload, 201, "client POA upload");
    const poa = (upload.body as { document?: { id: string; status: string; uploadedBy: string } }).document;
    assert.ok(poa?.id);
    assert.equal(poa.status, "uploaded");
    assert.equal(poa.uploadedBy, fixture.clientId);
    console.log("- HTTP upload + strict request validation: PASS");

    const lawyerPoaUpload = await request(
      baseUrl,
      "POST",
      `/api/agreements/${agreement.agreement.id}/legal-representation-documents`,
      lawyer,
      {
        agreementId: agreement.agreement.id,
        documentType: "poa",
        fileName: "lawyer-poa.pdf",
        mimeType: "application/pdf",
        storageKey: id("s02-05-api-invalid-poa"),
        content: "forbidden",
        title: "Forbidden POA",
      },
    );
    assertStatus(lawyerPoaUpload, 403, "lawyer POA upload authorization");

    const submit = await request(
      baseUrl,
      "POST",
      `/api/legal-representation-documents/${poa.id}/submit`,
      client,
    );
    assertStatus(submit, 200, "client submit");

    const outsiderSubmit = await request(
      baseUrl,
      "POST",
      `/api/legal-representation-documents/${poa.id}/submit`,
      outsider,
    );
    assertStatus(outsiderSubmit, 403, "outsider submit IDOR");
    console.log("- submit + HTTP IDOR protection: PASS");

    const clientReview = await request(
      baseUrl,
      "POST",
      `/api/legal-representation-documents/${poa.id}/review`,
      client,
    );
    assertStatus(clientReview, 403, "client review authorization");

    const review = await request(
      baseUrl,
      "POST",
      `/api/legal-representation-documents/${poa.id}/review`,
      lawyer,
    );
    assertStatus(review, 200, "lawyer review");

    const rejectInvalid = await request(
      baseUrl,
      "POST",
      `/api/legal-representation-documents/${poa.id}/reject`,
      lawyer,
      { rejectionReason: "   " },
    );
    assertStatus(rejectInvalid, 400, "empty rejection reason");

    const reject = await request(
      baseUrl,
      "POST",
      `/api/legal-representation-documents/${poa.id}/reject`,
      lawyer,
      { rejectionReason: "Missing official issuing authority stamp" },
    );
    assertStatus(reject, 200, "lawyer rejection");
    console.log("- review authorization + rejection validation: PASS");

    const resubmit = await request(
      baseUrl,
      "POST",
      `/api/legal-representation-documents/${poa.id}/submit`,
      client,
    );
    assertStatus(resubmit, 200, "client resubmit");

    const secondReview = await request(
      baseUrl,
      "POST",
      `/api/legal-representation-documents/${poa.id}/review`,
      lawyer,
    );
    assertStatus(secondReview, 200, "second lawyer review");

    const verify = await request(
      baseUrl,
      "POST",
      `/api/legal-representation-documents/${poa.id}/verify`,
      lawyer,
    );
    assertStatus(verify, 200, "lawyer verify");
    console.log("- rejected -> submitted -> review -> verified over HTTP: PASS");

    const courtContent = "S02.5-LIVE-COURT-PROOF";
    const courtUpload = await request(
      baseUrl,
      "POST",
      `/api/agreements/${agreement.agreement.id}/legal-representation-documents`,
      lawyer,
      {
        agreementId: agreement.agreement.id,
        documentType: "court_proof",
        fileName: "court-proof-live.pdf",
        mimeType: "application/pdf",
        storageKey: id("s02-05-api-court-proof"),
        content: courtContent,
        title: "Court Proof",
        courtName: "Amman Court",
        caseNumberReference: "2026/12345",
        issuedAt: "2026-08-10T00:00:00.000Z",
        metadata: { fixture: true },
      },
    );
    assertStatus(courtUpload, 201, "lawyer court proof upload");
    const courtProof = (courtUpload.body as { document?: { id: string } }).document;
    assert.ok(courtProof?.id);
    console.log("- lawyer court-proof upload + legal metadata over HTTP: PASS");

    const replacementContent = "S02.5-LIVE-POA-REPLACEMENT";
    const supersede = await request(
      baseUrl,
      "POST",
      `/api/legal-representation-documents/${poa.id}/supersede`,
      lawyer,
      {
        fileName: "poa-live-v2.pdf",
        mimeType: "application/pdf",
        storageKey: id("s02-05-api-poa-v2"),
        content: replacementContent,
        title: "Power of Attorney Replacement",
        issuedAt: "2026-08-15T00:00:00.000Z",
        metadata: { fixture: true, replacement: true },
      },
    );
    assertStatus(supersede, 201, "verified document supersede");
    const supersedeBody = supersede.body as {
      previous?: { id: string; status: string };
      document?: { id: string; status: string; supersedesDocumentId: string | null };
    };
    assert.equal(supersedeBody.previous?.id, poa.id);
    assert.equal(supersedeBody.previous?.status, "superseded");
    assert.equal(supersedeBody.document?.status, "uploaded");
    assert.equal(supersedeBody.document?.supersedesDocumentId, poa.id);
    console.log("- supersede chain + immutable history over HTTP: PASS");

    const list = await request(
      baseUrl,
      "GET",
      `/api/agreements/${agreement.agreement.id}/legal-representation-documents`,
      client,
    );
    assertStatus(list, 200, "agreement-bound list");
    const documents = (list.body as { documents?: unknown[] }).documents;
    assert.equal(documents?.length, 3);

    const outsiderList = await request(
      baseUrl,
      "GET",
      `/api/agreements/${agreement.agreement.id}/legal-representation-documents`,
      outsider,
    );
    assertStatus(outsiderList, 403, "outsider agreement list IDOR");

    const outsiderGet = await request(
      baseUrl,
      "GET",
      `/api/legal-representation-documents/${poa.id}`,
      outsider,
    );
    assertStatus(outsiderGet, 403, "outsider document read IDOR");
    console.log("- list/get agreement binding + IDOR protection: PASS");

    const preflight = await fetch(
      `${baseUrl}/api/legal-representation-documents/${poa.id}/verify`,
      {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "authorization,content-type,idempotency-key",
        },
      },
    );
    assertStatus({ status: preflight.status, body: await preflight.text() }, 204, "CORS preflight");
    const allowedHeaders = preflight.headers.get("access-control-allow-headers")?.toLowerCase() ?? "";
    assert.ok(allowedHeaders.includes("idempotency-key"), "CORS preflight did not allow Idempotency-Key");
    console.log("- CORS preflight + Idempotency-Key header: PASS");

    const persisted = await db
      .select()
      .from(legalRepresentationDocumentsTable)
      .where(eq(legalRepresentationDocumentsTable.agreementId, agreement.agreement.id));
    assert.equal(persisted.length, 3);
    assert.equal(persisted.find((row) => row.id === poa.id)?.status, "superseded");
    assert.equal(persisted.find((row) => row.id === courtProof.id)?.caseNumberReference, "2026/12345");
    assert.ok(persisted.every((row) => row.contentHash.length === 64));
    console.log("- persistence + evidence integrity after HTTP lifecycle: PASS");

    console.log("S02-05 LEGAL REPRESENTATION DOCUMENTS API BEHAVIORAL TEST PASSED");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await cleanupFixture(fixture).catch(() => undefined);
    await pool.end();
  }
}

await run();
