import { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, adminAuditLogsTable, termsVersionsTable } from "@workspace/db";
import { sha256 } from "../lib/platformTerms";

export async function publishTermsVersion(req: Request, res: Response) {
  const termsVersionId = String(req.params.id ?? "").trim();
  if (!termsVersionId) return res.status(400).json({ ok: false, error: "terms_version_id_required" });

  // requireAdmin is the authoritative middleware for this route and stores
  // the verified, DB-backed admin identity on req.admin.
  const adminUserId = req.admin?.userId;
  if (!adminUserId) return res.status(401).json({ ok: false, error: "unauthorized" });

  try {
    const published = await db.transaction(async (tx) => {
      const rows = await tx.select().from(termsVersionsTable).where(eq(termsVersionsTable.id, termsVersionId)).limit(1);
      const target = rows[0];
      if (!target) throw new Error("terms_version_not_found");
      if (target.status !== "draft") throw new Error("terms_version_not_publishable");
      if (sha256(target.content).toLowerCase() !== target.contentHash.toLowerCase()) throw new Error("terms_content_hash_mismatch");

      const now = new Date();
      const currentRows = await tx.select().from(termsVersionsTable).where(eq(termsVersionsTable.status, "published")).limit(1);
      const current = currentRows[0] ?? null;

      if (current) {
        await tx.update(termsVersionsTable)
          .set({ status: "superseded" })
          .where(and(eq(termsVersionsTable.id, current.id), eq(termsVersionsTable.status, "published")));
      }

      const [updated] = await tx.update(termsVersionsTable)
        .set({ status: "published", publishedAt: now, effectiveAt: target.effectiveAt ?? now })
        .where(and(eq(termsVersionsTable.id, target.id), eq(termsVersionsTable.status, "draft")))
        .returning();

      if (!updated) throw new Error("terms_publish_conflict");

      await tx.insert(adminAuditLogsTable).values({
        id: `audit_${randomUUID()}`,
        adminId: adminUserId,
        action: "TERMS_VERSION_PUBLISHED",
        entityType: "terms_version",
        entityId: updated.id,
        description: `Published Terms version ${updated.version}`,
        beforeData: { status: "draft" },
        afterData: { status: updated.status, version: updated.version, contentHash: updated.contentHash, publishedAt: updated.publishedAt },
      });

      return updated;
    });

    return res.status(200).json({
      ok: true,
      terms: {
        id: published.id,
        version: published.version,
        status: published.status,
        contentHash: published.contentHash,
        effectiveAt: published.effectiveAt,
        publishedAt: published.publishedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "terms_version_not_found") return res.status(404).json({ ok: false, error: "terms_version_not_found" });
    if (message === "terms_version_not_publishable") return res.status(409).json({ ok: false, error: "terms_version_not_publishable" });
    if (message === "terms_content_hash_mismatch") return res.status(409).json({ ok: false, error: "terms_content_hash_mismatch" });
    if (message === "terms_publish_conflict") return res.status(409).json({ ok: false, error: "terms_publish_conflict" });
    req.log.error(error, "publishTermsVersion failed");
    return res.status(503).json({ ok: false, error: "terms_publication_service_unavailable" });
  }
}
