import type { AgendaItem, AgendaReadModel } from "./agendaTypes";

export function toAgendaReadModel(
  items: AgendaItem[],
  timezone: string,
): AgendaReadModel {
  const days = new Map<string, AgendaItem[]>();

  for (const item of items) {
    const dateKey = formatDateKey(item.startsAtUtc, timezone);
    const dayItems = days.get(dateKey) ?? [];
    dayItems.push(item);
    days.set(dateKey, dayItems);
  }

  return {
    timezone,
    days: [...days.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, dayItems]) => ({
        dateKey,
        timezone,
        items: [...dayItems].sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc)),
      })),
  };
}

export function formatDateKey(utcTimestamp: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(utcTimestamp));
}

export function formatAgendaTime(utcTimestamp: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(utcTimestamp));
}
