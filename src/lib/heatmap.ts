// Pure geometry for the GitHub-style year heatmap: lays a full calendar
// year out into Monday-first weeks so the component only has to render
// pre-computed cells.
import { pad } from "./dates";
import { isEntryDone, entryToValue } from "./streaks";
import type { HabitEntry } from "./stores";

export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  row: number; // 1-7, Monday = 1
  col: number; // 1-based week index within the year
  level: 0 | 1 | 2 | 3 | 4; // 0 = no data, 1-4 = increasing intensity
  missed: boolean; // explicitly logged as "x" with no done value
}

export interface MonthLabel {
  col: number;
  label: string;
}

const LEVEL_THRESHOLDS = [1, 3, 6, 10];

function levelFor(value: number): 1 | 2 | 3 | 4 {
  if (value >= LEVEL_THRESHOLDS[3]) return 4;
  if (value >= LEVEL_THRESHOLDS[2]) return 3;
  if (value >= LEVEL_THRESHOLDS[1]) return 2;
  return 1;
}

/** Monday-first row index: Monday = 1 ... Sunday = 7. */
function mondayFirstRow(jsDay: number): number {
  return ((jsDay + 6) % 7) + 1;
}

export function buildYearHeatmap(
  entries: Record<string, HabitEntry>,
  habitId: number,
  year: number,
  monthNamesShort: string[],
): { cells: HeatmapCell[]; monthLabels: MonthLabel[]; weekCount: number } {
  const prefix = `${habitId}_`;
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);

  let col = 1;
  let lastMonth = -1;
  const cells: HeatmapCell[] = [];
  const monthLabels: MonthLabel[] = [];

  for (const d = new Date(jan1); d <= dec31; d.setDate(d.getDate() + 1)) {
    const row = mondayFirstRow(d.getDay());
    if (row === 1 && d.getTime() !== jan1.getTime()) col++;

    if (d.getMonth() !== lastMonth) {
      monthLabels.push({ col, label: monthNamesShort[d.getMonth()] });
      lastMonth = d.getMonth();
    }

    const dateStr = `${year}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const entry = entries[`${prefix}${dateStr}`];
    const done = isEntryDone(entry);
    const missed = !!entry && !done && entry.type === "x";
    const level = done ? levelFor(entryToValue(entry)) : 0;

    cells.push({ date: dateStr, row, col, level, missed });
  }

  return { cells, monthLabels, weekCount: col };
}
