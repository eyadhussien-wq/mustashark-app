import type { Request, Response } from "express";
import {
  agreementLegalDocumentsParamsSchema,
  legalDocumentIdParamsSchema,
  rejectLegalDocumentSchema,
  supersedeLegalDocumentSchema,
  uploadLegalDocumentSchema,
} from "@workspace/api-zod";
import {
  getLegalDocument,
  listLegalDocuments,
  rejectLegalDocument,
  startLegalDocumentReview,
  submitLegalDocument,
  supersedeLegalDocument,
  uploadLegalDocument,
  verifyLegalDocument,
} from "../services/legalRepresentationDocuments";

function actorFromRequest(req: Request) {
  const authUser = req.authUser;
  if (!authUser) return null;
  return { userId: authUser.id, role: authUser.role };
}

function serviceErrorResponse(res: Response, error: unknown) {
  const code = error instanceof Error ? error.message : "";
  switch (code) {
    case "AGREEMENT_NOT_FOUND":
      return res.status(404).json({ ok: false, error: "agreement_not_found" });
    case "DOCUMENT_NOT_FOUND":
      return res.status(404).json({ ok: false, error: "document_not_found" });
    case "FORBIDDEN":
      return res.status(403).json({ ok: false, error: "forbidden" });
    case "INVALID_DOCUMENT_STATE":
      return res.status(409).json({ ok: false, error: "invalid_document_state" });
    case "DOCUMENT_STATE_CHANGED":
      return res.status(409).json({ ok: false, error: "document_state_changed" });
    case "CONTENT_HASH_MISSING":
      return res.status(409).json({ ok: false, error: "content_hash_missing" });
    case "REJECTION_REASON_REQUIRED":
      return res.status(400).json({ ok: false, error: "rejection_reason_required" });
    default:
      console.error("Legal Representation Documents Controller Error:", error);
      return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}

function parseRequest<T>(schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false; error: unknown } }, input: unknown, res: Response) {
  const parsed = schema.safeParse(input ?? {});
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid_request" });
    return null;
  }
  return parsed.data;
}

export async function uploadLegalRepresentationDocument(req: Request, res: Response) {
  const actor = actorFromRequest(req);
  if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const data = parseRequest(uploadLegalDocumentSchema, req.body, res);
  if (!data) return;

  try {
    const { agreementId, ...documentInput } = data;
    const document = await uploadLegalDocument({ agreementId, actor, ...documentInput });
    return res.status(201).json({ ok: true, document });
  } catch (error) {
    return serviceErrorResponse(res, error);
  }
}

export async function submitLegalRepresentationDocument(req: Request, res: Response) {
  const actor = actorFromRequest(req);
  if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(legalDocumentIdParamsSchema, req.params, res);
  if (!params) return;

  try {
    const document = await submitLegalDocument({ documentId: params.id, actor });
    return res.json({ ok: true, document });
  } catch (error) {
    return serviceErrorResponse(res, error);
  }
}

export async function startLegalRepresentationDocumentReview(req: Request, res: Response) {
  const actor = actorFromRequest(req);
  if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(legalDocumentIdParamsSchema, req.params, res);
  if (!params) return;

  try {
    const document = await startLegalDocumentReview({ documentId: params.id, actor });
    return res.json({ ok: true, document });
  } catch (error) {
    return serviceErrorResponse(res, error);
  }
}

export async function verifyLegalRepresentationDocument(req: Request, res: Response) {
  const actor = actorFromRequest(req);
  if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(legalDocumentIdParamsSchema, req.params, res);
  if (!params) return;

  try {
    const document = await verifyLegalDocument({ documentId: params.id, actor });
    return res.json({ ok: true, document });
  } catch (error) {
    return serviceErrorResponse(res, error);
  }
}

export async function rejectLegalRepresentationDocument(req: Request, res: Response) {
  const actor = actorFromRequest(req);
  if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(legalDocumentIdParamsSchema, req.params, res);
  if (!params) return;
  const data = parseRequest(rejectLegalDocumentSchema, req.body, res);
  if (!data) return;

  try {
    const document = await rejectLegalDocument({ documentId: params.id, actor, ...data });
    return res.json({ ok: true, document });
  } catch (error) {
    return serviceErrorResponse(res, error);
  }
}

export async function supersedeLegalRepresentationDocument(req: Request, res: Response) {
  const actor = actorFromRequest(req);
  if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(legalDocumentIdParamsSchema, req.params, res);
  if (!params) return;
  const data = parseRequest(supersedeLegalDocumentSchema, req.body, res);
  if (!data) return;

  try {
    const result = await supersedeLegalDocument({ documentId: params.id, actor, ...data });
    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    return serviceErrorResponse(res, error);
  }
}

export async function getLegalRepresentationDocument(req: Request, res: Response) {
  const actor = actorFromRequest(req);
  if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(legalDocumentIdParamsSchema, req.params, res);
  if (!params) return;

  try {
    const document = await getLegalDocument({ documentId: params.id, actor });
    return res.json({ ok: true, document });
  } catch (error) {
    return serviceErrorResponse(res, error);
  }
}

export async function listLegalRepresentationDocuments(req: Request, res: Response) {
  const actor = actorFromRequest(req);
  if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(agreementLegalDocumentsParamsSchema, req.params, res);
  if (!params) return;

  try {
    const documents = await listLegalDocuments({ agreementId: params.agreementId, actor });
    return res.json({ ok: true, documents });
  } catch (error) {
    return serviceErrorResponse(res, error);
  }
}
