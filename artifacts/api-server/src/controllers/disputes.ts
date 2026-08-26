import type { Request, Response } from "express";
import { getDisputeById, transitionDispute, type DisputeTransitionAction } from "../services/disputes";

const ACTIONS: DisputeTransitionAction[] = ["submit_for_review", "resolve_client", "resolve_lawyer", "resolve_split", "close", "cancel"];

export async function getDisputeController(req: Request, res: Response) {
  const actor = req.authUser;
  if (!actor) return res.status(401).json({ ok: false, error: "authentication_required" });
  const disputeId = String(req.params.disputeId ?? "").trim();
  if (!disputeId) return res.status(400).json({ ok: false, error: "invalid_dispute_id" });

  try {
    const result = await getDisputeById(disputeId, actor.id, actor.role);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return disputeError(res, error);
  }
}

export async function transitionDisputeController(req: Request, res: Response) {
  const actor = req.authUser;
  if (!actor) return res.status(401).json({ ok: false, error: "authentication_required" });
  const disputeId = String(req.params.disputeId ?? "").trim();
  const action = String(req.body?.action ?? "").trim() as DisputeTransitionAction;
  const resolutionNote = typeof req.body?.resolutionNote === "string" ? req.body.resolutionNote : undefined;

  if (!disputeId) return res.status(400).json({ ok: false, error: "invalid_dispute_id" });
  if (!ACTIONS.includes(action)) return res.status(400).json({ ok: false, error: "invalid_dispute_action" });

  try {
    const result = await transitionDispute(req, disputeId, action, actor.id, actor.role, resolutionNote);
    if ("error" in result) {
      const status = result.error === "dispute_not_found" ? 404 : result.error === "forbidden" ? 403 : 409;
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
    return disputeError(res, error);
  }
}

function disputeError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const map: Record<string, [number, string]> = {
    DISPUTE_NOT_FOUND: [404, "dispute_not_found"],
    FORBIDDEN: [403, "forbidden"],
    DISPUTE_TRANSITION_CONFLICT: [409, "dispute_transition_conflict"],
  };
  const [status, code] = map[message] ?? [500, "internal_server_error"];
  if (status === 500) console.error("Dispute API Error:", error);
  return res.status(status).json({ ok: false, error: code });
}
