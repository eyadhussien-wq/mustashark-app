import type { AgendaDay, AgendaReadModel } from "./agendaTypes";

export type AgendaCalendarCell = {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  day: AgendaDay | null;
};

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function weekdayOfFirstDay(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

function addDays(dateKey: string, delta: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + delta));
  return date.toISOString().slice(0, 10);
}

export function buildCalendarCells(model: AgendaReadModel, monthKey: string): AgendaCalendarCell[] {
  const [year, monthNumber] = monthKey.split("-").map(Number);
  const month = monthNumber - 1;
  const firstWeekday = weekdayOfFirstDay(year, month);
  const totalDays = daysInMonth(year, month);
  const dayMap = new Map(model.days.map((day) => [day.dateKey, day]));
  const cells: AgendaCalendarCell[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    const dateKey = addDays(`${monthKey}-01`, index - firstWeekday);
    cells.push({ dateKey, dayNumber: Number(dateKey.slice(8, 10)), isCurrentMonth: false, day: dayMap.get(dateKey) ?? null });
  }

  for (let dayNumber = 1; dayNumber <= totalDays; dayNumber += 1) {
    const dateKey = `${monthKey}-${String(dayNumber).padStart(2, "0")}`;
    cells.push({ dateKey, dayNumber, isCurrentMonth: true, day: dayMap.get(dateKey) ?? null });
  }

  while (cells.length % 7 !== 0) {
    const dateKey = addDays(cells[cells.length - 1].dateKey, 1);
    cells.push({ dateKey, dayNumber: Number(dateKey.slice(8, 10)), isCurrentMonth: false, day: dayMap.get(dateKey) ?? null });
  }

  return cells;
}

export function agendaMonthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
