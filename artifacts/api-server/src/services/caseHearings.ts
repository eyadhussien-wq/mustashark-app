import crypto from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  caseHearingsTable,
  caseMembershipsTable,
  casesTable,
} from "@workspace/db/schema";

type HearingStatus = typeof caseHearingsTable.$inferSelect["status"];
type HearingTransition = Exclude<HearingStatus, "scheduled"> | "scheduled";

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

export const createCaseHearing = async (input: {
  caseId: string;
  hearingType: string;
  scheduledAt: Date;
  courtName?: string | null;
  judgeName?: string | null;
  notes?: string | null;
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
    if (!input.hearingType.trim()) throw new Error("HEARING_TYPE_REQUIRED");
    if (Number.isNaN(input.scheduledAt.getTime())) throw new Error("INVALID_SCHEDULED_AT");

    const hearingId = `hearing_${crypto.randomUUID()}`;
    const [hearing] = await tx
      .insert(caseHearingsTable)
      .values({
        id: hearingId,
        caseId: caseRecord.id,
        hearingType: input.hearingType.trim(),
        scheduledAt: input.scheduledAt,
        courtName: input.courtName?.trim() || null,
        judgeName: input.judgeName?.trim() || null,
        notes: input.notes?.trim() || null,
        createdBy: input.actorUserId,
        status: "scheduled",
      })
      .returning();

    if (!hearing) throw new Error("HEARING_CREATION_FAILED");
    return { hearing };
  });
};

export const listCaseHearings = async (input: {
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

  const hearings = await db
    .select()
    .from(caseHearingsTable)
    .where(eq(caseHearingsTable.caseId, input.caseId))
    .orderBy(asc(caseHearingsTable.scheduledAt));

  return { hearings };
};

export const transitionCaseHearing = async (input: {
  caseId: string;
  hearingId: string;
  targetStatus: HearingTransition;
  scheduledAt?: Date | null;
  outcome?: string | null;
  notes?: string | null;
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

    const [hearing] = await tx
      .select()
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

    const allowed =
      (hearing.status === "scheduled" &&
        (input.targetStatus === "completed" ||
          input.targetStatus === "postponed" ||
          input.targetStatus === "cancelled")) ||
      (hearing.status === "postponed" &&
        (input.targetStatus === "scheduled" || input.targetStatus === "cancelled"));

    if (!allowed) throw new Error("INVALID_HEARING_TRANSITION");

    if (input.targetStatus === "scheduled" && !input.scheduledAt) {
      throw new Error("RESCHEDULED_AT_REQUIRED");
    }
    if (input.scheduledAt && Number.isNaN(input.scheduledAt.getTime())) {
      throw new Error("INVALID_SCHEDULED_AT");
    }

    const now = new Date();
    const [updatedHearing] = await tx
      .update(caseHearingsTable)
      .set({
        status: input.targetStatus,
        scheduledAt: input.scheduledAt ?? hearing.scheduledAt,
        outcome: input.outcome === undefined ? hearing.outcome : input.outcome?.trim() || null,
        notes: input.notes === undefined ? hearing.notes : input.notes?.trim() || null,
        updatedAt: now,
      })
      .where(
        and(
          eq(caseHearingsTable.id, hearing.id),
          eq(caseHearingsTable.caseId, caseRecord.id),
          eq(caseHearingsTable.status, hearing.status),
        ),
      )
      .returning();

    if (!updatedHearing) throw new Error("HEARING_TRANSITION_CONFLICT");
    return { hearing: updatedHearing };
  });
};
