import type { Request, Response } from "express";
import { transitionDispute, type DisputeTransitionAction } from "../services/disputes";

const RESOLUTION_ACTIONS = {
  client: "resolve_client",
  lawyer: "resolve_lawyer",
  split: "resolve_split",
} as const satisfies Record<string, DisputeTransitionAction>;

type Resolution = keyof typeof RESOLUTION_ACTIONS;

export async function resolveDisputeController(req: Request, res: Response) {
  const actor = req.authUser;
  if (!actor || actor.role !== "admin") {
    return res.status(403).json({ ok: false, error: "admin_required" });
  }

  const disputeId = String(req.params.disputeId ?? "").trim();
  const resolution = String(req.body?.resolution ?? "").trim() as Resolution;
  const resolutionNote = typeof req.body?.resolutionNote === "string" ? req.body.resolutionNote.trim() : "";

  if (!disputeId) return res.status(400).json({ ok: false, error: "invalid_dispute_id" });
  if (!(resolution in RESOLUTION_ACTIONS)) {
    return res.status(400).json({ ok: false, error: "invalid_resolution" });
  }
  if (!resolutionNote) {
    return res.status(400).json({ ok: false, error: "resolution_note_required" });
  }

  return runAdminTransition(
    req,
    res,
    disputeId,
    RESOLUTION_ACTIONS[resolution],
    resolutionNote,
  );
}

export async function closeDisputeController(req: Request, res: Response) {
  const actor = req.authUser;
  if (!actor || actor.role !== "admin") {
    return res.status(403).json({ ok: false, error: "admin_required" });
  }

  const disputeId = String(req.params.disputeId ?? "").trim();
  if (!disputeId) return res.status(400).json({ ok: false, error: "invalid_dispute_id" });

  return runAdminTransition(req, res, disputeId, "close");
}

async function runAdminTransition(
  req: Request,
  res: Response,
  disputeId: string,
  action: DisputeTransitionAction,
  resolutionNote?: string,
) {
  try {
    const result = await transitionDispute(
      req,
      disputeId,
      action,
      req.authUser!.id,
      "admin",
      resolutionNote,
    );

    if ("error" in result) {
      const status = result.error === "dispute_not_found" ? 404 : result.error === "forbidden" ? 403 : 409;
      return res.status(status).json({ ok: false, error: result.error });
    }

    return res.status(result.status).json(result.body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const map: Record<string, [number, string]> = {
      IDEMPOTENCY_KEY_REQUIRED: [400, "idempotency_key_required"],
      IDEMPOTENCY_REQUEST_MISMATCH: [409, "idempotency_request_mismatch"],
      IDEMPOTENCY_REQUEST_IN_PROGRESS: [409, "idempotency_request_in_progress"],
      DISPUTE_TRANSITION_CONFLICT: [409, "dispute_transition_conflict"],
    };
    const [status, code] = map[message] ?? [500, "internal_server_error"];
    if (status === 500) console.error("Admin Dispute Resolution Error:", error);
    return res.status(status).json({ ok: false, error: code });
  }
}
