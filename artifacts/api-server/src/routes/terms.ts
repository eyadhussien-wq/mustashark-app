import { Router } from "express";
import { z } from "zod/v4";
import { db, termsConsentsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { getCurrentMandatoryTerms, recordTermsConsent } from "../lib/platformTerms";
import { requireAuth } from "../middlewares/requireAuth";

const termsRouter = Router();

termsRouter.get("/terms/current", async (_req, res) => {
  try {
    const current = await getCurrentMandatoryTerms();
    if (!current) return res.status(503).json({ ok: false, error: "terms_not_configured" });

    return res.json({
      ok: true,
      terms: {
        id: current.id,
        version: current.version,
        content: current.content,
        contentHash: current.contentHash,
        hashAlgorithm: current.hashAlgorithm,
        mandatory: current.mandatory,
        effectiveAt: current.effectiveAt,
        publishedAt: current.publishedAt,
      },
    });
  } catch {
    return res.status(503).json({ ok: false, error: "terms_service_unavailable" });
  }
});

const consentSchema = z.object({
  termsVersionId: z.string().min(1),
  contentHash: z.string().regex(/^[0-9a-fA-F]{64}$/),
  source: z.enum(["settings", "required_action"]).default("settings"),
});

termsRouter.post("/terms/consent", requireAuth, async (req, res) => {
  const parsed = consentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "validation_error", issues: parsed.error.issues });

  try {
    const consent = await recordTermsConsent({
      userId: req.authUser!.userId,
      termsVersionId: parsed.data.termsVersionId,
      contentHash: parsed.data.contentHash,
      source: parsed.data.source,
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.status(201).json({
      ok: true,
      consent: consent
        ? {
            id: consent.id,
            termsVersionId: consent.termsVersionId,
            version: consent.version,
            contentHash: consent.contentHash,
            consentedAt: consent.consentedAt,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "invalid_terms_version") return res.status(409).json({ ok: false, error: "invalid_terms_version" });
    if (message === "terms_content_hash_mismatch") return res.status(409).json({ ok: false, error: "terms_content_hash_mismatch" });
    return res.status(503).json({ ok: false, error: "terms_consent_service_unavailable" });
  }
});

// Privacy boundary: an authenticated user may inspect only their own consent
// evidence. There is deliberately no public or cross-user consent lookup.
termsRouter.get("/terms/consents/me", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: termsConsentsTable.id,
        termsVersionId: termsConsentsTable.termsVersionId,
        version: termsConsentsTable.version,
        contentHash: termsConsentsTable.contentHash,
        consentedAt: termsConsentsTable.consentedAt,
        source: termsConsentsTable.source,
      })
      .from(termsConsentsTable)
      .where(eq(termsConsentsTable.userId, req.authUser!.userId))
      .orderBy(desc(termsConsentsTable.consentedAt));

    return res.json({ ok: true, consents: rows });
  } catch {
    return res.status(503).json({ ok: false, error: "terms_consent_service_unavailable" });
  }
});

export default termsRouter;
