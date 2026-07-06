import { describe, it, expect } from "vitest";
import { buildYearHeatmap } from "./heatmap";
import type { HabitEntry } from "./stores";

const HABIT = 1;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function entries(map: Record<string, HabitEntry>): Record<string, HabitEntry> {
  const out: Record<string, HabitEntry> = {};
  for (const [date, entry] of Object.entries(map)) out[`${HABIT}_${date}`] = entry;
  return out;
}

describe("buildYearHeatmap", () => {
  it("produces one cell per day of a full year", () => {
    const { cells } = buildYearHeatmap({}, HABIT, 2026, MONTHS);
    expect(cells).toHaveLength(365);
  });

  it("handles leap years", () => {
    const { cells } = buildYearHeatmap({}, HABIT, 2028, MONTHS);
    expect(cells).toHaveLength(366);
  });

  it("marks a done day with a non-zero level", () => {
    const { cells } = buildYearHeatmap(entries({ "2026-03-15": { type: "plus" } }), HABIT, 2026, MONTHS);
    const cell = cells.find((c) => c.date === "2026-03-15")!;
    expect(cell.level).toBeGreaterThan(0);
    expect(cell.missed).toBe(false);
  });

  it("flags an explicit miss without treating it as data-less", () => {
    const { cells } = buildYearHeatmap(entries({ "2026-03-15": { type: "x" } }), HABIT, 2026, MONTHS);
    const cell = cells.find((c) => c.date === "2026-03-15")!;
    expect(cell.level).toBe(0);
    expect(cell.missed).toBe(true);
  });

  it("scales level with count magnitude", () => {
    const { cells } = buildYearHeatmap(
      entries({ "2026-01-05": { type: "count", value: 1 }, "2026-01-06": { type: "count", value: 15 } }),
      HABIT,
      2026,
      MONTHS,
    );
    const low = cells.find((c) => c.date === "2026-01-05")!;
    const high = cells.find((c) => c.date === "2026-01-06")!;
    expect(high.level).toBeGreaterThan(low.level);
  });

  it("places Jan 1 in row 1..7 and increases columns across the year", () => {
    const { cells, weekCount } = buildYearHeatmap({}, HABIT, 2026, MONTHS);
    const jan1 = cells[0];
    const dec31 = cells[cells.length - 1];
    expect(jan1.col).toBe(1);
    expect(dec31.col).toBe(weekCount);
    expect(weekCount).toBeGreaterThanOrEqual(52);
  });

  it("emits exactly 12 month labels", () => {
    const { monthLabels } = buildYearHeatmap({}, HABIT, 2026, MONTHS);
    expect(monthLabels).toHaveLength(12);
    expect(monthLabels[0]).toEqual({ col: 1, label: "Jan" });
    expect(monthLabels[11].label).toBe("Dec");
  });

  it("only reads entries for the requested habit", () => {
    const mixed = { ...entries({ "2026-01-05": { type: "plus" } }), "999_2026-01-05": { type: "plus" as const } };
    const { cells } = buildYearHeatmap(mixed, HABIT, 2026, MONTHS);
    expect(cells.find((c) => c.date === "2026-01-05")!.level).toBeGreaterThan(0);
    const { cells: otherHabitCells } = buildYearHeatmap(mixed, 2, 2026, MONTHS);
    expect(otherHabitCells.find((c) => c.date === "2026-01-05")!.level).toBe(0);
  });
});
