import type { Request, Response } from "express";
import { createMilestoneProof } from "../services/createMilestoneProof";

export async function createMilestoneProofController(req: Request, res: Response) {
  const lawyerId = req.authUser?.userId;
  if (!lawyerId) return res.status(401).json({ ok: false, error: "authentication_required" });
  if (req.authUser?.role !== "lawyer") return res.status(403).json({ ok: false, error: "lawyer_role_required" });

  const milestoneId = String(req.params.milestoneId ?? "").trim();
  const documentKey = typeof req.body?.documentKey === "string" ? req.body.documentKey : "";
  const proofType = typeof req.body?.proofType === "string" ? req.body.proofType : undefined;
  const note = typeof req.body?.note === "string" ? req.body.note : undefined;

  if (!milestoneId) return res.status(400).json({ ok: false, error: "invalid_milestone_id" });
  if (!documentKey.trim()) return res.status(400).json({ ok: false, error: "invalid_document_key" });

  try {
    const result = await createMilestoneProof(
      req,
      milestoneId,
      lawyerId,
      documentKey,
      proofType,
      note,
    );

    if ("error" in result) {
      const status =
        result.error === "milestone_not_found" ? 404 :
        result.error === "forbidden" ? 403 :
        result.error === "invalid_document_key" ? 400 :
        result.error === "milestone_not_proofable" ? 409 : 500;
      return res.status(status).json({ ok: false, error: result.error });
    }

    return res.status(result.status).json(result.body);
  } catch (error) {
    if (error instanceof Error && error.message === "IDEMPOTENCY_KEY_REQUIRED") {
      return res.status(400).json({ ok: false, error: "idempotency_key_required" });
    }
    if (error instanceof Error && error.message === "IDEMPOTENCY_REQUEST_MISMATCH") {
      return res.status(409).json({ ok: false, error: "idempotency_request_mismatch" });
    }
    if (error instanceof Error && error.message === "IDEMPOTENCY_REQUEST_IN_PROGRESS") {
      return res.status(409).json({ ok: false, error: "idempotency_request_in_progress" });
    }
    console.error("Create Milestone Proof Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}
