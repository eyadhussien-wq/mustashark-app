import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  agreementConfirmationsTable,
  agreementEvidenceTable,
  agreementVersionsTable,
  agreementsTable,
  representationQuotesTable,
} from "@workspace/db/schema";

type AgreementActor = "client" | "lawyer";

const hashContent = (content: string) => crypto.createHash("sha256").update(content, "utf8").digest("hex");

const assertActor = (
  agreement: typeof agreementsTable.$inferSelect,
  actorUserId: string,
  actorRole: AgreementActor,
) => {
  if (actorRole === "client" && agreement.clientId !== actorUserId) throw new Error("FORBIDDEN");
  if (actorRole === "lawyer" && agreement.lawyerId !== actorUserId) throw new Error("FORBIDDEN");
};

export const getAgreementById = async (
  agreementId: string,
  actorUserId: string,
  actorRole: AgreementActor,
) => {
  const [agreement] = await db
    .select()
    .from(agreementsTable)
    .where(eq(agreementsTable.id, agreementId))
    .limit(1);
  if (!agreement) throw new Error("NOT_FOUND");
  assertActor(agreement, actorUserId, actorRole);

  const versions = await db
    .select()
    .from(agreementVersionsTable)
    .where(eq(agreementVersionsTable.agreementId, agreementId))
    .orderBy(desc(agreementVersionsTable.version));

  const confirmations = await db
    .select()
    .from(agreementConfirmationsTable)
    .where(eq(agreementConfirmationsTable.agreementId, agreementId));

  const evidence = await db
    .select()
    .from(agreementEvidenceTable)
    .where(eq(agreementEvidenceTable.agreementId, agreementId));

  return { agreement, versions, confirmations, evidence };
};

export const createAgreement = async (input: {
  quoteId: string;
  content: string;
  actorUserId: string;
}) => {
  return db.transaction(async (tx) => {
    const [quote] = await tx
      .select()
      .from(representationQuotesTable)
      .where(eq(representationQuotesTable.id, input.quoteId))
      .limit(1);
    if (!quote) throw new Error("QUOTE_NOT_FOUND");
    if (quote.clientId !== input.actorUserId && quote.lawyerId !== input.actorUserId) {
      throw new Error("FORBIDDEN");
    }
    if (!["accepted", "funding", "active"].includes(quote.status)) {
      throw new Error("INVALID_QUOTE_STATE");
    }

    const [existing] = await tx
      .select()
      .from(agreementsTable)
      .where(eq(agreementsTable.quoteId, input.quoteId))
      .limit(1);
    if (existing) throw new Error("AGREEMENT_EXISTS");

    const agreementId = crypto.randomUUID();
    const versionId = crypto.randomUUID();
    const contentHash = hashContent(input.content);

    const [agreement] = await tx
      .insert(agreementsTable)
      .values({
        id: agreementId,
        quoteId: input.quoteId,
        clientId: quote.clientId,
        lawyerId: quote.lawyerId,
        status: "prepared",
        currentVersionId: null,
      })
      .returning();

    const [version] = await tx
      .insert(agreementVersionsTable)
      .values({
        id: versionId,
        agreementId,
        version: 1,
        status: "prepared",
        content: input.content,
        contentHash,
        createdBy: input.actorUserId,
      })
      .returning();

    const [updatedAgreement] = await tx
      .update(agreementsTable)
      .set({
        currentVersionId: version.id,
        updatedAt: new Date(),
      })
      .where(eq(agreementsTable.id, agreement.id))
      .returning();

    return { agreement: updatedAgreement, version };
  });
};

export const createAgreementVersion = async (input: {
  agreementId: string;
  content: string;
  actorUserId: string;
}) => {
  return db.transaction(async (tx) => {
    const [agreement] = await tx
      .select()
      .from(agreementsTable)
      .where(eq(agreementsTable.id, input.agreementId))
      .limit(1);
    if (!agreement) throw new Error("NOT_FOUND");
    assertActor(agreement, input.actorUserId, "lawyer");
    if (["cancelled", "expired"].includes(agreement.status)) {
      throw new Error("INVALID_AGREEMENT_STATE");
    }

    const [latest] = await tx
      .select()
      .from(agreementVersionsTable)
      .where(eq(agreementVersionsTable.agreementId, input.agreementId))
      .orderBy(desc(agreementVersionsTable.version))
      .limit(1);

    const nextVersion = (latest?.version ?? 0) + 1;
    if (latest) {
      await tx
        .update(agreementVersionsTable)
        .set({ status: "superseded" })
        .where(eq(agreementVersionsTable.id, latest.id));
    }

    const versionId = crypto.randomUUID();
    const contentHash = hashContent(input.content);
    const [version] = await tx
      .insert(agreementVersionsTable)
      .values({
        id: versionId,
        agreementId: input.agreementId,
        version: nextVersion,
        status: "prepared",
        content: input.content,
        contentHash,
        createdBy: input.actorUserId,
      })
      .returning();

    const [updatedAgreement] = await tx
      .update(agreementsTable)
      .set({
        currentVersionId: versionId,
        status: "prepared",
        confirmedAt: null,
        confirmedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(agreementsTable.id, input.agreementId))
      .returning();

    return { agreement: updatedAgreement, version };
  });
};

export const publishAgreementVersion = async (input: {
  agreementId: string;
  versionId: string;
  actorUserId: string;
}) => {
  return db.transaction(async (tx) => {
    const [agreement] = await tx
      .select()
      .from(agreementsTable)
      .where(eq(agreementsTable.id, input.agreementId))
      .limit(1);
    if (!agreement) throw new Error("NOT_FOUND");
    assertActor(agreement, input.actorUserId, "lawyer");
    if (agreement.currentVersionId !== input.versionId) throw new Error("VERSION_NOT_CURRENT");

    const [version] = await tx
      .select()
      .from(agreementVersionsTable)
      .where(
        and(
          eq(agreementVersionsTable.id, input.versionId),
          eq(agreementVersionsTable.agreementId, input.agreementId),
        ),
      )
      .limit(1);
    if (!version) throw new Error("VERSION_NOT_FOUND");
    if (version.status !== "prepared") throw new Error("VERSION_NOT_PUBLISHABLE");

    const publishedAt = new Date();
    const [updatedVersion] = await tx
      .update(agreementVersionsTable)
      .set({ status: "published", publishedAt })
      .where(eq(agreementVersionsTable.id, version.id))
      .returning();
    const [updatedAgreement] = await tx
      .update(agreementsTable)
      .set({
        status: "awaiting_confirmation",
        confirmedAt: null,
        confirmedBy: null,
        updatedAt: publishedAt,
      })
      .where(eq(agreementsTable.id, input.agreementId))
      .returning();

    return { agreement: updatedAgreement, version: updatedVersion };
  });
};

export const confirmAgreement = async (input: {
  agreementId: string;
  actorUserId: string;
  actorRole: AgreementActor;
  idempotencyKey: string;
}) => {
  return db.transaction(async (tx) => {
    const [agreement] = await tx
      .select()
      .from(agreementsTable)
      .where(eq(agreementsTable.id, input.agreementId))
      .limit(1);
    if (!agreement) throw new Error("NOT_FOUND");
    assertActor(agreement, input.actorUserId, input.actorRole);
    if (!agreement.currentVersionId) throw new Error("CURRENT_VERSION_MISSING");
    if (!["awaiting_confirmation", "confirmed"].includes(agreement.status)) {
      throw new Error("INVALID_AGREEMENT_STATE");
    }

    const [version] = await tx
      .select()
      .from(agreementVersionsTable)
      .where(eq(agreementVersionsTable.id, agreement.currentVersionId))
      .limit(1);
    if (!version || version.agreementId !== agreement.id) throw new Error("VERSION_NOT_FOUND");
    if (version.status !== "published") throw new Error("VERSION_NOT_CONFIRMABLE");

    const [existingByActor] = await tx
      .select()
      .from(agreementConfirmationsTable)
      .where(
        and(
          eq(agreementConfirmationsTable.agreementId, agreement.id),
          eq(agreementConfirmationsTable.agreementVersionId, version.id),
          eq(agreementConfirmationsTable.actorUserId, input.actorUserId),
        ),
      )
      .limit(1);
    if (existingByActor) {
      return { agreement, version, confirmation: existingByActor, replay: true };
    }

    const [existingByKey] = await tx
      .select()
      .from(agreementConfirmationsTable)
      .where(
        and(
          eq(agreementConfirmationsTable.agreementId, agreement.id),
          eq(agreementConfirmationsTable.idempotencyKey, input.idempotencyKey),
        ),
      )
      .limit(1);
    if (existingByKey) {
      return { agreement, version, confirmation: existingByKey, replay: true };
    }

    const confirmationId = crypto.randomUUID();
    const confirmedAt = new Date();
    const [confirmation] = await tx
      .insert(agreementConfirmationsTable)
      .values({
        id: confirmationId,
        agreementId: agreement.id,
        agreementVersionId: version.id,
        actorUserId: input.actorUserId,
        actorRole: input.actorRole,
        confirmedAt,
        contentHash: version.contentHash,
        idempotencyKey: input.idempotencyKey,
      })
      .returning();

    await tx.insert(agreementEvidenceTable).values({
      id: crypto.randomUUID(),
      confirmationId,
      agreementId: agreement.id,
      agreementVersionId: version.id,
      actorUserId: input.actorUserId,
      contentHash: version.contentHash,
      ipAddress: null,
      userAgent: null,
      metadata: { confirmationMethod: "electronic", actorRole: input.actorRole },
    });

    const confirmations = await tx
      .select({ actorRole: agreementConfirmationsTable.actorRole })
      .from(agreementConfirmationsTable)
      .where(
        and(
          eq(agreementConfirmationsTable.agreementId, agreement.id),
          eq(agreementConfirmationsTable.agreementVersionId, version.id),
        ),
      );
    const hasClient = confirmations.some((row) => row.actorRole === "client");
    const hasLawyer = confirmations.some((row) => row.actorRole === "lawyer");

    let updatedAgreement = agreement;
    if (hasClient && hasLawyer) {
      [updatedAgreement] = await tx
        .update(agreementsTable)
        .set({
          status: "confirmed",
          confirmedAt,
          confirmedBy: input.actorUserId,
          updatedAt: confirmedAt,
        })
        .where(eq(agreementsTable.id, agreement.id))
        .returning();
    }

    return { agreement: updatedAgreement, version, confirmation, replay: false };
  });
};
