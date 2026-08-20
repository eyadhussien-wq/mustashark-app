import assert from "node:assert/strict";
import crypto from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import {
  db,
  pool,
  agreementsTable,
  legalRepresentationDocumentsTable,
  representationQuotesTable,
  usersTable,
} from "@workspace/db";
import {
  createAgreement,
} from "../../artifacts/api-server/src/services/agreements";
import {
  getLegalDocument,
  listLegalDocuments,
  rejectLegalDocument,
  startLegalDocumentReview,
  submitLegalDocument,
  supersedeLegalDocument,
  uploadLegalDocument,
  verifyLegalDocument,
} from "../../artifacts/api-server/src/services/legalRepresentationDocuments";

type Fixture = {
  clientId: string;
  lawyerId: string;
  outsiderId: string;
  quoteId: string;
  agreementId?: string;
};

type Actor = { userId: string; role: "client" | "lawyer" | "admin" };

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function sha256(content: string) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function assertError(error: unknown, expected: string) {
  assert.equal(error instanceof Error ? error.message : String(error), expected);
}

async function expectError(action: () => Promise<unknown>, expected: string) {
  await assert.rejects(action, (error: unknown) => {
    assertError(error, expected);
    return true;
  });
}

async function seedFixture(): Promise<Fixture> {
  const fixture = {
    clientId: id("s02-05-client"),
    lawyerId: id("s02-05-lawyer"),
    outsiderId: id("s02-05-outsider"),
    quoteId: id("s02-05-quote"),
  };

  await db.insert(usersTable).values([
    {
      id: fixture.clientId,
      name: "S02.5 Test Client",
      email: `${fixture.clientId}@example.test`,
      role: "client",
      accountStatus: "active",
      authProvider: "local",
    },
    {
      id: fixture.lawyerId,
      name: "S02.5 Test Lawyer",
      email: `${fixture.lawyerId}@example.test`,
      role: "lawyer",
      accountStatus: "active",
      authProvider: "local",
    },
    {
      id: fixture.outsiderId,
      name: "S02.5 Test Outsider",
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
    title: "S02.5 Behavioral Fixture",
    description: "Legal representation documents behavioral test fixture",
    totalAmount: "100.00",
    currency: "JOD",
    status: "accepted",
    fundingMode: "full",
  });

  return fixture;
}

async function cleanupFixture(fixture: Fixture | undefined) {
  if (!fixture) return;

  const agreementIds = fixture.agreementId ? [fixture.agreementId] : (await db
    .select({ id: agreementsTable.id })
    .from(agreementsTable)
    .where(eq(agreementsTable.quoteId, fixture.quoteId))).map((row) => row.id);

  if (agreementIds.length > 0) {
    await db
      .delete(legalRepresentationDocumentsTable)
      .where(inArray(legalRepresentationDocumentsTable.agreementId, agreementIds));
    await db.delete(agreementsTable).where(inArray(agreementsTable.id, agreementIds));
  }

  await db.delete(representationQuotesTable).where(eq(representationQuotesTable.id, fixture.quoteId));
  await db.delete(usersTable).where(
    inArray(usersTable.id, [fixture.clientId, fixture.lawyerId, fixture.outsiderId]),
  );
}

async function createAgreementFixture(fixture: Fixture) {
  const created = await createAgreement({
    quoteId: fixture.quoteId,
    content: "S02.5 agreement content",
    actorUserId: fixture.clientId,
  });
  fixture.agreementId = created.agreement.id;
  return created;
}

async function run() {
  let fixture: Fixture | undefined;

  try {
    fixture = await seedFixture();
    const agreement = await createAgreementFixture(fixture);

    const client: Actor = { userId: fixture.clientId, role: "client" };
    const lawyer: Actor = { userId: fixture.lawyerId, role: "lawyer" };
    const outsider: Actor = { userId: fixture.outsiderId, role: "client" };

    // 1. Upload: POA belongs to the client upload path; forbidden actors/types are rejected.
    const poaContent = "POA-S02.5-v1-official-content";
    const poa = await uploadLegalDocument({
      agreementId: agreement.agreement.id,
      actor: client,
      documentType: "poa",
      fileName: "poa-v1.pdf",
      mimeType: "application/pdf",
      storageKey: id("storage-poa"),
      content: poaContent,
      title: "Power of Attorney",
      issuedAt: new Date("2026-08-01T00:00:00.000Z"),
      metadata: { source: "client", fixture: true },
    });

    assert.equal(poa.status, "uploaded");
    assert.equal(poa.agreementId, agreement.agreement.id);
    assert.equal(poa.uploadedBy, fixture.clientId);
    assert.equal(poa.uploadedByRole, "client");
    assert.equal(poa.contentHash, sha256(poaContent));

    await expectError(
      () => uploadLegalDocument({
        agreementId: agreement.agreement.id,
        actor: lawyer,
        documentType: "poa",
        fileName: "poa-lawyer-upload.pdf",
        storageKey: id("storage-invalid-poa"),
        content: "invalid lawyer POA upload",
        title: "Invalid POA",
      }),
      "FORBIDDEN",
    );
    console.log("- upload + POA ownership/authorization: PASS");

    // 2. Submit: uploader can submit; unrelated actor cannot.
    await expectError(
      () => submitLegalDocument({ documentId: poa.id, actor: outsider }),
      "FORBIDDEN",
    );

    const submitted = await submitLegalDocument({ documentId: poa.id, actor: client });
    assert.equal(submitted.status, "submitted");
    assert.ok(submitted.submittedAt);
    console.log("- submit + IDOR protection: PASS");

    // 3. Review: only lawyer/admin can move submitted -> under_review.
    await expectError(
      () => startLegalDocumentReview({ documentId: poa.id, actor: client }),
      "FORBIDDEN",
    );

    const underReview = await startLegalDocumentReview({ documentId: poa.id, actor: lawyer });
    assert.equal(underReview.status, "under_review");
    assert.ok(underReview.reviewStartedAt);
    console.log("- under_review transition + lawyer authorization: PASS");

    // 4. Reject: rejection requires a non-empty reason and preserves the document.
    await expectError(
      () => rejectLegalDocument({ documentId: poa.id, actor: lawyer, rejectionReason: "   " }),
      "REJECTION_REASON_REQUIRED",
    );

    const rejected = await rejectLegalDocument({
      documentId: poa.id,
      actor: lawyer,
      rejectionReason: "Missing official issuing authority stamp",
    });
    assert.equal(rejected.status, "rejected");
    assert.equal(rejected.rejectionReason, "Missing official issuing authority stamp");
    assert.ok(rejected.rejectedAt);
    console.log("- rejection gate + rejection evidence: PASS");

    // 5. Re-submit + verify: rejected documents can re-enter review, then become verified.
    const resubmitted = await submitLegalDocument({ documentId: poa.id, actor: client });
    assert.equal(resubmitted.status, "submitted");

    const secondReview = await startLegalDocumentReview({ documentId: poa.id, actor: lawyer });
    assert.equal(secondReview.status, "under_review");

    const verified = await verifyLegalDocument({ documentId: poa.id, actor: lawyer });
    assert.equal(verified.status, "verified");
    assert.equal(verified.verifiedBy, fixture.lawyerId);
    assert.ok(verified.verifiedAt);
    assert.equal(verified.contentHash, sha256(poaContent));
    console.log("- rejected -> submitted -> under_review -> verified: PASS");

    // 6. Court proof: lawyer may upload a specialized judicial proof and the same lifecycle applies.
    const courtContent = "COURT-PROOF-S02.5-2026";
    const courtProof = await uploadLegalDocument({
      agreementId: agreement.agreement.id,
      actor: lawyer,
      documentType: "court_proof",
      fileName: "court-proof.pdf",
      mimeType: "application/pdf",
      storageKey: id("storage-court-proof"),
      content: courtContent,
      title: "Court Proof",
      courtName: "Amman Court",
      caseNumberReference: "2026/12345",
      issuedAt: new Date("2026-08-10T00:00:00.000Z"),
      metadata: { court: "Amman Court", fixture: true },
    });
    assert.equal(courtProof.status, "uploaded");
    assert.equal(courtProof.uploadedBy, fixture.lawyerId);
    assert.equal(courtProof.contentHash, sha256(courtContent));
    console.log("- lawyer court-proof upload + legal metadata: PASS");

    // 7. Supersede: verified evidence is never overwritten; a new document forms the chain.
    const replacementContent = "POA-S02.5-v2-replacement";
    const superseded = await supersedeLegalDocument({
      documentId: poa.id,
      actor: lawyer,
      fileName: "poa-v2.pdf",
      mimeType: "application/pdf",
      storageKey: id("storage-poa-v2"),
      content: replacementContent,
      title: "Power of Attorney - Replacement",
      issuedAt: new Date("2026-08-15T00:00:00.000Z"),
      metadata: { replacement: true, fixture: true },
    });

    assert.equal(superseded.previous.id, poa.id);
    assert.equal(superseded.previous.status, "superseded");
    assert.ok(superseded.previous.supersededAt);
    assert.equal(superseded.document.status, "uploaded");
    assert.equal(superseded.document.supersedesDocumentId, poa.id);
    assert.equal(superseded.document.contentHash, sha256(replacementContent));
    console.log("- verified -> superseded + immutable document chain: PASS");

    // 8. Read/list: agreement-bound access only; outsider cannot enumerate or fetch documents.
    const clientDocuments = await listLegalDocuments({
      agreementId: agreement.agreement.id,
      actor: client,
    });
    assert.equal(clientDocuments.length, 3);

    const fetched = await getLegalDocument({ documentId: superseded.document.id, actor: client });
    assert.equal(fetched.id, superseded.document.id);

    await expectError(
      () => listLegalDocuments({ agreementId: agreement.agreement.id, actor: outsider }),
      "FORBIDDEN",
    );
    await expectError(
      () => getLegalDocument({ documentId: superseded.document.id, actor: outsider }),
      "FORBIDDEN",
    );
    console.log("- read/list authorization + IDOR protection: PASS");

    // 9. Persistence/evidence invariants: no overwritten historical row and hashes remain exact.
    const persisted = await db
      .select()
      .from(legalRepresentationDocumentsTable)
      .where(eq(legalRepresentationDocumentsTable.agreementId, agreement.agreement.id));

    assert.equal(persisted.length, 3);
    const persistedOriginal = persisted.find((row) => row.id === poa.id)!;
    const persistedReplacement = persisted.find((row) => row.id === superseded.document.id)!;
    const persistedCourt = persisted.find((row) => row.id === courtProof.id)!;

    assert.equal(persistedOriginal.status, "superseded");
    assert.equal(persistedOriginal.contentHash, sha256(poaContent));
    assert.equal(persistedReplacement.status, "uploaded");
    assert.equal(persistedReplacement.supersedesDocumentId, poa.id);
    assert.equal(persistedCourt.courtName, "Amman Court");
    assert.equal(persistedCourt.caseNumberReference, "2026/12345");
    assert.ok(persisted.every((row) => row.contentHash.length === 64));
    console.log("- persistence + content-hash + historical evidence integrity: PASS");

    console.log("S02-05 LEGAL REPRESENTATION DOCUMENTS SERVICE BEHAVIORAL TEST PASSED");
  } finally {
    await cleanupFixture(fixture).catch(() => undefined);
    await pool.end();
  }
}

await run();
