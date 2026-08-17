import type { AgendaItem } from "../agenda/agendaTypes";

export type PresentationRole = "client" | "lawyer" | "admin" | "anonymous";

export type PresentationViewer = {
  userId: string | null;
  role: PresentationRole;
};

export type AgendaSecurityDecision = {
  canView: boolean;
  canOpen: boolean;
  canMutate: boolean;
  reason: "allowed" | "anonymous" | "not_owner" | "invalid_item";
};

/**
 * Presentation/API-contract boundary only.
 * This is deliberately not an authorization substitute for the API server.
 * It prevents accidental cross-account rendering and hides mutation affordances
 * before a request is ever constructed.
 */
export function authorizeAgendaPresentation(
  viewer: PresentationViewer,
  item: Pick<AgendaItem, "bookingId" | "clientId" | "lawyerId">,
): AgendaSecurityDecision {
  if (!item.bookingId || !item.clientId || !item.lawyerId) {
    return { canView: false, canOpen: false, canMutate: false, reason: "invalid_item" };
  }

  if (viewer.role === "anonymous" || !viewer.userId) {
    return { canView: false, canOpen: false, canMutate: false, reason: "anonymous" };
  }

  if (viewer.role === "admin") {
    return { canView: true, canOpen: true, canMutate: false, reason: "allowed" };
  }

  const isOwner =
    (viewer.role === "client" && viewer.userId === item.clientId) ||
    (viewer.role === "lawyer" && viewer.userId === item.lawyerId);

  return isOwner
    ? { canView: true, canOpen: true, canMutate: false, reason: "allowed" }
    : { canView: false, canOpen: false, canMutate: false, reason: "not_owner" };
}

export function canRenderSensitiveAgendaField(
  viewer: PresentationViewer,
  item: Pick<AgendaItem, "clientId" | "lawyerId">,
  field: "clientId" | "lawyerId",
): boolean {
  if (viewer.role === "admin") return true;
  if (!viewer.userId) return false;
  return viewer.role === "client"
    ? field === "clientId" && viewer.userId === item.clientId
    : field === "lawyerId" && viewer.userId === item.lawyerId;
}

export function safeTimeZone(timezone: string | null | undefined, fallback = "UTC"): string {
  if (!timezone) return fallback;
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return timezone;
  } catch {
    return fallback;
  }
}
