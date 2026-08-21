import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  agreementsTable,
  legalRepresentationDocumentsTable,
} from "@workspace/db/schema";

type DocumentActorRole = "client" | "lawyer" | "admin";
type LegalDocumentType = "poa" | "court_proof" | "expert_report";
type LegalDocumentMetadata = Record<string, unknown>;

type Actor = {
  userId: string;
  role: DocumentActorRole;
};

const hashContent = (content: string) =>
  crypto.createHash("sha256").update(content, "utf8").digest("hex");

const assertAgreementAccess = (
  agreement: typeof agreementsTable.$inferSelect,
  actor: Actor,
) => {
  if (actor.role === "admin") return;
  if (actor.role === "client" && agreement.clientId === actor.userId) return;
  if (actor.role === "lawyer" && agreement.lawyerId === actor.userId) return;
  throw new Error("FORBIDDEN");
};

const assertUploadPermission = (
  documentType: LegalDocumentType,
  actorRole: DocumentActorRole,
) => {
  if (actorRole === "admin") return;
  if (documentType === "poa" && actorRole === "client") return;
  if (
    (documentType === "court_proof" || documentType === "expert_report") &&
    actorRole === "lawyer"
  ) {
    return;
  }
  throw new Error("FORBIDDEN");
};

const getAgreement = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  agreementId: string,
) => {
  const [agreement] = await tx
    .select()
    .from(agreementsTable)
    .where(eq(agreementsTable.id, agreementId))
    .limit(1);
  if (!agreement) throw new Error("AGREEMENT_NOT_FOUND");
  return agreement;
};

const getDocument = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  documentId: string,
) => {
  const [document] = await tx
    .select()
    .from(legalRepresentationDocumentsTable)
    .where(eq(legalRepresentationDocumentsTable.id, documentId))
    .limit(1);
  if (!document) throw new Error("DOCUMENT_NOT_FOUND");
  return document;
};

export const uploadLegalDocument = async (input: {
  agreementId: string;
  actor: Actor;
  documentType: LegalDocumentType;
  fileName: string;
  mimeType?: string | null;
  storageKey: string;
  content: string;
  title: string;
  courtName?: string | null;
  caseNumberReference?: string | null;
  issuedAt?: Date | null;
  metadata?: LegalDocumentMetadata | null;
}) => {
  return db.transaction(async (tx) => {
    const agreement = await getAgreement(tx, input.agreementId);
    assertAgreementAccess(agreement, input.actor);
    assertUploadPermission(input.documentType, input.actor.role);

    const contentHash = hashContent(input.content);
    const id = crypto.randomUUID();

    const [document] = await tx
      .insert(legalRepresentationDocumentsTable)
      .values({
        id,
        agreementId: input.agreementId,
        caseId: null,
        documentType: input.documentType,
        status: "uploaded",
        uploadedBy: input.actor.userId,
        uploadedByRole: input.actor.role,
        fileName: input.fileName,
        mimeType: input.mimeType ?? null,
        storageKey: input.storageKey,
        contentHash,
        title: input.title,
        courtName: input.courtName ?? null,
        caseNumberReference: input.caseNumberReference ?? null,
        issuedAt: input.issuedAt ?? null,
        metadata: input.metadata ?? null,
      })
      .returning();

    return document;
  });
};

export const submitLegalDocument = async (input: {
  documentId: string;
  actor: Actor;
}) => {
  return db.transaction(async (tx) => {
    const document = await getDocument(tx, input.documentId);
    const agreement = await getAgreement(tx, document.agreementId);
    assertAgreementAccess(agreement, input.actor);

    if (document.uploadedBy !== input.actor.userId && input.actor.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    if (!["uploaded", "rejected"].includes(document.status)) {
      throw new Error("INVALID_DOCUMENT_STATE");
    }

    const submittedAt = new Date();
    const [updated] = await tx
      .update(legalRepresentationDocumentsTable)
      .set({
        status: "submitted",
        submittedAt,
        updatedAt: submittedAt,
      })
      .where(
        and(
          eq(legalRepresentationDocumentsTable.id, document.id),
          eq(legalRepresentationDocumentsTable.status, document.status),
        ),
      )
      .returning();

    if (!updated) throw new Error("DOCUMENT_STATE_CHANGED");
    return updated;
  });
};

export const startLegalDocumentReview = async (input: {
  documentId: string;
  actor: Actor;
}) => {
  return db.transaction(async (tx) => {
    const document = await getDocument(tx, input.documentId);
    const agreement = await getAgreement(tx, document.agreementId);
    assertAgreementAccess(agreement, input.actor);
    if (input.actor.role !== "lawyer" && input.actor.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    if (document.status !== "submitted") {
      throw new Error("INVALID_DOCUMENT_STATE");
    }

    const reviewStartedAt = new Date();
    const [updated] = await tx
      .update(legalRepresentationDocumentsTable)
      .set({
        status: "under_review",
        reviewStartedAt,
        updatedAt: reviewStartedAt,
      })
      .where(
        and(
          eq(legalRepresentationDocumentsTable.id, document.id),
          eq(legalRepresentationDocumentsTable.status, "submitted"),
        ),
      )
      .returning();

    if (!updated) throw new Error("DOCUMENT_STATE_CHANGED");
    return updated;
  });
};

export const verifyLegalDocument = async (input: {
  documentId: string;
  actor: Actor;
}) => {
  return db.transaction(async (tx) => {
    const document = await getDocument(tx, input.documentId);
    const agreement = await getAgreement(tx, document.agreementId);
    assertAgreementAccess(agreement, input.actor);
    if (input.actor.role !== "lawyer" && input.actor.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    if (document.status !== "under_review") {
      throw new Error("INVALID_DOCUMENT_STATE");
    }
    if (!document.contentHash) throw new Error("CONTENT_HASH_MISSING");

    const verifiedAt = new Date();
    const [updated] = await tx
      .update(legalRepresentationDocumentsTable)
      .set({
        status: "verified",
        verifiedAt,
        verifiedBy: input.actor.userId,
        updatedAt: verifiedAt,
      })
      .where(
        and(
          eq(legalRepresentationDocumentsTable.id, document.id),
          eq(legalRepresentationDocumentsTable.status, "under_review"),
        ),
      )
      .returning();

    if (!updated) throw new Error("DOCUMENT_STATE_CHANGED");
    return updated;
  });
};

export const rejectLegalDocument = async (input: {
  documentId: string;
  actor: Actor;
  rejectionReason: string;
}) => {
  return db.transaction(async (tx) => {
    const document = await getDocument(tx, input.documentId);
    const agreement = await getAgreement(tx, document.agreementId);
    assertAgreementAccess(agreement, input.actor);
    if (input.actor.role !== "lawyer" && input.actor.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    if (document.status !== "under_review") {
      throw new Error("INVALID_DOCUMENT_STATE");
    }
    if (!input.rejectionReason.trim()) {
      throw new Error("REJECTION_REASON_REQUIRED");
    }

    const rejectedAt = new Date();
    const [updated] = await tx
      .update(legalRepresentationDocumentsTable)
      .set({
        status: "rejected",
        rejectedAt,
        rejectionReason: input.rejectionReason.trim(),
        updatedAt: rejectedAt,
      })
      .where(
        and(
          eq(legalRepresentationDocumentsTable.id, document.id),
          eq(legalRepresentationDocumentsTable.status, "under_review"),
        ),
      )
      .returning();

    if (!updated) throw new Error("DOCUMENT_STATE_CHANGED");
    return updated;
  });
};

export const supersedeLegalDocument = async (input: {
  documentId: string;
  actor: Actor;
  fileName: string;
  mimeType?: string | null;
  storageKey: string;
  content: string;
  title: string;
  courtName?: string | null;
  caseNumberReference?: string | null;
  issuedAt?: Date | null;
  metadata?: LegalDocumentMetadata | null;
}) => {
  return db.transaction(async (tx) => {
    const previous = await getDocument(tx, input.documentId);
    const agreement = await getAgreement(tx, previous.agreementId);
    assertAgreementAccess(agreement, input.actor);
    if (input.actor.role !== "lawyer" && input.actor.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    if (previous.status !== "verified") {
      throw new Error("INVALID_DOCUMENT_STATE");
    }

    const contentHash = hashContent(input.content);
    const supersededAt = new Date();
    const newDocumentId = crypto.randomUUID();

    const [newDocument] = await tx
      .insert(legalRepresentationDocumentsTable)
      .values({
        id: newDocumentId,
        agreementId: previous.agreementId,
        caseId: previous.caseId,
        documentType: previous.documentType,
        status: "uploaded",
        uploadedBy: input.actor.userId,
        uploadedByRole: input.actor.role,
        fileName: input.fileName,
        mimeType: input.mimeType ?? null,
        storageKey: input.storageKey,
        contentHash,
        title: input.title,
        courtName: input.courtName ?? previous.courtName,
        caseNumberReference:
          input.caseNumberReference ?? previous.caseNumberReference,
        issuedAt: input.issuedAt ?? null,
        supersedesDocumentId: previous.id,
        metadata: input.metadata ?? previous.metadata,
      })
      .returning();

    const [updatedPrevious] = await tx
      .update(legalRepresentationDocumentsTable)
      .set({
        status: "superseded",
        supersededAt,
        updatedAt: supersededAt,
      })
      .where(
        and(
          eq(legalRepresentationDocumentsTable.id, previous.id),
          eq(legalRepresentationDocumentsTable.status, "verified"),
        ),
      )
      .returning();

    if (!updatedPrevious) throw new Error("DOCUMENT_STATE_CHANGED");
    return { previous: updatedPrevious, document: newDocument };
  });
};

export const getLegalDocument = async (input: {
  documentId: string;
  actor: Actor;
}) => {
  const [document] = await db
    .select()
    .from(legalRepresentationDocumentsTable)
    .where(eq(legalRepresentationDocumentsTable.id, input.documentId))
    .limit(1);
  if (!document) throw new Error("DOCUMENT_NOT_FOUND");

  const [agreement] = await db
    .select()
    .from(agreementsTable)
    .where(eq(agreementsTable.id, document.agreementId))
    .limit(1);
  if (!agreement) throw new Error("AGREEMENT_NOT_FOUND");
  assertAgreementAccess(agreement, input.actor);

  return document;
};

export const listLegalDocuments = async (input: {
  agreementId: string;
  actor: Actor;
}) => {
  const [agreement] = await db
    .select()
    .from(agreementsTable)
    .where(eq(agreementsTable.id, input.agreementId))
    .limit(1);
  if (!agreement) throw new Error("AGREEMENT_NOT_FOUND");
  assertAgreementAccess(agreement, input.actor);

  return db
    .select()
    .from(legalRepresentationDocumentsTable)
    .where(eq(legalRepresentationDocumentsTable.agreementId, input.agreementId))
    .orderBy(desc(legalRepresentationDocumentsTable.createdAt));
};
