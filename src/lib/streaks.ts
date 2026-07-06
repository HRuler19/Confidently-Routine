// Pure habit-streak math, kept separate from the UI so it's easy to unit
// test: a "done" day is any entry that counts as a success (a check mark,
// or a count greater than zero).
import { toDateStr, daysBetween } from "./dates";
import type { HabitEntry } from "./stores";

export function isEntryDone(entry: HabitEntry | undefined): boolean {
  if (!entry) return false;
  if (entry.type === "plus") return true;
  if (entry.type === "count") return Number(entry.value) > 0;
  return false;
}

export function entryToValue(entry: HabitEntry | undefined): number {
  if (!entry) return 0;
  if (entry.type === "plus") return 1;
  if (entry.type === "count") return Number(entry.value) || 0;
  return 0;
}

export interface StreakInfo {
  /** Consecutive done-days ending today, or yesterday if today isn't
      logged yet (a still-pending today doesn't zero out the streak). */
  current: number;
  /** Longest consecutive done-day run ever recorded for this habit. */
  best: number;
}

/**
 * Computes current + best streaks for one habit from the flat
 * `${habitId}_${YYYY-MM-DD}` entries map (see stores.ts).
 */
export function computeStreak(
  entries: Record<string, HabitEntry>,
  habitId: number,
  today: Date = new Date(),
): StreakInfo {
  const prefix = `${habitId}_`;
  const doneDates = new Set<string>();
  for (const key in entries) {
    if (key.startsWith(prefix) && isEntryDone(entries[key])) {
      doneDates.add(key.slice(prefix.length));
    }
  }

  let best = 0;
  let run = 0;
  let prevDateStr: string | null = null;
  for (const dateStr of [...doneDates].sort()) {
    run = prevDateStr !== null && daysBetween(prevDateStr, dateStr) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prevDateStr = dateStr;
  }

  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  if (!doneDates.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let current = 0;
  while (doneDates.has(toDateStr(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, best };
}
