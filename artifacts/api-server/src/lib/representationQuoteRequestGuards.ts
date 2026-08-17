import type { Request } from "express";
import {
  claimIdempotency,
  type IdempotencyResult,
} from "./transactionalIdempotency";

export type RepresentationQuoteRequestValidationErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "CLIENT_ROLE_REQUIRED";

export class RepresentationQuoteRequestValidationError extends Error {
  constructor(public readonly code: RepresentationQuoteRequestValidationErrorCode) {
    super(code);
    this.name = "RepresentationQuoteRequestValidationError";
  }
}

/**
 * The client identity is always derived from requireAuth's session context.
 * A caller-supplied clientId must never become authoritative for this flow.
 */
export function requireAuthenticatedClientId(req: Request): string {
  const authUser = req.authUser;

  if (!authUser?.userId) {
    throw new RepresentationQuoteRequestValidationError("AUTHENTICATION_REQUIRED");
  }

  if (authUser.role !== "client") {
    throw new RepresentationQuoteRequestValidationError("CLIENT_ROLE_REQUIRED");
  }

  return authUser.userId;
}

/**
 * Central idempotency integration for the Request Quote creation transition.
 * The existing transactional helper remains the single source of truth for
 * request identity, replay, conflict, and in-progress protection.
 */
export function claimRepresentationQuoteRequestIdempotency(
  tx: unknown,
  req: Request,
  clientId: string,
): Promise<IdempotencyResult> {
  return claimIdempotency(tx, req, clientId);
}
