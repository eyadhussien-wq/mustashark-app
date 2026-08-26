import crypto from "node:crypto";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  agreementsTable,
  caseMembershipsTable,
  casesTable,
  legalRepresentationDocumentsTable,
  lawyerVerificationsTable,
  representationAuditLogsTable,
  representationMilestonesTable,
  representationQuotesTable,
  usersTable,
} from "@workspace/db/schema";

const REQUIRED_DOCUMENT_TYPES = ["poa", "court_proof"] as const;
type CaseStatus = typeof casesTable.$inferSelect["status"];
type MilestoneStatus = typeof representationMilestonesTable.$inferSelect["status"];

const CASE_TERMINAL_STATES: CaseStatus[] = ["closed"];
const SETTLED_MILESTONE_STATUSES: MilestoneStatus[] = ["released", "cancelled"];

type CaseTransition = Extract<CaseStatus, "completed" | "closed">;

const assertCaseActor = (
  agreement: typeof agreementsTable.$inferSelect,
  actorUserId: string,
  actorRole: string,
) => {
  if (actorRole === "admin") return;
  if (actorRole === "client" && agreement.clientId === actorUserId) return;
  if (actorRole === "lawyer" && agreement.lawyerId === actorUserId) return;
  throw new Error("FORBIDDEN");
};

export const createCaseFromAgreement = async (input: {
  agreementId: string;
  actorUserId: string;
  actorRole: string;
}) => {
  return db.transaction(async (tx) => {
    const [agreement] = await tx
      .select()
      .from(agreementsTable)
      .where(eq(agreementsTable.id, input.agreementId))
      .limit(1);
    if (!agreement) throw new Error("AGREEMENT_NOT_FOUND");

    assertCaseActor(agreement, input.actorUserId, input.actorRole);
    if (agreement.status !== "confirmed") throw new Error("AGREEMENT_NOT_CONFIRMED");

    const [lawyer] = await tx
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, agreement.lawyerId))
      .limit(1);
    if (!lawyer) throw new Error("LAWYER_NOT_FOUND");
    if (lawyer.role !== "lawyer") throw new Error("LAWYER_ROLE_REQUIRED");
    if (lawyer.accountStatus !== "active") throw new Error("LAWYER_NOT_ACTIVE");

    const [verification] = await tx
      .select({ status: lawyerVerificationsTable.status })
      .from(lawyerVerificationsTable)
      .where(eq(lawyerVerificationsTable.userId, lawyer.id))
      .limit(1);
    if (!verification || verification.status !== "approved") {
      throw new Error("LAWYER_PROFESSIONAL_VERIFICATION_REQUIRED");
    }

    const [existingCase] = await tx
      .select()
      .from(casesTable)
      .where(eq(casesTable.agreementId, agreement.id))
      .limit(1);
    if (existingCase) return { case: existingCase, created: false };

    const documents = await tx
      .select({ id: legalRepresentationDocumentsTable.id, documentType: legalRepresentationDocumentsTable.documentType })
      .from(legalRepresentationDocumentsTable)
      .where(
        and(
          eq(legalRepresentationDocumentsTable.agreementId, agreement.id),
          eq(legalRepresentationDocumentsTable.status, "verified"),
          inArray(legalRepresentationDocumentsTable.documentType, [...REQUIRED_DOCUMENT_TYPES]),
        ),
      );

    const verifiedTypes = new Set(documents.map((document) => document.documentType));
    const missingPrerequisites = REQUIRED_DOCUMENT_TYPES.filter((type) => !verifiedTypes.has(type));
    if (missingPrerequisites.length > 0) {
      throw new Error(`DOCUMENT_PREREQUISITES_MISSING:${missingPrerequisites.join(",")}`);
    }

    const caseId = `case_${crypto.randomUUID()}`;
    const [createdCase] = await tx
      .insert(casesTable)
      .values({
        id: caseId,
        agreementId: agreement.id,
        clientId: agreement.clientId,
        lawyerId: agreement.lawyerId,
        status: "active",
      })
      .returning();

    if (!createdCase) throw new Error("CASE_CREATION_FAILED");

    await tx.insert(caseMembershipsTable).values([
      {
        id: `membership_${crypto.randomUUID()}`,
        caseId,
        userId: agreement.clientId,
        role: "client",
        status: "active",
      },
      {
        id: `membership_${crypto.randomUUID()}`,
        caseId,
        userId: agreement.lawyerId,
        role: "lawyer",
        status: "active",
      },
    ]);

    await tx
      .update(legalRepresentationDocumentsTable)
      .set({ caseId, updatedAt: new Date() })
      .where(
        and(
          eq(legalRepresentationDocumentsTable.agreementId, agreement.id),
          eq(legalRepresentationDocumentsTable.status, "verified"),
          inArray(legalRepresentationDocumentsTable.documentType, [...REQUIRED_DOCUMENT_TYPES]),
        ),
      );

    await tx.insert(representationAuditLogsTable).values({
      id: `audit_${crypto.randomUUID()}`,
      caseId,
      agreementId: agreement.id,
      actorUserId: input.actorUserId,
      action: "case.created",
      entityType: "case",
      entityId: caseId,
      metadata: { fromStatus: null, toStatus: "active" },
    });

    return { case: createdCase, created: true };
  });
};

export const getCaseById = async (caseId: string, actorUserId: string, actorRole: string) => {
  const [caseRecord] = await db
    .select()
    .from(casesTable)
    .where(eq(casesTable.id, caseId))
    .limit(1);
  if (!caseRecord) throw new Error("CASE_NOT_FOUND");

  if (actorRole !== "admin" && caseRecord.clientId !== actorUserId && caseRecord.lawyerId !== actorUserId) {
    const [membership] = await db
      .select({ id: caseMembershipsTable.id })
      .from(caseMembershipsTable)
      .where(
        and(
          eq(caseMembershipsTable.caseId, caseId),
          eq(caseMembershipsTable.userId, actorUserId),
          eq(caseMembershipsTable.status, "active"),
        ),
      )
      .limit(1);
    if (!membership) throw new Error("FORBIDDEN");
  }

  const [agreementContext] = await db
    .select({
      id: agreementsTable.id,
      status: agreementsTable.status,
      quoteId: representationQuotesTable.id,
      quoteTitle: representationQuotesTable.title,
      quoteDescription: representationQuotesTable.description,
      quoteTotalAmount: representationQuotesTable.totalAmount,
      quoteCurrency: representationQuotesTable.currency,
      quoteStatus: representationQuotesTable.status,
      quoteFundingMode: representationQuotesTable.fundingMode,
    })
    .from(agreementsTable)
    .innerJoin(representationQuotesTable, eq(representationQuotesTable.id, agreementsTable.quoteId))
    .where(eq(agreementsTable.id, caseRecord.agreementId))
    .limit(1);

  if (!agreementContext) throw new Error("AGREEMENT_NOT_FOUND");

  const milestones = await db
    .select({
      id: representationMilestonesTable.id,
      title: representationMilestonesTable.title,
      stage: representationMilestonesTable.stage,
      percentage: representationMilestonesTable.percentage,
      amount: representationMilestonesTable.amount,
      status: representationMilestonesTable.status,
    })
    .from(representationMilestonesTable)
    .where(eq(representationMilestonesTable.quoteId, agreementContext.quoteId));

  return {
    case: {
      ...caseRecord,
      agreement: {
        id: agreementContext.id,
        status: agreementContext.status,
        quote: {
          id: agreementContext.quoteId,
          title: agreementContext.quoteTitle,
          description: agreementContext.quoteDescription,
          totalAmount: agreementContext.quoteTotalAmount,
          currency: agreementContext.quoteCurrency,
          status: agreementContext.quoteStatus,
          fundingMode: agreementContext.quoteFundingMode,
        },
        milestones,
      },
      milestones,
    },
  };
};

export const transitionCase = async (input: {
  caseId: string;
  targetStatus: CaseTransition;
  actorUserId: string;
  actorRole: string;
}) => {
  return db.transaction(async (tx) => {
    const [caseRecord] = await tx
      .select()
      .from(casesTable)
      .where(eq(casesTable.id, input.caseId))
      .limit(1)
      .for("update");
    if (!caseRecord) throw new Error("CASE_NOT_FOUND");
    if (CASE_TERMINAL_STATES.includes(caseRecord.status)) {
      throw new Error("CASE_ALREADY_CLOSED");
    }

    if (input.targetStatus === "completed") {
      if (input.actorRole !== "admin" && !(input.actorRole === "lawyer" && caseRecord.lawyerId === input.actorUserId)) {
        throw new Error("FORBIDDEN");
      }
    }

    if (input.targetStatus === "closed" && input.actorRole !== "admin") {
      throw new Error("FORBIDDEN");
    }

    if (input.targetStatus === "completed" && caseRecord.status !== "active") {
      throw new Error("INVALID_CASE_TRANSITION");
    }
    if (input.targetStatus === "closed" && caseRecord.status !== "completed") {
      throw new Error("INVALID_CASE_TRANSITION");
    }

    const unsettledMilestones = await tx
      .select({ id: representationMilestonesTable.id, status: representationMilestonesTable.status })
      .from(representationMilestonesTable)
      .innerJoin(agreementsTable, eq(agreementsTable.quoteId, representationMilestonesTable.quoteId))
      .where(
        and(
          eq(agreementsTable.id, caseRecord.agreementId),
          notInArray(representationMilestonesTable.status, SETTLED_MILESTONE_STATUSES),
        ),
      )
      .for("update");

    if (unsettledMilestones.length > 0) {
      throw new Error(
        `CASE_FINANCIAL_CLOSURE_BLOCKED:${unsettledMilestones
          .map((milestone) => `${milestone.id}:${milestone.status}`)
          .join(",")}`,
      );
    }

    const now = new Date();
    const [updatedCase] = await tx
      .update(casesTable)
      .set({
        status: input.targetStatus,
        completedAt: input.targetStatus === "completed" ? now : caseRecord.completedAt,
        closedAt: input.targetStatus === "closed" ? now : caseRecord.closedAt,
        updatedAt: now,
      })
      .where(and(eq(casesTable.id, input.caseId), eq(casesTable.status, caseRecord.status)))
      .returning();

    if (!updatedCase) throw new Error("CASE_TRANSITION_CONFLICT");

    await tx.insert(representationAuditLogsTable).values({
      id: `audit_${crypto.randomUUID()}`,
      caseId: caseRecord.id,
      agreementId: caseRecord.agreementId,
      actorUserId: input.actorUserId,
      action: `case.status.${input.targetStatus}`,
      entityType: "case",
      entityId: caseRecord.id,
      metadata: { fromStatus: caseRecord.status, toStatus: input.targetStatus },
    });

    return { case: updatedCase };
  });
};
