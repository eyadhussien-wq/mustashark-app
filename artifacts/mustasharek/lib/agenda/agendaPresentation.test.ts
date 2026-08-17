import { describe, expect, it } from "vitest";
import { formatAgendaTime, formatDateKey, toAgendaReadModel } from "./agendaPresentation";
import type { AgendaItem } from "./agendaTypes";

const item = (startsAtUtc: string): AgendaItem => ({
  bookingId: startsAtUtc,
  subject: "Fixture consultation",
  type: "video",
  status: "SCHEDULED",
  startsAtUtc,
  displayTimezone: "UTC",
  lawyerId: "lawyer-1",
  clientId: "client-1",
  reminderState: "none",
});

describe("P1-A agenda presentation", () => {
  it("preserves a UTC instant while presenting it in the requested timezone", () => {
    const instant = "2026-01-15T12:30:00.000Z";
    expect(formatAgendaTime(instant, "UTC")).toBe("12:30");
    expect(formatAgendaTime(instant, "Asia/Amman")).toBe("15:30");
  });

  it("handles a DST transition without mutating the UTC instant", () => {
    const before = "2026-03-29T00:30:00.000Z";
    const after = "2026-03-29T01:30:00.000Z";
    expect(formatAgendaTime(before, "Europe/London")).toBe("00:30");
    expect(formatAgendaTime(after, "Europe/London")).toBe("02:30");
  });

  it("groups an instant by the user's local calendar day across midnight", () => {
    const instant = "2026-01-01T23:30:00.000Z";
    expect(formatDateKey(instant, "Asia/Tokyo")).toBe("2026-01-02");
  });

  it("orders items by canonical UTC instant while grouping by local day", () => {
    const model = toAgendaReadModel(
      [item("2026-01-01T23:30:00.000Z"), item("2026-01-01T22:30:00.000Z")],
      "Asia/Tokyo",
    );
    expect(model.days).toHaveLength(1);
    expect(model.days[0].dateKey).toBe("2026-01-02");
    expect(model.days[0].items.map((entry) => entry.bookingId)).toEqual([
      "2026-01-01T22:30:00.000Z",
      "2026-01-01T23:30:00.000Z",
    ]);
  });
});
