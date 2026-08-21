import crypto from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  caseDecisionsTable,
  caseHearingsTable,
  caseMembershipsTable,
  casesTable,
} from "@workspace/db/schema";

type DecisionStatus = typeof caseDecisionsTable.$inferSelect["status"];

const assertCaseAccess = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  caseRecord: typeof casesTable.$inferSelect,
  actorUserId: string,
  actorRole: string,
) => {
  if (actorRole === "admin") return;
  if (caseRecord.clientId === actorUserId || caseRecord.lawyerId === actorUserId) return;

  const [membership] = await tx
    .select({ id: caseMembershipsTable.id })
    .from(caseMembershipsTable)
    .where(
      and(
        eq(caseMembershipsTable.caseId, caseRecord.id),
        eq(caseMembershipsTable.userId, actorUserId),
        eq(caseMembershipsTable.status, "active"),
      ),
    )
    .limit(1);

  if (!membership) throw new Error("FORBIDDEN");
};

const assertCaseWriteAccess = (
  caseRecord: typeof casesTable.$inferSelect,
  actorUserId: string,
  actorRole: string,
) => {
  if (actorRole === "admin") return;
  if (actorRole === "lawyer" && caseRecord.lawyerId === actorUserId) return;
  throw new Error("FORBIDDEN");
};

const assertDecisionDate = (decisionDate?: Date | null) => {
  if (decisionDate && Number.isNaN(decisionDate.getTime())) {
    throw new Error("INVALID_DECISION_DATE");
  }
};

export const createCaseDecision = async (input: {
  caseId: string;
  hearingId?: string | null;
  decisionType: string;
  title: string;
  decisionDate?: Date | null;
  judgeName?: string | null;
  summary?: string | null;
  outcome?: string | null;
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

    assertCaseWriteAccess(caseRecord, input.actorUserId, input.actorRole);
    if (caseRecord.status !== "active") throw new Error("CASE_NOT_ACTIVE");
    if (!input.decisionType.trim()) throw new Error("DECISION_TYPE_REQUIRED");
    if (!input.title.trim()) throw new Error("DECISION_TITLE_REQUIRED");
    assertDecisionDate(input.decisionDate);

    if (input.hearingId) {
      const [hearing] = await tx
        .select({ id: caseHearingsTable.id, caseId: caseHearingsTable.caseId })
        .from(caseHearingsTable)
        .where(
          and(
            eq(caseHearingsTable.id, input.hearingId),
            eq(caseHearingsTable.caseId, input.caseId),
          ),
        )
        .limit(1)
        .for("update");
      if (!hearing) throw new Error("HEARING_NOT_FOUND");
    }

    const [decision] = await tx
      .insert(caseDecisionsTable)
      .values({
        id: `decision_${crypto.randomUUID()}`,
        caseId: caseRecord.id,
        hearingId: input.hearingId ?? null,
        decisionType: input.decisionType.trim(),
        title: input.title.trim(),
        decisionDate: input.decisionDate ?? null,
        judgeName: input.judgeName?.trim() || null,
        summary: input.summary?.trim() || null,
        outcome: input.outcome?.trim() || null,
        status: "draft",
        createdBy: input.actorUserId,
      })
      .returning();

    if (!decision) throw new Error("DECISION_CREATION_FAILED");
    return { decision };
  });
};

export const listCaseDecisions = async (input: {
  caseId: string;
  actorUserId: string;
  actorRole: string;
}) => {
  const [caseRecord] = await db
    .select()
    .from(casesTable)
    .where(eq(casesTable.id, input.caseId))
    .limit(1);
  if (!caseRecord) throw new Error("CASE_NOT_FOUND");

  await db.transaction(async (tx) => {
    await assertCaseAccess(tx, caseRecord, input.actorUserId, input.actorRole);
  });

  const decisions = await db
    .select()
    .from(caseDecisionsTable)
    .where(eq(caseDecisionsTable.caseId, input.caseId))
    .orderBy(asc(caseDecisionsTable.decisionDate), asc(caseDecisionsTable.createdAt));

  return { decisions };
};

export const transitionCaseDecision = async (input: {
  caseId: string;
  decisionId: string;
  targetStatus: DecisionStatus;
  decisionDate?: Date | null;
  summary?: string | null;
  outcome?: string | null;
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

    assertCaseWriteAccess(caseRecord, input.actorUserId, input.actorRole);
    if (caseRecord.status !== "active") throw new Error("CASE_NOT_ACTIVE");

    const [decision] = await tx
      .select()
      .from(caseDecisionsTable)
      .where(
        and(
          eq(caseDecisionsTable.id, input.decisionId),
          eq(caseDecisionsTable.caseId, input.caseId),
        ),
      )
      .limit(1)
      .for("update");
    if (!decision) throw new Error("DECISION_NOT_FOUND");

    const allowed =
      (decision.status === "draft" && input.targetStatus === "issued") ||
      (decision.status === "issued" && input.targetStatus === "superseded");
    if (!allowed) throw new Error("INVALID_DECISION_TRANSITION");

    if (input.targetStatus === "issued" && !input.decisionDate && !decision.decisionDate) {
      throw new Error("DECISION_DATE_REQUIRED");
    }
    assertDecisionDate(input.decisionDate);

    const [updatedDecision] = await tx
      .update(caseDecisionsTable)
      .set({
        status: input.targetStatus,
        decisionDate: input.decisionDate ?? decision.decisionDate,
        summary: input.summary === undefined ? decision.summary : input.summary?.trim() || null,
        outcome: input.outcome === undefined ? decision.outcome : input.outcome?.trim() || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(caseDecisionsTable.id, decision.id),
          eq(caseDecisionsTable.caseId, caseRecord.id),
          eq(caseDecisionsTable.status, decision.status),
        ),
      )
      .returning();

    if (!updatedDecision) throw new Error("DECISION_TRANSITION_CONFLICT");
    return { decision: updatedDecision };
  });
};
