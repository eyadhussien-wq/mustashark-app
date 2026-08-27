import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type LawyerIdentityReadDto = {
  id: string; name: string; email: string; phone: string | null;
  country: "qatar" | "jordan" | null; role: "lawyer";
  accountStatus: "pending" | "active" | "suspended" | "terminated" | "rejected" | "blocked";
  specialization: string | null; litigationTier: string; bio: string | null;
  hourlyRate: number | null; rating: number | null; reviewsCount: number;
  verification: { status: "pending" | "approved" | "rejected"; licenseNumber: string | null; barAssociation: string | null; reviewedAt: string | null; rejectionReason: string | null } | null;
};

type State = { identity: LawyerIdentityReadDto | null; isLoading: boolean; error: string | null };
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";

function isIdentity(value: unknown): value is LawyerIdentityReadDto {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.role === "lawyer" && typeof v.id === "string" && typeof v.name === "string" && typeof v.email === "string" && typeof v.litigationTier === "string" && typeof v.reviewsCount === "number";
}

export function useLawyerIdentity(): State & { refresh: () => Promise<void> } {
  const { user, getAuthToken } = useAuth();
  const [state, setState] = useState<State>({ identity: null, isLoading: false, error: null });

  const refresh = useCallback(async () => {
    if (user?.role !== "lawyer") { setState({ identity: null, isLoading: false, error: null }); return; }
    if (!API_BASE) { setState({ identity: null, isLoading: false, error: "api_not_configured" }); return; }
    const token = await getAuthToken();
    if (!token) { setState({ identity: null, isLoading: false, error: "session_missing" }); return; }
    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE}/profile/lawyer-identity`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => null) as { ok?: boolean; identity?: unknown; error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? `identity_request_failed_${response.status}`);
      if (!body?.ok || !isIdentity(body.identity)) throw new Error("invalid_lawyer_identity_contract");
      setState({ identity: body.identity, isLoading: false, error: null });
    } catch (error) {
      setState({ identity: null, isLoading: false, error: error instanceof Error ? error.message : "identity_request_failed" });
    }
  }, [getAuthToken, user?.role]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { ...state, refresh };
}
