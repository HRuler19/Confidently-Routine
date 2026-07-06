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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateStr);
  dueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return t("routines.date_today");
  if (diffDays === 1) return t("routines.date_tomorrow");
  if (diffDays === -1) return t("routines.date_yesterday");
  if (diffDays < -1) return t("routines.date_days_ago", { n: Math.abs(diffDays) });
  if (diffDays > 1) return t("routines.date_in_days", { n: diffDays });
  return dateStr.split("-").reverse().join("/");
}
