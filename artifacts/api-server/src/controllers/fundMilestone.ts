import type { Request, Response } from "express";
import { fundMilestone } from "../services/fundMilestone";

function mapError(error: unknown): { status: number; code: string } | null {
  if (!(error instanceof Error)) return null;
  switch (error.message) {
    case "IDEMPOTENCY_KEY_REQUIRED": return { status: 400, code: "idempotency_key_required" };
    case "IDEMPOTENCY_REQUEST_MISMATCH": return { status: 409, code: "idempotency_request_mismatch" };
    case "IDEMPOTENCY_REQUEST_IN_PROGRESS": return { status: 409, code: "idempotency_request_in_progress" };
    case "IDEMPOTENCY_CLAIM_FAILED": return { status: 409, code: "idempotency_claim_failed" };
    case "ESCROW_TRANSACTION_CREATE_FAILED": return { status: 500, code: "escrow_transaction_create_failed" };
    case "ESCROW_ACCOUNT_UPDATE_FAILED": return { status: 500, code: "escrow_account_update_failed" };
    case "MILESTONE_FUNDING_TRANSITION_FAILED": return { status: 409, code: "milestone_funding_transition_failed" };
    default: return null;
  }
}

export async function fundMilestoneController(req: Request, res: Response) {
  const clientId = req.authUser?.userId;
  if (!clientId) return res.status(401).json({ ok: false, error: "authentication_required" });
  if (req.authUser?.role !== "client") return res.status(403).json({ ok: false, error: "client_role_required" });

  const milestoneId = String(req.params.milestoneId ?? "").trim();
  if (!milestoneId) return res.status(400).json({ ok: false, error: "invalid_milestone_id" });

  try {
    const result = await fundMilestone(req, milestoneId, clientId);
    if ("error" in result) {
      const status = result.error === "milestone_not_found" ? 404 : result.error === "forbidden" ? 403 : 409;
      return res.status(status).json({ ok: false, error: result.error });
    }
    return res.status(result.status).json(result.body);
  } catch (error) {
    const mapped = mapError(error);
    if (mapped) return res.status(mapped.status).json({ ok: false, error: mapped.code });
    console.error("Fund Milestone Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}
