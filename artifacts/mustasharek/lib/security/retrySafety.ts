export type RetryRequest = {
  actorId: string;
  operation: "create_booking" | "open_booking" | "confirm_booking" | "cancel_booking";
  resourceId: string;
  intent: string;
};

export type RetryDecision =
  | { kind: "new"; key: string }
  | { kind: "replay"; key: string }
  | { kind: "conflict"; key: string };

/**
 * Produces a stable request identity for presentation/API-contract retries.
 * The server remains authoritative and must enforce the same idempotency key.
 */
export function buildRetryKey(request: RetryRequest): string {
  const normalizedIntent = request.intent.trim().replace(/\s+/g, " ");
  return [request.actorId, request.operation, request.resourceId, normalizedIntent].join(":");
}

export function decideRetry(
  request: RetryRequest,
  previousKey: string | null,
): RetryDecision {
  const key = buildRetryKey(request);
  if (!previousKey) return { kind: "new", key };
  if (previousKey === key) return { kind: "replay", key };
  return { kind: "conflict", key };
}

export function isSafeRetryStatus(status: number): boolean {
  return status === 200 || status === 201 || status === 204 || status === 409;
}
