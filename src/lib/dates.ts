// Date helpers shared by pages and unit tests.
import { t } from "./i18n";

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DD for a Date in LOCAL time (toISOString would shift the day
    for anyone east of UTC between local midnight and UTC midnight). */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Whole calendar days from `a` to `b` (both YYYY-MM-DD). Parses each
    date's year/month/day directly rather than through `new Date(dateStr)`
    - a bare "YYYY-MM-DD" string parses as UTC per spec, which lands on
    the wrong local calendar day for anyone west of UTC - and normalizes
    both to noon rather than midnight before diffing, so a DST transition
    between the two dates (23h/25h instead of 24h) can't shift the count. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const aNoon = new Date(ay, am - 1, ad, 12).getTime();
  const bNoon = new Date(by, bm - 1, bd, 12).getTime();
  return Math.round((bNoon - aNoon) / 86_400_000);
}

export type Recurrence = "daily" | "weekly" | "monthly";

/** The due date a recurring task's next instance should land on. Monthly
    clamps to the target month's actual length (Jan 31 -> Feb 28) instead
    of overflowing into the month after, like most calendar apps. */
export function nextDueDate(dateStr: string, recurrence: Recurrence): string {
  const [year, month, day] = dateStr.split("-").map(Number);

  if (recurrence === "daily") return toDateStr(new Date(year, month - 1, day + 1));
  if (recurrence === "weekly") return toDateStr(new Date(year, month - 1, day + 7));

  const nextMonthFirst = new Date(year, month, 1);
  const nextYear = nextMonthFirst.getFullYear();
  const nextMonth = nextMonthFirst.getMonth() + 1;
  const clampedDay = Math.min(day, daysInMonth(nextYear, nextMonth));
  return dateKey(nextYear, nextMonth, clampedDay);
}

/** Human-friendly relative due-date label ("Today", "In 3 days", …). */
export function formatDisplayDate(dateStr: string): string {
  const diffDays = daysBetween(todayStr(), dateStr);

  if (diffDays === 0) return t("routines.date_today");
  if (diffDays === 1) return t("routines.date_tomorrow");
  if (diffDays === -1) return t("routines.date_yesterday");
  if (diffDays < -1) return t("routines.date_days_ago", { n: Math.abs(diffDays) });
  if (diffDays > 1) return t("routines.date_in_days", { n: diffDays });
  return dateStr.split("-").reverse().join("/");
}

export type DateRange = "all" | "year" | "month";

/** Whether `dateValue` falls within the current year/month. Accepts either
    a bare "YYYY-MM-DD" string (e.g. a task's due date - parsed as Y/M/D
    components directly, never through `new Date(dateStr)`) or a numeric
    timestamp (e.g. a note's createdAt, where `new Date(number)` is already
    an exact instant and safe to convert to local time normally). */
export function isInRange(dateValue: string | number, range: DateRange): boolean {
  if (range === "all") return true;

  let year: number;
  let month: number; // 0-based, matching Date#getMonth()
  if (typeof dateValue === "string") {
    const [y, m] = dateValue.split("-").map(Number);
    if (!y || !m) return false;
    year = y;
    month = m - 1;
  } else {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return false;
    year = d.getFullYear();
    month = d.getMonth();
  }

  const now = new Date();
  if (range === "year") return year === now.getFullYear();
  return year === now.getFullYear() && month === now.getMonth();
}
