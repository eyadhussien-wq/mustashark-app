import type { AgendaItem, AgendaReadModel } from "./agendaTypes";
import { safeTimeZone } from "../security/presentationSecurity";

export function toAgendaReadModel(
  items: AgendaItem[],
  timezone: string,
): AgendaReadModel {
  const displayTimezone = safeTimeZone(timezone);
  const days = new Map<string, AgendaItem[]>();

  for (const item of items) {
    const dateKey = formatDateKey(item.startsAtUtc, displayTimezone);
    const dayItems = days.get(dateKey) ?? [];
    dayItems.push(item);
    days.set(dateKey, dayItems);
  }

  return {
    timezone: displayTimezone,
    days: [...days.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, dayItems]) => ({
        dateKey,
        timezone: displayTimezone,
        items: [...dayItems].sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc)),
      })),
  };
}

export function formatDateKey(utcTimestamp: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimeZone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(utcTimestamp));
}

export function formatAgendaTime(utcTimestamp: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: safeTimeZone(timezone),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(utcTimestamp));
}
