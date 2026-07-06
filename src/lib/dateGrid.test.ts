import { describe, it, expect } from "vitest";
import { buildMonthGrid, toMondayFirst, shiftMonth } from "./dateGrid";

describe("buildMonthGrid", () => {
  it("returns a rectangular grid that is a multiple of 7", () => {
    const cells = buildMonthGrid(2026, 7);
    expect(cells.length % 7).toBe(0);
  });

  it("starts on a Monday-first boundary (July 2026 starts on a Wednesday)", () => {
    const cells = buildMonthGrid(2026, 7);
    // July 1 2026 is a Wednesday -> 2 leading padding days (Mon, Tue) from June.
    expect(cells[0].date).toBe("2026-06-29");
    expect(cells[0].inMonth).toBe(false);
    expect(cells[2].date).toBe("2026-07-01");
    expect(cells[2].inMonth).toBe(true);
  });

  it("includes every day of the month exactly once, marked inMonth", () => {
    const cells = buildMonthGrid(2026, 7);
    const inMonthDays = cells.filter((c) => c.inMonth).map((c) => c.day);
    expect(inMonthDays).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });

  it("pads trailing days from the next month", () => {
    const cells = buildMonthGrid(2026, 7);
    const last = cells[cells.length - 1];
    expect(last.inMonth).toBe(false);
    expect(last.date.startsWith("2026-08")).toBe(true);
  });

  it("handles a leap-year February", () => {
    const cells = buildMonthGrid(2028, 2);
    const inMonthDays = cells.filter((c) => c.inMonth);
    expect(inMonthDays).toHaveLength(29);
  });

  it("handles December -> January month wraparound for padding", () => {
    const cells = buildMonthGrid(2026, 12);
    const last = cells[cells.length - 1];
    expect(last.date.startsWith("2027-01")).toBe(true);
  });
});

describe("toMondayFirst", () => {
  it("rotates a Sunday-first array to Monday-first", () => {
    const sundayFirst = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    expect(toMondayFirst(sundayFirst)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });
});

describe("shiftMonth", () => {
  it("moves forward within the same year", () => {
    expect(shiftMonth(2026, 7, 1)).toEqual({ year: 2026, month: 8 });
  });

  it("wraps forward into the next year", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("wraps backward into the previous year", () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("handles multi-month jumps", () => {
    expect(shiftMonth(2026, 1, -13)).toEqual({ year: 2024, month: 12 });
  });
});
