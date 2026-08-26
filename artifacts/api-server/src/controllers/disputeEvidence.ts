import type { Request, Response } from "express";
import { z } from "zod";
import { addDisputeEvidence, listDisputeEvidence, reviewDisputeEvidence, evidenceLimits } from "../services/disputeEvidence";

const addSchema = z.object({
  evidenceType: z.string().trim().min(1).max(evidenceLimits.MAX_TYPE),
  title: z.string().trim().min(1).max(evidenceLimits.MAX_TITLE),
  description: z.string().trim().max(evidenceLimits.MAX_DESCRIPTION).optional(),
  storageKey: z.string().trim().min(1).max(evidenceLimits.MAX_STORAGE_KEY),
  mimeType: z.string().trim().max(evidenceLimits.MAX_MIME).optional(),
  sha256: z.string().trim().regex(/^[a-fA-F0-9]{64}$/).optional(),
});

const reviewSchema = z.object({
  reviewStatus: z.enum(["accepted", "rejected"]),
  reviewNote: z.string().trim().max(evidenceLimits.MAX_DESCRIPTION).optional(),
});

export async function addDisputeEvidenceController(req: Request, res: Response) {
  const actor = req.authUser;
  if (!actor) return res.status(401).json({ ok: false, error: "authentication_required" });
  const disputeId = String(req.params.disputeId ?? "").trim();
  const parsed = addSchema.safeParse(req.body);
  if (!disputeId) return res.status(400).json({ ok: false, error: "invalid_dispute_id" });
  if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_evidence_input", details: parsed.error.flatten() });

  try {
    const result = await addDisputeEvidence(req, disputeId, actor.id, actor.role, parsed.data);
    if ("error" in result) {
      const status = result.error === "dispute_not_found" ? 404 : result.error === "forbidden" ? 403 : 409;
      return res.status(status).json({ ok: false, error: result.error });
    }
    return res.status(result.status).json(result.body);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("IDEMPOTENCY_")) return res.status(409).json({ ok: false, error: error.message.toLowerCase() });
    console.error("Add Dispute Evidence Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}

export async function listDisputeEvidenceController(req: Request, res: Response) {
  const actor = req.authUser;
  if (!actor) return res.status(401).json({ ok: false, error: "authentication_required" });
  try {
    const result = await listDisputeEvidence(String(req.params.disputeId ?? "").trim(), actor.id, actor.role);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "DISPUTE_NOT_FOUND") return res.status(404).json({ ok: false, error: "dispute_not_found" });
    if (message === "FORBIDDEN") return res.status(403).json({ ok: false, error: "forbidden" });
    console.error("List Dispute Evidence Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}

export async function reviewDisputeEvidenceController(req: Request, res: Response) {
  const actor = req.authUser;
  if (!actor) return res.status(401).json({ ok: false, error: "authentication_required" });
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_evidence_review", details: parsed.error.flatten() });
  try {
    const result = await reviewDisputeEvidence(req, String(req.params.evidenceId ?? "").trim(), actor.id, actor.role, parsed.data.reviewStatus, parsed.data.reviewNote);
    if ("error" in result) {
      const status = result.error === "admin_required" ? 403 : result.error === "evidence_not_found" ? 404 : 409;
      return res.status(status).json({ ok: false, error: result.error });
    }
    return res.status(result.status).json(result.body);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("IDEMPOTENCY_")) return res.status(409).json({ ok: false, error: error.message.toLowerCase() });
    console.error("Review Dispute Evidence Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}
