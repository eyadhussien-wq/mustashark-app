import type { Request, Response } from "express";
import {
  createCaseDecision,
  listCaseDecisions,
  transitionCaseDecision,
} from "../services/caseDecisions";

const stringValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const dateValue = (value: unknown) => {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const createCaseDecisionController = async (req: Request, res: Response) => {
  try {
    const caseId = stringValue(req.params.caseId);
    const decisionType = stringValue(req.body?.decisionType);
    const title = stringValue(req.body?.title);
    const decisionDate = req.body?.decisionDate === undefined ? undefined : dateValue(req.body.decisionDate);

    if (!caseId) return res.status(400).json({ ok: false, error: "case_id_is_required" });
    if (!decisionType) return res.status(400).json({ ok: false, error: "decision_type_is_required" });
    if (!title) return res.status(400).json({ ok: false, error: "decision_title_is_required" });
    if (req.body?.decisionDate !== undefined && !decisionDate) {
      return res.status(400).json({ ok: false, error: "invalid_decision_date" });
    }

    const result = await createCaseDecision({
      caseId,
      hearingId: req.body?.hearingId ? stringValue(req.body.hearingId) : null,
      decisionType,
      title,
      decisionDate,
      judgeName: req.body?.judgeName,
      summary: req.body?.summary,
      outcome: req.body?.outcome,
      actorUserId: req.authUser!.id,
      actorRole: req.authUser!.role,
    });

    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    return decisionError(res, error);
  }
};

export const listCaseDecisionsController = async (req: Request, res: Response) => {
  try {
    const caseId = stringValue(req.params.caseId);
    if (!caseId) return res.status(400).json({ ok: false, error: "case_id_is_required" });

    const result = await listCaseDecisions({
      caseId,
      actorUserId: req.authUser!.id,
      actorRole: req.authUser!.role,
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return decisionError(res, error);
  }
};

export const transitionCaseDecisionController = async (req: Request, res: Response) => {
  try {
    const caseId = stringValue(req.params.caseId);
    const decisionId = stringValue(req.params.decisionId);
    const targetStatus = stringValue(req.body?.status);

    if (!caseId) return res.status(400).json({ ok: false, error: "case_id_is_required" });
    if (!decisionId) return res.status(400).json({ ok: false, error: "decision_id_is_required" });
    if (!["issued", "superseded"].includes(targetStatus)) {
      return res.status(400).json({ ok: false, error: "invalid_decision_transition_target" });
    }

    const decisionDate = req.body?.decisionDate === undefined
      ? undefined
      : dateValue(req.body.decisionDate);
    if (req.body?.decisionDate !== undefined && !decisionDate) {
      return res.status(400).json({ ok: false, error: "invalid_decision_date" });
    }

    const result = await transitionCaseDecision({
      caseId,
      decisionId,
      targetStatus: targetStatus as "issued" | "superseded",
      decisionDate,
      summary: req.body?.summary,
      outcome: req.body?.outcome,
      actorUserId: req.authUser!.id,
      actorRole: req.authUser!.role,
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return decisionError(res, error);
  }
};

const decisionError = (res: Response, error: unknown) => {
  const map: Record<string, [number, string]> = {
    FORBIDDEN: [403, "unauthorized_action"],
    CASE_NOT_FOUND: [404, "case_not_found"],
    CASE_NOT_ACTIVE: [409, "case_not_active"],
    HEARING_NOT_FOUND: [404, "hearing_not_found"],
    DECISION_NOT_FOUND: [404, "decision_not_found"],
    DECISION_TYPE_REQUIRED: [400, "decision_type_is_required"],
    DECISION_TITLE_REQUIRED: [400, "decision_title_is_required"],
    INVALID_DECISION_DATE: [400, "invalid_decision_date"],
    DECISION_CREATION_FAILED: [500, "decision_creation_failed"],
    INVALID_DECISION_TRANSITION: [409, "invalid_decision_transition"],
    DECISION_DATE_REQUIRED: [400, "decision_date_is_required"],
    DECISION_TRANSITION_CONFLICT: [409, "decision_transition_conflict"],
  };

  const message = error instanceof Error ? error.message : "";
  const [status, code] = map[message] ?? [500, "internal_server_error"];
  if (status === 500) console.error("Case Decision API Error:", error);
  return res.status(status).json({ ok: false, error: code });
};
