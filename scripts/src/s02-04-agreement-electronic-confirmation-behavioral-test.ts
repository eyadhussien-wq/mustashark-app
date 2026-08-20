import assert from "node:assert/strict";
import crypto from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import {
  agreementConfirmationsTable,
  agreementEvidenceTable,
  agreementVersionsTable,
  agreementsTable,
  db,
  pool,
  representationQuotesTable,
  usersTable,
} from "@workspace/db";
import {
  confirmAgreement,
  createAgreement,
  createAgreementVersion,
  getAgreementById,
  publishAgreementVersion,
} from "../../artifacts/api-server/src/services/agreements";

type Fixture = {
  clientId: string;
  lawyerId: string;
  outsiderId: string;
  quoteId: string;
};

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
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

async function seedFixture(quoteStatus: "accepted" | "funding" | "active" = "accepted"): Promise<Fixture> {
  const clientId = id("s02-04-client");
  const lawyerId = id("s02-04-lawyer");
  const outsiderId = id("s02-04-outsider");
  const quoteId = id("s02-04-quote");

  await db.insert(usersTable).values([
    {
      id: clientId,
      name: "S02.4 Test Client",
      email: `${clientId}@example.test`,
      role: "client",
      accountStatus: "active",
      authProvider: "local",
    },
    {
      id: lawyerId,
      name: "S02.4 Test Lawyer",
      email: `${lawyerId}@example.test`,
      role: "lawyer",
      accountStatus: "active",
      authProvider: "local",
    },
    {
      id: outsiderId,
      name: "S02.4 Test Outsider",
      email: `${outsiderId}@example.test`,
      role: "client",
      accountStatus: "active",
      authProvider: "local",
    },
  ]);

  await db.insert(representationQuotesTable).values({
    id: quoteId,
    clientId,
    lawyerId,
    title: "S02.4 Behavioral Fixture",
    description: "Agreement electronic confirmation behavioral test fixture",
    totalAmount: "100.00",
    currency: "JOD",
    status: quoteStatus,
    fundingMode: "full",
  });

  return { clientId, lawyerId, outsiderId, quoteId };
}

async function cleanupFixture(fixture: Fixture | undefined) {
  if (!fixture) return;

  const agreementRows = await db
    .select({ id: agreementsTable.id })
    .from(agreementsTable)
    .where(eq(agreementsTable.quoteId, fixture.quoteId));
  const agreementIds = agreementRows.map((row) => row.id);

  if (agreementIds.length > 0) {
    const confirmationRows = await db
      .select({ id: agreementConfirmationsTable.id })
      .from(agreementConfirmationsTable)
      .where(inArray(agreementConfirmationsTable.agreementId, agreementIds));
    const confirmationIds = confirmationRows.map((row) => row.id);

    if (confirmationIds.length > 0) {
      await db.delete(agreementEvidenceTable).where(inArray(agreementEvidenceTable.confirmationId, confirmationIds));
    }
    await db.delete(agreementConfirmationsTable).where(inArray(agreementConfirmationsTable.agreementId, agreementIds));
    await db.delete(agreementVersionsTable).where(inArray(agreementVersionsTable.agreementId, agreementIds));
    await db.delete(agreementsTable).where(inArray(agreementsTable.id, agreementIds));
  }

  await db.delete(representationQuotesTable).where(eq(representationQuotesTable.id, fixture.quoteId));
  await db.delete(usersTable).where(
    inArray(usersTable.id, [fixture.clientId, fixture.lawyerId, fixture.outsiderId]),
  );
}

async function run() {
  let fixture: Fixture | undefined;
  let concurrencyFixture: Fixture | undefined;

  try {
    // 1. Create: prove a valid S02.3 quote can create Agreement + Version 1.
    // This deliberately exercises the currentVersionId FK ordering instead of bypassing it.
    fixture = await seedFixture("accepted");

    const created = await createAgreement({
      quoteId: fixture.quoteId,
      content: "S02.4 version 1 content",
      actorUserId: fixture.clientId,
    });

    assert.equal(created.agreement.quoteId, fixture.quoteId);
    assert.equal(created.agreement.clientId, fixture.clientId);
    assert.equal(created.agreement.lawyerId, fixture.lawyerId);
    assert.equal(created.agreement.status, "prepared");
    assert.equal(created.agreement.currentVersionId, created.version.id);
    assert.equal(created.version.agreementId, created.agreement.id);
    assert.equal(created.version.version, 1);
    assert.equal(created.version.status, "prepared");
    assert.ok(created.version.contentHash);
    console.log("- create agreement + version 1: PASS");

    // 2. Version: lawyer creates a new version and supersedes the previous one.
    const versioned = await createAgreementVersion({
      agreementId: created.agreement.id,
      content: "S02.4 version 2 content",
      actorUserId: fixture.lawyerId,
    });

    assert.equal(versioned.version.version, 2);
    assert.equal(versioned.version.status, "prepared");
    assert.equal(versioned.agreement.currentVersionId, versioned.version.id);
    assert.equal(versioned.agreement.status, "prepared");

    const persistedVersions = await db
      .select()
      .from(agreementVersionsTable)
      .where(eq(agreementVersionsTable.agreementId, created.agreement.id));
    assert.equal(persistedVersions.length, 2);
    assert.equal(persistedVersions.find((row) => row.version === 1)?.status, "superseded");
    assert.equal(persistedVersions.find((row) => row.version === 2)?.status, "prepared");
    console.log("- create version + supersede previous version: PASS");

    // 3. Publish: only the current prepared version can be published.
    await expectError(
      () => publishAgreementVersion({
        agreementId: created.agreement.id,
        versionId: persistedVersions.find((row) => row.version === 1)!.id,
        actorUserId: fixture!.lawyerId,
      }),
      "VERSION_NOT_CURRENT",
    );

    const published = await publishAgreementVersion({
      agreementId: created.agreement.id,
      versionId: versioned.version.id,
      actorUserId: fixture.lawyerId,
    });

    assert.equal(published.version.status, "published");
    assert.equal(published.agreement.status, "awaiting_confirmation");
    assert.ok(published.version.publishedAt);
    console.log("- publish current version + await confirmation: PASS");

    // 4. Confirm client: first confirmation creates evidence but does not finalize the agreement.
    const clientConfirmation = await confirmAgreement({
      agreementId: created.agreement.id,
      actorUserId: fixture.clientId,
      actorRole: "client",
      idempotencyKey: id("client-confirmation"),
    });

    assert.equal(clientConfirmation.replay, false);
    assert.equal(clientConfirmation.confirmation.actorRole, "client");
    assert.equal(clientConfirmation.confirmation.contentHash, published.version.contentHash);
    assert.equal(clientConfirmation.agreement.status, "awaiting_confirmation");
    console.log("- client confirmation: PASS");

    // 5. Confirm lawyer: second distinct actor finalizes the agreement.
    const lawyerConfirmationKey = id("lawyer-confirmation");
    const lawyerConfirmation = await confirmAgreement({
      agreementId: created.agreement.id,
      actorUserId: fixture.lawyerId,
      actorRole: "lawyer",
      idempotencyKey: lawyerConfirmationKey,
    });

    assert.equal(lawyerConfirmation.replay, false);
    assert.equal(lawyerConfirmation.confirmation.actorRole, "lawyer");
    assert.equal(lawyerConfirmation.agreement.status, "confirmed");
    assert.ok(lawyerConfirmation.agreement.confirmedAt);
    assert.equal(lawyerConfirmation.agreement.confirmedBy, fixture.lawyerId);
    console.log("- lawyer confirmation + final confirmed state: PASS");

    // 6. Replay: same actor/version must be idempotent even with a different key.
    const replay = await confirmAgreement({
      agreementId: created.agreement.id,
      actorUserId: fixture.lawyerId,
      actorRole: "lawyer",
      idempotencyKey: id("lawyer-confirmation-replay"),
    });

    assert.equal(replay.replay, true);
    assert.equal(replay.confirmation.id, lawyerConfirmation.confirmation.id);
    console.log("- confirmation replay/idempotency: PASS");

    // 7. Authorization: outsider cannot read or mutate the agreement.
    await expectError(
      () => getAgreementById(created.agreement.id, fixture!.outsiderId, "client"),
      "FORBIDDEN",
    );
    await expectError(
      () => createAgreementVersion({
        agreementId: created.agreement.id,
        content: "unauthorized version",
        actorUserId: fixture!.outsiderId,
      }),
      "FORBIDDEN",
    );
    await expectError(
      () => confirmAgreement({
        agreementId: created.agreement.id,
        actorUserId: fixture!.outsiderId,
        actorRole: "client",
        idempotencyKey: id("outsider-confirmation"),
      }),
      "FORBIDDEN",
    );
    console.log("- authorization guards: PASS");

    // 8. Concurrency: simultaneous confirmations for the same actor/version/key
    // must resolve as one durable confirmation and replays, not leak a unique-violation error.
    concurrencyFixture = await seedFixture("accepted");
    const concurrencyCreated = await createAgreement({
      quoteId: concurrencyFixture.quoteId,
      content: "S02.4 concurrency content",
      actorUserId: concurrencyFixture.clientId,
    });
    const concurrencyPublished = await publishAgreementVersion({
      agreementId: concurrencyCreated.agreement.id,
      versionId: concurrencyCreated.version.id,
      actorUserId: concurrencyFixture.lawyerId,
    });
    const concurrencyKey = id("concurrent-client-confirmation");

    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        confirmAgreement({
          agreementId: concurrencyCreated.agreement.id,
          actorUserId: concurrencyFixture!.clientId,
          actorRole: "client",
          idempotencyKey: concurrencyKey,
        }),
      ),
    );

    const rejected = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    assert.equal(
      rejected.length,
      0,
      `concurrent confirmations must not reject: ${rejected.map((result) => String(result.reason)).join(" | ")}`,
    );

    const fulfilled = results.map(
      (result) =>
        (result as PromiseFulfilledResult<Awaited<ReturnType<typeof confirmAgreement>>>).value,
    );
    assert.equal(
      fulfilled.filter((result) => !result.replay).length,
      1,
      "exactly one concurrent confirmation may be the winner",
    );
    assert.equal(
      fulfilled.filter((result) => result.replay).length,
      7,
      "all other concurrent confirmations must replay",
    );
    assert.ok(fulfilled.every((result) => result.version.id === concurrencyPublished.version.id));

    const persistedConfirmations = await db
      .select()
      .from(agreementConfirmationsTable)
      .where(
        and(
          eq(agreementConfirmationsTable.agreementId, concurrencyCreated.agreement.id),
          eq(agreementConfirmationsTable.agreementVersionId, concurrencyPublished.version.id),
          eq(agreementConfirmationsTable.actorUserId, concurrencyFixture.clientId),
        ),
      );
    assert.equal(
      persistedConfirmations.length,
      1,
      "concurrency must persist exactly one actor confirmation",
    );

    const persistedEvidence = await db
      .select()
      .from(agreementEvidenceTable)
      .where(eq(agreementEvidenceTable.confirmationId, persistedConfirmations[0].id));
    assert.equal(persistedEvidence.length, 1, "concurrency must persist exactly one evidence row");
    console.log("- concurrent same-key confirmation/idempotency race: PASS");

    // 9. Evidence: one evidence record per successful confirmation and matching content hashes.
    const finalConfirmations = await db
      .select()
      .from(agreementConfirmationsTable)
      .where(eq(agreementConfirmationsTable.agreementId, created.agreement.id));
    assert.equal(finalConfirmations.length, 2, "exactly client + lawyer confirmations must exist");

    const finalEvidence = await db
      .select()
      .from(agreementEvidenceTable)
      .where(eq(agreementEvidenceTable.agreementId, created.agreement.id));
    assert.equal(finalEvidence.length, 2, "exactly one evidence row per confirmation must exist");
    assert.deepEqual(
      finalEvidence.map((row) => row.contentHash).sort(),
      finalConfirmations.map((row) => row.contentHash).sort(),
      "evidence hashes must match confirmation hashes",
    );
    assert.ok(finalEvidence.every((row) => row.metadata && typeof row.metadata === "object"));
    console.log("- evidence persistence + content-hash integrity: PASS");

    console.log("S02-04 AGREEMENT ELECTRONIC CONFIRMATION SERVICE BEHAVIORAL TEST PASSED");
  } finally {
    await cleanupFixture(concurrencyFixture).catch(() => undefined);
    await cleanupFixture(fixture).catch(() => undefined);
    await pool.end();
  }
}

await run();
