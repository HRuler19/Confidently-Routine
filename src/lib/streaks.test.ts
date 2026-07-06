import { describe, it, expect } from "vitest";
import { computeStreak, isEntryDone, entryToValue } from "./streaks";
import type { HabitEntry } from "./stores";

const HABIT = 1;
const TODAY = new Date("2026-07-06T12:00:00");

function entries(map: Record<string, HabitEntry>): Record<string, HabitEntry> {
  const out: Record<string, HabitEntry> = {};
  for (const [date, entry] of Object.entries(map)) out[`${HABIT}_${date}`] = entry;
  return out;
}

describe("isEntryDone / entryToValue", () => {
  it("treats plus as done, x as not done", () => {
    expect(isEntryDone({ type: "plus" })).toBe(true);
    expect(isEntryDone({ type: "x" })).toBe(false);
    expect(isEntryDone(undefined)).toBe(false);
  });

  it("treats a positive count as done, zero as not done", () => {
    expect(isEntryDone({ type: "count", value: 2 })).toBe(true);
    expect(isEntryDone({ type: "count", value: 0 })).toBe(false);
  });

  it("converts entries to numeric values", () => {
    expect(entryToValue({ type: "plus" })).toBe(1);
    expect(entryToValue({ type: "x" })).toBe(0);
    expect(entryToValue({ type: "count", value: 5 })).toBe(5);
  });
});

describe("computeStreak", () => {
  it("is zero/zero with no entries", () => {
    expect(computeStreak({}, HABIT, TODAY)).toEqual({ current: 0, best: 0 });
  });

  it("counts a current streak ending today", () => {
    const e = entries({
      "2026-07-04": { type: "plus" },
      "2026-07-05": { type: "plus" },
      "2026-07-06": { type: "plus" },
    });
    expect(computeStreak(e, HABIT, TODAY)).toEqual({ current: 3, best: 3 });
  });

  it("doesn't zero the streak just because today isn't logged yet", () => {
    const e = entries({
      "2026-07-04": { type: "plus" },
      "2026-07-05": { type: "plus" },
    });
    expect(computeStreak(e, HABIT, TODAY).current).toBe(2);
  });

  it("breaks the current streak on a miss", () => {
    const e = entries({
      "2026-07-03": { type: "plus" },
      "2026-07-04": { type: "x" },
      "2026-07-05": { type: "plus" },
      "2026-07-06": { type: "plus" },
    });
    expect(computeStreak(e, HABIT, TODAY).current).toBe(2);
  });

  it("tracks best separately from current", () => {
    const e = entries({
      "2026-06-01": { type: "plus" },
      "2026-06-02": { type: "plus" },
      "2026-06-03": { type: "plus" },
      "2026-06-04": { type: "plus" },
      "2026-06-05": { type: "plus" }, // best run of 5
      "2026-07-06": { type: "plus" }, // current run of 1
    });
    const result = computeStreak(e, HABIT, TODAY);
    expect(result.best).toBe(5);
    expect(result.current).toBe(1);
  });

  it("treats zero-value counts as a break", () => {
    const e = entries({
      "2026-07-05": { type: "count", value: 0 },
      "2026-07-06": { type: "plus" },
    });
    expect(computeStreak(e, HABIT, TODAY).current).toBe(1);
  });

  it("only counts entries for the requested habit", () => {
    const e = {
      ...entries({ "2026-07-06": { type: "plus" } }),
      "999_2026-07-06": { type: "plus" } as HabitEntry,
    };
    expect(computeStreak(e, HABIT, TODAY).current).toBe(1);
  });
});
