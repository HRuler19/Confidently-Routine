// Reactive persistence layer. Uses the exact same storage keys and object
// shapes as the vanilla app's core/storage/* stores, so existing user data
// keeps working after the SolidJS rewrite. Every collection is a Solid signal
// whose mutations write through to the storage backend (localStorage in the
// browser, SQLite in the Tauri desktop/mobile apps - see ./storage).
import { createSignal } from "solid-js";

import type { Recurrence } from "./dates";
import { backend } from "./storage";

// ── Shared JSON helpers (user/session auth only) ───────────────────────
// Auth stays on web storage even under SQLite: it's tiny, and the
// remember-me flow depends on sessionStorage's "clears when the app closes"
// semantics, which a database has no equivalent for.
function readJSON<T>(key: string, fallback: T, session = false): T {
  try {
    const raw = (session ? sessionStorage : localStorage).getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    console.error(`Storage error (${key}):`, e);
    return fallback;
  }
}

function writeJSON(key: string, value: unknown, session = false): void {
  try {
    (session ? sessionStorage : localStorage).setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Storage error (${key}):`, e);
  }
}

// ── Types (shapes match the data the vanilla app persisted) ───────────
export interface User {
  username: string;
  avatar: string;
  lastLogin?: string;
}

export interface Task {
  id: number;
  title: string;
  category: string; // display name, e.g. "Personal"
  priority: string; // "low" | "medium" | "high" | "hard"
  dueDate: string; // YYYY-MM-DD
  displayDate?: string;
  completed: boolean;
  recurrence?: Recurrence;
  /** Set once this task's next occurrence has been spawned, so toggling
      the checkbox off and back on doesn't spawn a duplicate. */
  recurrenceSpawned?: boolean;
}

export interface Note {
  id: number;
  content: string;
  category: string; // "study" | "work" | "personal" | "learning"
  date: string; // YYYY-MM-DD
  createdAt: number;
  pinned?: boolean;
}

export interface Habit {
  id: number;
  name: string;
  reminderTime?: string; // HH:MM, 24-hour - undefined means no reminder
}

/** Habit day cell: done ("plus") | missed ("x") | numeric count — per habit+date. */
export type HabitEntry =
  | { type: "plus" }
  | { type: "x" }
  | { type: "count"; value: number };

const KEYS = {
  USER: "confidently_user",
  REMEMBER: "confidently_remember",
  SESSION_USER: "confidently_session_user",
  TASKS: "confidently_tasks",
  NOTES: "confidently_notes",
  HABITS: "confidently_habits",
  HABIT_ENTRIES: "confidently_habit_entries",
  REMINDER_LOG: "confidently_reminder_log",
  SLEEP: "confidently_sleep",
} as const;

// ── User / auth ────────────────────────────────────────────────────────
function readUser(): User | null {
  const persisted = readJSON<User | null>(KEYS.USER, null);
  if (persisted) return persisted;
  return readJSON<User | null>(KEYS.SESSION_USER, null, true);
}

const [user, setUserSignal] = createSignal<User | null>(readUser());
export { user };

export function saveUser(userData: User, rememberMe: boolean) {
  if (rememberMe) {
    writeJSON(KEYS.USER, userData);
    localStorage.setItem(KEYS.REMEMBER, "true");
  } else {
    writeJSON(KEYS.SESSION_USER, userData, true);
    localStorage.setItem(KEYS.REMEMBER, "false");
  }
  setUserSignal(userData);
}

export function updateUser(updates: Partial<User>) {
  const current = user();
  if (!current) return;
  const next = { ...current, ...updates };
  // Write back to wherever the session currently lives.
  if (localStorage.getItem(KEYS.REMEMBER) === "true") {
    writeJSON(KEYS.USER, next);
  } else {
    writeJSON(KEYS.SESSION_USER, next, true);
  }
  setUserSignal(next);
}

export function logout() {
  localStorage.removeItem(KEYS.USER);
  sessionStorage.removeItem(KEYS.SESSION_USER);
  localStorage.removeItem(KEYS.REMEMBER);
  setUserSignal(null);
}

// ── Generic reactive collection helper ─────────────────────────────────
// Each collection lives in a signal (the synchronous source of truth the UI
// reads) and writes through to the storage backend on every mutation.
//
// On a synchronous backend (localStorage) the signal is seeded at module load,
// so nothing changes for the browser build. On SQLite there's no synchronous
// read, so the signal starts at its fallback and is filled by hydrateStores()
// before the app renders; the write-through stays fire-and-forget, mirroring
// the old localStorage behaviour of surfacing failures only via console.
const hydrators: Array<() => Promise<void>> = [];

function parseOr<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function collection<T>(key: string, fallback: T) {
  const seed = backend.getItemSync ? parseOr(backend.getItemSync(key), fallback) : fallback;
  const [get, set] = createSignal<T>(seed);
  const update = (next: T) => {
    set(() => next);
    backend.setItem(key, JSON.stringify(next)).catch((e) => console.error(`Storage error (${key}):`, e));
  };
  hydrators.push(async () => {
    if (backend.getItemSync) return; // already seeded synchronously at module load
    const raw = await backend.getItem(key);
    set(() => parseOr(raw, fallback));
  });
  return [get, update] as const;
}

const DATA_KEYS = [
  KEYS.TASKS,
  KEYS.NOTES,
  KEYS.HABITS,
  KEYS.HABIT_ENTRIES,
  KEYS.REMINDER_LOG,
  KEYS.SLEEP,
] as const;

/** Loads every data collection from the storage backend into its signal.
    On a synchronous backend this is a no-op (collections seeded themselves at
    module load); on SQLite it runs the async reads - and, on first launch,
    first copies any data left in localStorage by an older localStorage-only
    version of the app so upgrading users don't lose their tasks/habits/notes.
    index.tsx awaits this before rendering, so the UI never paints empty. */
export async function hydrateStores(): Promise<void> {
  if (backend.getItemSync) return; // browser: collections are already populated
  for (const key of DATA_KEYS) {
    try {
      if ((await backend.getItem(key)) != null) continue; // already migrated
      const legacy = localStorage.getItem(key);
      if (legacy != null) await backend.setItem(key, legacy);
    } catch (e) {
      console.error(`Migration error (${key}):`, e);
    }
  }
  await Promise.all(hydrators.map((h) => h()));
}

// ── Tasks ──────────────────────────────────────────────────────────────
const [tasks, writeTasks] = collection<Task[]>(KEYS.TASKS, []);
export { tasks };

export function addTask(task: Task) {
  writeTasks([...tasks(), task]);
}

export function updateTask(taskId: number, updates: Partial<Task>) {
  writeTasks(tasks().map((t) => (t.id == taskId ? { ...t, ...updates } : t)));
}

export function deleteTask(taskId: number) {
  writeTasks(tasks().filter((t) => t.id != taskId));
}

// ── Notes ──────────────────────────────────────────────────────────────
const [notes, writeNotes] = collection<Note[]>(KEYS.NOTES, []);
export { notes };

export function addNote(note: Note) {
  writeNotes([note, ...notes()]);
}

export function updateNote(noteId: number, updates: Partial<Note>) {
  writeNotes(notes().map((n) => (n.id == noteId ? { ...n, ...updates } : n)));
}

export function deleteNote(noteId: number) {
  writeNotes(notes().filter((n) => n.id != noteId));
}

// ── Habits ─────────────────────────────────────────────────────────────
const [habits, writeHabits] = collection<Habit[]>(KEYS.HABITS, []);
export { habits };

export function addHabit(name: string): Habit {
  const habit: Habit = { id: Date.now(), name };
  writeHabits([...habits(), habit]);
  return habit;
}

export function renameHabit(habitId: number, name: string) {
  writeHabits(habits().map((h) => (h.id == habitId ? { ...h, name } : h)));
}

export function setHabitReminder(habitId: number, time: string | undefined) {
  writeHabits(habits().map((h) => (h.id == habitId ? { ...h, reminderTime: time } : h)));
}

export function deleteHabit(habitId: number) {
  writeHabits(habits().filter((h) => h.id != habitId));
  const entries = { ...habitEntries() };
  const prefix = `${habitId}_`;
  for (const key of Object.keys(entries)) {
    if (key.startsWith(prefix)) delete entries[key];
  }
  writeHabitEntries(entries);
  const log = { ...reminderLog() };
  delete log[habitId];
  writeReminderLog(log);
}

// ── Reminder notification log (habitId -> last date a reminder fired) ──
const [reminderLog, writeReminderLog] = collection<Record<number, string>>(KEYS.REMINDER_LOG, {});
export { reminderLog };

export function markReminderNotified(habitId: number, dateStr: string) {
  writeReminderLog({ ...reminderLog(), [habitId]: dateStr });
}

// ── Habit entries (keyed `${habitId}_${YYYY-MM-DD}`) ───────────────────
const [habitEntries, writeHabitEntries] = collection<Record<string, HabitEntry>>(
  KEYS.HABIT_ENTRIES,
  {},
);
export { habitEntries };

export function entryKey(habitId: number, dateStr: string) {
  return `${habitId}_${dateStr}`;
}

export function setHabitEntry(habitId: number, dateStr: string, entry: HabitEntry) {
  writeHabitEntries({ ...habitEntries(), [entryKey(habitId, dateStr)]: entry });
}

export function clearHabitEntry(habitId: number, dateStr: string) {
  const entries = { ...habitEntries() };
  delete entries[entryKey(habitId, dateStr)];
  writeHabitEntries(entries);
}

// ── Sleep (keyed YYYY-MM-DD → hours slept as a number) ─────────────────
const [sleepEntries, writeSleepEntries] = collection<Record<string, number>>(KEYS.SLEEP, {});
export { sleepEntries };

export function setSleepEntry(dateStr: string, hours: number) {
  writeSleepEntries({ ...sleepEntries(), [dateStr]: hours });
}

export function clearSleepEntry(dateStr: string) {
  const entries = { ...sleepEntries() };
  delete entries[dateStr];
  writeSleepEntries(entries);
}

// ── Backup / restore ────────────────────────────────────────────────────
// Deliberately excludes the user account (username/avatar) - a
// restore should bring back your tasks and habits, not silently change
// who you're logged in as or clobber a different profile's credentials.
const BACKUP_VERSION = 1;

export interface BackupData {
  version: number;
  exportedAt: string;
  tasks: Task[];
  notes: Note[];
  habits: Habit[];
  habitEntries: Record<string, HabitEntry>;
  sleepEntries: Record<string, number>;
}

export function createBackup(): BackupData {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tasks: tasks(),
    notes: notes(),
    habits: habits(),
    habitEntries: habitEntries(),
    sleepEntries: sleepEntries(),
  };
}

/** Structural check only - not a deep schema validation - good enough to
    reject "wrong file" mistakes before they wipe real data. */
export function isValidBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.version === "number" &&
    Array.isArray(d.tasks) &&
    Array.isArray(d.notes) &&
    Array.isArray(d.habits) &&
    typeof d.habitEntries === "object" &&
    d.habitEntries !== null &&
    typeof d.sleepEntries === "object" &&
    d.sleepEntries !== null
  );
}

export function restoreBackup(data: BackupData): void {
  writeTasks(data.tasks);
  writeNotes(data.notes);
  writeHabits(data.habits);
  writeHabitEntries(data.habitEntries);
  writeSleepEntries(data.sleepEntries);
}
