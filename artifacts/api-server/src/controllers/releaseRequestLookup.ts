import type { Request, Response } from "express";
import { getReleaseRequestForMilestone } from "../services/releaseRequestLookup";

export async function releaseRequestLookupController(req: Request, res: Response) {
  const clientId = req.authUser?.userId;
  if (!clientId) return res.status(401).json({ ok: false, error: "authentication_required" });
  if (req.authUser?.role !== "client") return res.status(403).json({ ok: false, error: "client_role_required" });

  const milestoneId = String(req.params.milestoneId ?? "").trim();
  if (!milestoneId) return res.status(400).json({ ok: false, error: "invalid_milestone_id" });

  try {
    const result = await getReleaseRequestForMilestone(milestoneId, clientId);
    if ("error" in result) {
      const status = result.error === "milestone_not_found" || result.error === "release_request_not_found" ? 404 : 403;
      return res.status(status).json({ ok: false, error: result.error });
    }
    return res.status(200).json({ ok: true, releaseRequest: result.releaseRequest });
  } catch (error) {
    console.error("Release Request Lookup Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}
