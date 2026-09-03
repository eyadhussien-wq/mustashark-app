import { recordNeutralAuditEvent } from "./neutralAudit";

export type NeutralAuthorizationDeniedInput = {
  actorUserId: string;
  actorRole: "lawyer" | "client" | "admin";
  action: string;
  resourceType: "client" | "matter" | "document" | "schedule" | "message" | "export";
  resourceId: string;
  reasonCode: string;
  correlationId?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Minimal immutable denial audit entry for P3.1-I.
 * Never accepts credentials, JWTs, document contents, storage secrets, or
 * financial/marketplace state. The resourceId is the requested resource
 * identifier, not an expanded copy of protected resource data.
 */
export async function recordNeutralAuthorizationDenied(input: NeutralAuthorizationDeniedInput) {
  return recordNeutralAuditEvent({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    action: "AUTHORIZATION_DENIED",
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    outcome: "denied",
    reasonCode: input.reasonCode,
    correlationId: input.correlationId ?? null,
    metadata: input.metadata ?? null,
  });
}
