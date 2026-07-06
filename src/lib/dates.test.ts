import { describe, it, expect, beforeEach } from "vitest";
import { formatDisplayDate, dateKey, daysInMonth, pad, toDateStr, nextDueDate } from "./dates";
import { setLanguage } from "./i18n";

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

beforeEach(() => {
  localStorage.clear();
  setLanguage("en");
});

describe("formatDisplayDate", () => {
  it("labels today/tomorrow/yesterday", () => {
    expect(formatDisplayDate(offsetDate(0))).toBe("Today");
    expect(formatDisplayDate(offsetDate(1))).toBe("Tomorrow");
    expect(formatDisplayDate(offsetDate(-1))).toBe("Yesterday");
  });

  it("counts day distances in both directions", () => {
    expect(formatDisplayDate(offsetDate(5))).toContain("5");
    expect(formatDisplayDate(offsetDate(-3))).toContain("3");
  });

  it("localizes with the active language", () => {
    setLanguage("tr");
    const label = formatDisplayDate(offsetDate(0));
    expect(label).not.toBe("Today");
    expect(label.length).toBeGreaterThan(0);
  });
});

describe("calendar math", () => {
  it("pads and formats date keys", () => {
    expect(pad(3)).toBe("03");
    expect(dateKey(2026, 7, 6)).toBe("2026-07-06");
  });

  it("knows month lengths incl. leap years", () => {
    expect(daysInMonth(2026, 7)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
  });
});

describe("nextDueDate", () => {
  it("advances daily and weekly recurrences", () => {
    expect(nextDueDate("2026-07-06", "daily")).toBe("2026-07-07");
    expect(nextDueDate("2026-07-06", "weekly")).toBe("2026-07-13");
  });

  it("wraps daily/weekly across month and year boundaries", () => {
    expect(nextDueDate("2026-07-31", "daily")).toBe("2026-08-01");
    expect(nextDueDate("2026-12-28", "weekly")).toBe("2027-01-04");
  });

  it("advances monthly to the same day next month", () => {
    expect(nextDueDate("2026-07-06", "monthly")).toBe("2026-08-06");
    expect(nextDueDate("2026-12-15", "monthly")).toBe("2027-01-15");
  });

  it("clamps monthly recurrence to the target month's length", () => {
    expect(nextDueDate("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(nextDueDate("2028-01-31", "monthly")).toBe("2028-02-29");
  });
});
