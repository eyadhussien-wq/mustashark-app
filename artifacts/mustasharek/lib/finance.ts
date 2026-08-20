const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "";

export type FundMilestoneResponse = {
  ok: true;
  milestone: unknown;
  escrowAccount: unknown;
  transaction: unknown;
};

export type FundMilestoneError = {
  ok: false;
  error: string;
};

function createIdempotencyKey(): string {
  const key = globalThis.crypto?.randomUUID?.();
  if (!key) throw new Error("idempotency_key_generation_unavailable");
  return key;
}

export async function fundMilestone(
  getAuthToken: () => Promise<string | null>,
  milestoneId: string,
): Promise<FundMilestoneResponse | FundMilestoneError> {
  if (!API_BASE) throw new Error("api_unavailable");
  const token = await getAuthToken();
  if (!token) throw new Error("authentication_required");

  const normalizedMilestoneId = milestoneId.trim();
  if (!normalizedMilestoneId) throw new Error("invalid_milestone_id");

  const response = await fetch(
    `${API_BASE}/representation-milestones/${encodeURIComponent(normalizedMilestoneId)}/fund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": createIdempotencyKey(),
      },
    },
  );

  const body = (await response.json().catch(() => ({
    ok: false,
    error: "invalid_server_response",
  }))) as FundMilestoneResponse | FundMilestoneError;

  if (!response.ok) return body;
  return body;
}
