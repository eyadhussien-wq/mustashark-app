export interface LawyerAvailabilityWindow {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  active: boolean;
}

export interface LawyerAvailabilityReadResult {
  ok: boolean;
  availability: LawyerAvailabilityWindow[];
}

export function normalizeLawyerAvailability(payload: unknown): LawyerAvailabilityReadResult {
  if (!payload || typeof payload !== "object") {
    return { ok: false, availability: [] };
  }

  const candidate = payload as { ok?: unknown; availability?: unknown };
  if (candidate.ok !== true || !Array.isArray(candidate.availability)) {
    return { ok: false, availability: [] };
  }

  const availability = candidate.availability.filter((item): item is LawyerAvailabilityWindow => {
    if (!item || typeof item !== "object") return false;
    const value = item as Partial<LawyerAvailabilityWindow>;
    return (
      typeof value.id === "string" &&
      Number.isInteger(value.dayOfWeek) &&
      value.dayOfWeek >= 0 &&
      value.dayOfWeek <= 6 &&
      typeof value.startTime === "string" &&
      typeof value.endTime === "string" &&
      Number.isInteger(value.slotDurationMinutes) &&
      value.slotDurationMinutes >= 15 &&
      value.slotDurationMinutes <= 240 &&
      typeof value.active === "boolean"
    );
  });

  return { ok: true, availability };
}
