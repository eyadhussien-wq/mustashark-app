import { describe, expect, it } from "vitest";
import { buildCalendarCells } from "./agendaCalendar";
import type { AgendaReadModel } from "./agendaTypes";

const model = (timezone: string): AgendaReadModel => ({
  timezone,
  days: [
    {
      dateKey: "2026-01-02",
      timezone,
      items: [],
    },
  ],
});

describe("P1-B calendar presentation", () => {
  it("creates complete Sunday-first calendar rows", () => {
    const cells = buildCalendarCells(model("Asia/Amman"), "2026-01");
    expect(cells).toHaveLength(35);
    expect(cells[0].dateKey).toBe("2025-12-28");
    expect(cells[4].dateKey).toBe("2026-01-01");
    expect(cells.at(-1)?.dateKey).toBe("2026-01-31");
  });

  it("keeps a consultation on the local day supplied by the read model", () => {
    const cells = buildCalendarCells(model("Asia/Amman"), "2026-01");
    const cell = cells.find((entry) => entry.dateKey === "2026-01-02");
    expect(cell?.isCurrentMonth).toBe(true);
    expect(cell?.day?.timezone).toBe("Asia/Amman");
  });

  it("handles months that require six calendar rows", () => {
    const cells = buildCalendarCells(model("Europe/London"), "2026-08");
    expect(cells).toHaveLength(42);
    expect(cells[0].dateKey).toBe("2026-07-26");
    expect(cells.at(-1)?.dateKey).toBe("2026-09-05");
  });
});
