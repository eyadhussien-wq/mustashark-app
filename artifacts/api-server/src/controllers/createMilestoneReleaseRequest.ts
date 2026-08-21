import type { Request, Response } from "express";
import { createMilestoneReleaseRequest } from "../services/createMilestoneReleaseRequest";

export async function createMilestoneReleaseRequestController(req: Request, res: Response) {
  const clientId = req.authUser?.userId;
  if (!clientId) return res.status(401).json({ ok: false, error: "authentication_required" });
  if (req.authUser?.role !== "client") return res.status(403).json({ ok: false, error: "client_role_required" });

  const milestoneId = String(req.params.milestoneId ?? "").trim();
  const proofId = typeof req.body?.proofId === "string" ? req.body.proofId.trim() : "";

  if (!milestoneId) return res.status(400).json({ ok: false, error: "invalid_milestone_id" });
  if (!proofId) return res.status(400).json({ ok: false, error: "invalid_proof_id" });

  try {
    const result = await createMilestoneReleaseRequest(req, milestoneId, proofId, clientId);
    if ("error" in result) {
      const status =
        result.error === "milestone_not_found" || result.error === "proof_not_found" ? 404 :
        result.error === "forbidden" ? 403 : 409;
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
    console.error("Create Milestone Release Request Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}
