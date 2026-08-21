import type { Request, Response } from "express";
import {
  createCaseHearing,
  listCaseHearings,
  transitionCaseHearing,
} from "../services/caseHearings";

const stringValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const dateValue = (value: unknown) => {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const createCaseHearingController = async (req: Request, res: Response) => {
  try {
    const caseId = stringValue(req.params.caseId);
    const hearingType = stringValue(req.body?.hearingType);
    const scheduledAt = dateValue(req.body?.scheduledAt);

    if (!caseId) return res.status(400).json({ ok: false, error: "case_id_is_required" });
    if (!hearingType) return res.status(400).json({ ok: false, error: "hearing_type_is_required" });
    if (!scheduledAt) return res.status(400).json({ ok: false, error: "invalid_scheduled_at" });

    const result = await createCaseHearing({
      caseId,
      hearingType,
      scheduledAt,
      courtName: req.body?.courtName,
      judgeName: req.body?.judgeName,
      notes: req.body?.notes,
      actorUserId: req.authUser!.id,
      actorRole: req.authUser!.role,
    });

    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    return hearingError(res, error);
  }
};

export const listCaseHearingsController = async (req: Request, res: Response) => {
  try {
    const caseId = stringValue(req.params.caseId);
    if (!caseId) return res.status(400).json({ ok: false, error: "case_id_is_required" });

    const result = await listCaseHearings({
      caseId,
      actorUserId: req.authUser!.id,
      actorRole: req.authUser!.role,
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return hearingError(res, error);
  }
};

export const transitionCaseHearingController = async (req: Request, res: Response) => {
  try {
    const caseId = stringValue(req.params.caseId);
    const hearingId = stringValue(req.params.hearingId);
    const targetStatus = stringValue(req.body?.status);

    if (!caseId) return res.status(400).json({ ok: false, error: "case_id_is_required" });
    if (!hearingId) return res.status(400).json({ ok: false, error: "hearing_id_is_required" });
    if (!["scheduled", "completed", "postponed", "cancelled"].includes(targetStatus)) {
      return res.status(400).json({ ok: false, error: "invalid_hearing_transition_target" });
    }

    const scheduledAt = req.body?.scheduledAt === undefined ? undefined : dateValue(req.body.scheduledAt);
    if (req.body?.scheduledAt !== undefined && !scheduledAt) {
      return res.status(400).json({ ok: false, error: "invalid_scheduled_at" });
    }

    const result = await transitionCaseHearing({
      caseId,
      hearingId,
      targetStatus: targetStatus as "scheduled" | "completed" | "postponed" | "cancelled",
      scheduledAt,
      outcome: req.body?.outcome,
      notes: req.body?.notes,
      actorUserId: req.authUser!.id,
      actorRole: req.authUser!.role,
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return hearingError(res, error);
  }
};

const hearingError = (res: Response, error: unknown) => {
  const map: Record<string, [number, string]> = {
    FORBIDDEN: [403, "unauthorized_action"],
    CASE_NOT_FOUND: [404, "case_not_found"],
    CASE_NOT_ACTIVE: [409, "case_not_active"],
    HEARING_NOT_FOUND: [404, "hearing_not_found"],
    HEARING_TYPE_REQUIRED: [400, "hearing_type_is_required"],
    INVALID_SCHEDULED_AT: [400, "invalid_scheduled_at"],
    HEARING_CREATION_FAILED: [500, "hearing_creation_failed"],
    INVALID_HEARING_TRANSITION: [409, "invalid_hearing_transition"],
    RESCHEDULED_AT_REQUIRED: [400, "rescheduled_at_is_required"],
    HEARING_TRANSITION_CONFLICT: [409, "hearing_transition_conflict"],
  };

  const message = error instanceof Error ? error.message : "";
  const [status, code] = map[message] ?? [500, "internal_server_error"];
  if (status === 500) console.error("Case Hearing API Error:", error);
  return res.status(status).json({ ok: false, error: code });
};
