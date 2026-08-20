import type { Request, Response } from "express";
import { createCaseFromAgreement, getCaseById, transitionCase } from "../services/cases";

const stringValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const createCaseController = async (req: Request, res: Response) => {
  try {
    const agreementId = stringValue(req.params.agreementId);
    if (!agreementId) return res.status(400).json({ ok: false, error: "agreement_id_is_required" });

    const result = await createCaseFromAgreement({
      agreementId,
      actorUserId: req.authUser!.id,
      actorRole: req.authUser!.role,
    });
    return res.status(result.created ? 201 : 200).json({ ok: true, ...result });
  } catch (error) {
    return caseError(res, error);
  }
};

export const getCaseController = async (req: Request, res: Response) => {
  try {
    const caseId = stringValue(req.params.id);
    if (!caseId) return res.status(400).json({ ok: false, error: "case_id_is_required" });

    const result = await getCaseById(caseId, req.authUser!.id, req.authUser!.role);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return caseError(res, error);
  }
};

export const transitionCaseController = async (req: Request, res: Response) => {
  try {
    const caseId = stringValue(req.params.id);
    const targetStatus = stringValue(req.body?.status);
    if (!caseId) return res.status(400).json({ ok: false, error: "case_id_is_required" });
    if (targetStatus !== "completed" && targetStatus !== "closed") {
      return res.status(400).json({ ok: false, error: "invalid_case_transition_target" });
    }

    const result = await transitionCase({
      caseId,
      targetStatus,
      actorUserId: req.authUser!.id,
      actorRole: req.authUser!.role,
    });
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return caseError(res, error);
  }
};

const caseError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  if (message.startsWith("DOCUMENT_PREREQUISITES_MISSING:")) {
    return res.status(409).json({
      ok: false,
      error: "document_prerequisites_missing",
      missing: message.split(":")[1]?.split(",").filter(Boolean) ?? [],
    });
  }

  const map: Record<string, [number, string]> = {
    FORBIDDEN: [403, "unauthorized_action"],
    AGREEMENT_NOT_FOUND: [404, "agreement_not_found"],
    AGREEMENT_NOT_CONFIRMED: [409, "agreement_not_confirmed"],
    LAWYER_NOT_FOUND: [404, "lawyer_not_found"],
    LAWYER_ROLE_REQUIRED: [409, "agreement_lawyer_role_invalid"],
    LAWYER_NOT_ACTIVE: [409, "lawyer_not_active"],
    CASE_NOT_FOUND: [404, "case_not_found"],
    CASE_CREATION_FAILED: [500, "case_creation_failed"],
    CASE_ALREADY_CLOSED: [409, "case_already_closed"],
    INVALID_CASE_TRANSITION: [409, "invalid_case_transition"],
    CASE_TRANSITION_CONFLICT: [409, "case_transition_conflict"],
  };
  const [status, code] = map[message] ?? [500, "internal_server_error"];
  if (status === 500) console.error("Case API Error:", error);
  return res.status(status).json({ ok: false, error: code });
};
