import type { Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { disputesTable } from "@workspace/db/schema";

export async function listAdminDisputesController(req: Request, res: Response) {
  const actor = req.authUser;
  if (!actor || actor.role !== "admin") {
    return res.status(403).json({ ok: false, error: "admin_required" });
  }

  const rawStatus = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const allowedStatuses = new Set([
    "open",
    "under_review",
    "resolved_client",
    "resolved_lawyer",
    "resolved_split",
    "closed",
    "cancelled",
  ]);
  if (rawStatus && !allowedStatuses.has(rawStatus)) {
    return res.status(400).json({ ok: false, error: "invalid_dispute_status" });
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const disputes = await db
    .select()
    .from(disputesTable)
    .where(rawStatus ? eq(disputesTable.status, rawStatus as typeof disputesTable.status.enumValues[number]) : undefined)
    .orderBy(desc(disputesTable.updatedAt))
    .limit(limit);

  return res.status(200).json({ ok: true, disputes, limit });
}
