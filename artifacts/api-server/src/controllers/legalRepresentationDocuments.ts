import type { Request, Response } from "express";
import { agreementLegalDocumentsParamsSchema, legalDocumentIdParamsSchema, rejectLegalDocumentSchema, supersedeLegalDocumentSchema, uploadLegalDocumentSchema } from "@workspace/api-zod";
import { getLegalDocument, listLegalDocuments, rejectLegalDocument, startLegalDocumentReview, submitLegalDocument, supersedeLegalDocument, uploadLegalDocument, verifyLegalDocument } from "../services/legalRepresentationDocuments";

function actorFromRequest(req: Request) {
  const authUser = req.authUser;
  return authUser ? { userId: authUser.id, role: authUser.role } : null;
}

function serviceErrorResponse(res: Response, error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const mapped: Record<string, [number, string]> = {
    AGREEMENT_NOT_FOUND: [404, "agreement_not_found"], DOCUMENT_NOT_FOUND: [404, "document_not_found"],
    FORBIDDEN: [403, "forbidden"], INVALID_DOCUMENT_STATE: [409, "invalid_document_state"],
    DOCUMENT_STATE_CHANGED: [409, "document_state_changed"], CONTENT_HASH_MISSING: [409, "content_hash_missing"],
    REJECTION_REASON_REQUIRED: [400, "rejection_reason_required"],
  };
  const [status, errorCode] = mapped[code] ?? [500, "internal_server_error"];
  if (status === 500) console.error("Legal Representation Documents Controller Error:", error);
  return res.status(status).json({ ok: false, error: errorCode });
}

function parseRequest<T>(schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false } }, input: unknown, res: Response) {
  const parsed = schema.safeParse(input ?? {});
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "invalid_request" });
    return null;
  }
  return parsed.data;
}

export async function uploadLegalRepresentationDocument(req: Request, res: Response) {
  const actor = actorFromRequest(req); if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const data = parseRequest(uploadLegalDocumentSchema, req.body, res); if (!data) return;
  try { const { agreementId, ...documentInput } = data; const document = await uploadLegalDocument({ agreementId, actor, ...documentInput }); return res.status(201).json({ ok: true, document }); }
  catch (error) { return serviceErrorResponse(res, error); }
}

export async function submitLegalRepresentationDocument(req: Request, res: Response) {
  const actor = actorFromRequest(req); if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(legalDocumentIdParamsSchema, req.params, res); if (!params) return;
  try { const document = await submitLegalDocument({ documentId: params.id, actor }); return res.json({ ok: true, document }); }
  catch (error) { return serviceErrorResponse(res, error); }
}

export async function startLegalRepresentationDocumentReview(req: Request, res: Response) {
  const actor = actorFromRequest(req); if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(legalDocumentIdParamsSchema, req.params, res); if (!params) return;
  try { const document = await startLegalDocumentReview({ documentId: params.id, actor }); return res.json({ ok: true, document }); }
  catch (error) { return serviceErrorResponse(res, error); }
}

export async function verifyLegalRepresentationDocument(req: Request, res: Response) {
  const actor = actorFromRequest(req); if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(legalDocumentIdParamsSchema, req.params, res); if (!params) return;
  try { const document = await verifyLegalDocument({ documentId: params.id, actor }); return res.json({ ok: true, document }); }
  catch (error) { return serviceErrorResponse(res, error); }
}

export async function rejectLegalRepresentationDocument(req: Request, res: Response) {
  const actor = actorFromRequest(req); if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(legalDocumentIdParamsSchema, req.params, res); if (!params) return;
  const data = parseRequest(rejectLegalDocumentSchema, req.body, res); if (!data) return;
  try { const document = await rejectLegalDocument({ documentId: params.id, actor, ...data }); return res.json({ ok: true, document }); }
  catch (error) { return serviceErrorResponse(res, error); }
}

export async function supersedeLegalRepresentationDocument(req: Request, res: Response) {
  const actor = actorFromRequest(req); if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(legalDocumentIdParamsSchema, req.params, res); if (!params) return;
  const data = parseRequest(supersedeLegalDocumentSchema, req.body, res); if (!data) return;
  try { const result = await supersedeLegalDocument({ documentId: params.id, actor, ...data }); return res.status(201).json({ ok: true, ...result }); }
  catch (error) { return serviceErrorResponse(res, error); }
}

export async function getLegalRepresentationDocument(req: Request, res: Response) {
  const actor = actorFromRequest(req); if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(legalDocumentIdParamsSchema, req.params, res); if (!params) return;
  try { const document = await getLegalDocument({ documentId: params.id, actor }); return res.json({ ok: true, document }); }
  catch (error) { return serviceErrorResponse(res, error); }
}

export async function listLegalRepresentationDocuments(req: Request, res: Response) {
  const actor = actorFromRequest(req); if (!actor) return res.status(401).json({ ok: false, error: "unauthorized" });
  const params = parseRequest(agreementLegalDocumentsParamsSchema, req.params, res); if (!params) return;
  try { const documents = await listLegalDocuments({ agreementId: params.agreementId, actor }); return res.json({ ok: true, documents }); }
  catch (error) { return serviceErrorResponse(res, error); }
}
