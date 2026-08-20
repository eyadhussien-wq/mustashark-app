import type { Request, Response } from "express";
import {
  confirmAgreement,
  createAgreement,
  createAgreementVersion,
  getAgreementById,
  publishAgreementVersion,
} from "../services/agreements";

type AgreementActor = "client" | "lawyer";

const actorRole = (req: Request): AgreementActor => {
  const role = req.authUser?.role;
  if (role !== "client" && role !== "lawyer") throw new Error("FORBIDDEN");
  return role;
};

const stringBody = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const createAgreementController = async (req: Request, res: Response) => {
  try {
    const quoteId = stringBody(req.body?.quoteId);
    const content = typeof req.body?.content === "string" ? req.body.content : "";
    if (!quoteId) return res.status(400).json({ ok: false, error: "quoteId_is_required" });
    if (!content.trim()) return res.status(400).json({ ok: false, error: "content_is_required" });

    const result = await createAgreement({ quoteId, content, actorUserId: req.authUser!.id });
    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    return agreementError(res, error);
  }
};

export const getAgreementController = async (req: Request, res: Response) => {
  try {
    const agreementId = stringBody(req.params.id);
    if (!agreementId) return res.status(400).json({ ok: false, error: "agreement_id_is_required" });
    const result = await getAgreementById(agreementId, req.authUser!.id, actorRole(req));
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return agreementError(res, error);
  }
};

export const createAgreementVersionController = async (req: Request, res: Response) => {
  try {
    const agreementId = stringBody(req.params.id);
    const content = typeof req.body?.content === "string" ? req.body.content : "";
    if (!agreementId) return res.status(400).json({ ok: false, error: "agreement_id_is_required" });
    if (!content.trim()) return res.status(400).json({ ok: false, error: "content_is_required" });

    const result = await createAgreementVersion({ agreementId, content, actorUserId: req.authUser!.id });
    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    return agreementError(res, error);
  }
};

export const publishAgreementVersionController = async (req: Request, res: Response) => {
  try {
    const agreementId = stringBody(req.params.id);
    const versionId = stringBody(req.params.versionId);
    if (!agreementId || !versionId) {
      return res.status(400).json({ ok: false, error: "agreement_and_version_ids_are_required" });
    }

    const result = await publishAgreementVersion({ agreementId, versionId, actorUserId: req.authUser!.id });
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return agreementError(res, error);
  }
};

export const confirmAgreementController = async (req: Request, res: Response) => {
  try {
    const agreementId = stringBody(req.params.id);
    const idempotencyKey = stringBody(req.header("Idempotency-Key"));
    if (!agreementId) return res.status(400).json({ ok: false, error: "agreement_id_is_required" });
    if (!idempotencyKey) return res.status(400).json({ ok: false, error: "idempotency_key_required" });

    const result = await confirmAgreement({
      agreementId,
      actorUserId: req.authUser!.id,
      actorRole: actorRole(req),
      idempotencyKey,
    });
    return res.status(result.replay ? 200 : 201).json({ ok: true, ...result });
  } catch (error) {
    return agreementError(res, error);
  }
};

const agreementError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  const map: Record<string, [number, string]> = {
    FORBIDDEN: [403, "unauthorized_action"],
    NOT_FOUND: [404, "agreement_not_found"],
    QUOTE_NOT_FOUND: [404, "quote_not_found"],
    AGREEMENT_EXISTS: [409, "agreement_already_exists_for_quote"],
    INVALID_QUOTE_STATE: [409, "quote_not_ready_for_agreement"],
    INVALID_AGREEMENT_STATE: [409, "invalid_agreement_state"],
    CURRENT_VERSION_MISSING: [409, "current_version_missing"],
    VERSION_NOT_FOUND: [404, "agreement_version_not_found"],
    VERSION_NOT_CURRENT: [409, "agreement_version_not_current"],
    VERSION_NOT_PUBLISHABLE: [409, "agreement_version_not_publishable"],
    VERSION_NOT_CONFIRMABLE: [409, "agreement_version_not_confirmable"],
  };
  const [status, code] = map[message] ?? [500, "internal_server_error"];
  if (status === 500) console.error("Agreement API Error:", error);
  return res.status(status).json({ ok: false, error: code });
};
