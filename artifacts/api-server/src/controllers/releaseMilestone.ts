import type { Request, Response } from "express";
import { releaseMilestone } from "../services/releaseMilestone";

function mapError(error: unknown): { status: number; code: string } | null {
  if (!(error instanceof Error)) return null;
  switch (error.message) {
    case "IDEMPOTENCY_KEY_REQUIRED": return { status: 400, code: "idempotency_key_required" };
    case "IDEMPOTENCY_REQUEST_MISMATCH": return { status: 409, code: "idempotency_request_mismatch" };
    case "IDEMPOTENCY_REQUEST_IN_PROGRESS": return { status: 409, code: "idempotency_request_in_progress" };
    case "IDEMPOTENCY_CLAIM_FAILED": return { status: 409, code: "idempotency_claim_failed" };
    case "ESCROW_RELEASE_TRANSACTION_FAILED": return { status: 500, code: "escrow_release_transaction_failed" };
    case "ESCROW_COMMISSION_TRANSACTION_FAILED": return { status: 500, code: "escrow_commission_transaction_failed" };
    case "ESCROW_RELEASE_BALANCE_FAILED": return { status: 409, code: "escrow_release_balance_failed" };
    case "MILESTONE_RELEASE_TRANSITION_FAILED": return { status: 409, code: "milestone_release_transition_failed" };
    case "LAWYER_WALLET_TRANSACTION_FAILED": return { status: 500, code: "lawyer_wallet_transaction_failed" };
    case "LAWYER_WALLET_UPDATE_FAILED": return { status: 500, code: "lawyer_wallet_update_failed" };
    case "RELEASE_REQUEST_UPDATE_FAILED": return { status: 500, code: "release_request_update_failed" };
    default: return null;
  }
}

export async function releaseMilestoneController(req: Request, res: Response) {
  const clientId = req.authUser?.userId;
  if (!clientId) return res.status(401).json({ ok: false, error: "authentication_required" });
  if (req.authUser?.role !== "client") return res.status(403).json({ ok: false, error: "client_role_required" });

  const releaseRequestId = String(req.params.releaseRequestId ?? "").trim();
  if (!releaseRequestId) return res.status(400).json({ ok: false, error: "invalid_release_request_id" });

  try {
    const result = await releaseMilestone(req, releaseRequestId, clientId);
    if ("error" in result) {
      const status = result.error === "release_request_not_found" ? 404 : result.error === "forbidden" ? 403 : 409;
      return res.status(status).json({ ok: false, error: result.error });
    }
    return res.status(result.status).json(result.body);
  } catch (error) {
    const mapped = mapError(error);
    if (mapped) return res.status(mapped.status).json({ ok: false, error: mapped.code });
    console.error("Release Milestone Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}
