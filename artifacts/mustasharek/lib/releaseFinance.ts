const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "";

type ReleaseRequestResponse = {
  ok: true;
  releaseRequest: { id: string; status: string; milestoneId: string };
};

type FinanceError = { ok: false; error: string };

function createIdempotencyKey(): string {
  const key = globalThis.crypto?.randomUUID?.();
  if (!key) throw new Error("idempotency_key_generation_unavailable");
  return key;
}

async function authorizedFetch(getAuthToken: () => Promise<string | null>, path: string, init?: RequestInit) {
  if (!API_BASE) throw new Error("api_unavailable");
  const token = await getAuthToken();
  if (!token) throw new Error("authentication_required");
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
}

export async function getReleaseRequestForMilestone(
  getAuthToken: () => Promise<string | null>,
  milestoneId: string,
): Promise<ReleaseRequestResponse | FinanceError> {
  const normalizedMilestoneId = milestoneId.trim();
  if (!normalizedMilestoneId) throw new Error("invalid_milestone_id");

  const response = await authorizedFetch(
    getAuthToken,
    `/representation-milestones/${encodeURIComponent(normalizedMilestoneId)}/release-request`,
  );
  const body = (await response.json().catch(() => ({ ok: false, error: "invalid_server_response" }))) as ReleaseRequestResponse | FinanceError;
  return response.ok ? body : body;
}

export async function releaseMilestone(
  getAuthToken: () => Promise<string | null>,
  releaseRequestId: string,
): Promise<Record<string, unknown> | FinanceError> {
  const normalizedRequestId = releaseRequestId.trim();
  if (!normalizedRequestId) throw new Error("invalid_release_request_id");

  const response = await authorizedFetch(
    getAuthToken,
    `/representation-release-requests/${encodeURIComponent(normalizedRequestId)}/release`,
    {
      method: "POST",
      headers: { "Idempotency-Key": createIdempotencyKey() },
    },
  );
  const body = (await response.json().catch(() => ({ ok: false, error: "invalid_server_response" }))) as Record<string, unknown> | FinanceError;
  return body;
}
