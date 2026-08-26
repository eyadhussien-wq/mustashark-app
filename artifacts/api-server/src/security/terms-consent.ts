import { z } from "zod/v4";
import type { Request } from "express";

export const termsConsentSchema = z.object({
  termsAccepted: z.literal(true),
  termsAcceptedAt: z.string().datetime({ offset: true }),
});

export function validateTermsConsent(termsAccepted: boolean | undefined, termsAcceptedAt: string | undefined): boolean {
  if (termsAccepted !== true || !termsAcceptedAt) return false;
  const parsed = termsConsentSchema.safeParse({ termsAccepted, termsAcceptedAt });
  if (!parsed.success) return false;
  const acceptedAt = new Date(termsAcceptedAt).getTime();
  return Number.isFinite(acceptedAt) && acceptedAt <= Date.now() + 60_000;
}

export function auditTermsConsent(
  req: Request,
  data: { flow: "social" | "local"; role: "client" | "lawyer"; email: string; termsAcceptedAt: string },
) {
  req.log.info({ auditEvent: "terms_consent", ...data }, "terms and conditions consent accepted");
}
