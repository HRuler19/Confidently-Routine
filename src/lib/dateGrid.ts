// Pure calendar-grid math for the custom DatePicker, kept separate from
// the component so the layout logic is unit testable without touching
// the DOM. Grid is Monday-first, matching the Monday-first week grouping
// already used elsewhere in the app (see My Routine's week view).
import { pad, daysInMonth } from "./dates";

export interface MonthGridCell {
  date: string; // YYYY-MM-DD
  day: number;
  inMonth: boolean;
}

/** Monday-first day-of-week index: Monday = 0 ... Sunday = 6. */
function mondayFirstDow(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * Builds a full-rectangle Monday-first grid (a multiple of 7 cells,
 * 5 or 6 rows depending on the month) for `month` (1-12) of `year`,
 * padded with the trailing days of the previous month and the leading
 * days of the next month so every row is complete.
 */
export function buildMonthGrid(year: number, month: number): MonthGridCell[] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const leadingCount = mondayFirstDow(firstOfMonth);
  const totalDays = daysInMonth(year, month);
  const totalCells = Math.ceil((leadingCount + totalDays) / 7) * 7;

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonthDays = daysInMonth(prevYear, prevMonth);

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const cells: MonthGridCell[] = [];

  for (let i = leadingCount - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    cells.push({ date: `${prevYear}-${pad(prevMonth)}-${pad(day)}`, day, inMonth: false });
  }

  for (let day = 1; day <= totalDays; day++) {
    cells.push({ date: `${year}-${pad(month)}-${pad(day)}`, day, inMonth: true });
  }

  let trailingDay = 1;
  while (cells.length < totalCells) {
    cells.push({ date: `${nextYear}-${pad(nextMonth)}-${pad(trailingDay)}`, day: trailingDay, inMonth: false });
    trailingDay++;
  }

  return cells;
}

/** Rotates a Sunday-first weekday array (as stored in translations.ts)
    into Monday-first order for display. */
export function toMondayFirst<T>(sundayFirst: T[]): T[] {
  return [...sundayFirst.slice(1), sundayFirst[0]];
}

/** Adds `delta` months to a year/month pair, wrapping the year. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const zeroBased = month - 1 + delta;
  const y = year + Math.floor(zeroBased / 12);
  const m = ((zeroBased % 12) + 12) % 12;
  return { year: y, month: m + 1 };
}
