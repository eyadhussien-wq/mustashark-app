import type { Request, Response } from "express";
import { disputeMilestoneRelease } from "../services/disputeMilestoneRelease";

export async function disputeMilestoneReleaseController(req: Request, res: Response) {
  const clientId = req.authUser?.userId;
  if (!clientId) return res.status(401).json({ ok: false, error: "authentication_required" });
  if (req.authUser?.role !== "client") return res.status(403).json({ ok: false, error: "client_role_required" });

  const releaseRequestId = String(req.params.releaseRequestId ?? "").trim();
  const disputeReason = typeof req.body?.disputeReason === "string" ? req.body.disputeReason : "";

  if (!releaseRequestId) return res.status(400).json({ ok: false, error: "invalid_release_request_id" });
  if (!disputeReason.trim()) return res.status(400).json({ ok: false, error: "dispute_reason_required" });

  try {
    const result = await disputeMilestoneRelease(req, releaseRequestId, clientId, disputeReason);
    if ("error" in result) {
      const status =
        result.error === "release_request_not_found" ? 404 :
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
    console.error("Dispute Milestone Release Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}
