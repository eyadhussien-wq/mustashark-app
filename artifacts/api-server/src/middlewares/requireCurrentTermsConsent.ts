import { type NextFunction, type Request, type Response } from "express";
import { hasCurrentMandatoryTermsConsent } from "../lib/platformTerms";

/**
 * Server-authoritative Platform Terms gate.
 * Must run after requireAuth so the identity comes from the verified server
 * session, never from a client-supplied user id.
 */
export async function requireCurrentTermsConsent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  const userId = req.authUser?.userId;
  if (!userId) return res.status(401).json({ ok: false, error: "authentication_required" });

  try {
    const result = await hasCurrentMandatoryTermsConsent(userId);
    if (result.allowed) return next();

    if (result.reason === "terms_not_configured") {
      return res.status(503).json({ ok: false, error: "terms_not_configured" });
    }

    return res.status(403).json({
      ok: false,
      error: "terms_consent_required",
      termsVersionId: result.current?.id ?? null,
      termsVersion: result.current?.version ?? null,
      termsContentHash: result.current?.contentHash ?? null,
    });
  } catch (error) {
    req.log.error(error, "Platform Terms consent check failed");
    return res.status(503).json({ ok: false, error: "terms_consent_service_unavailable" });
  }
}
