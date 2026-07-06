// Reactive persistence layer. Uses the exact same localStorage keys and
// object shapes as the vanilla app's core/storage/* stores, so existing
// user data keeps working after the SolidJS rewrite. Every collection is
// a Solid signal whose mutations write through to storage.
import { createSignal } from "solid-js";

import type { Recurrence } from "./dates";

// ── Shared JSON helpers ────────────────────────────────────────────────
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
  password?: string;
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
function collection<T>(key: string, fallback: T) {
  const [get, set] = createSignal<T>(readJSON<T>(key, fallback));
  const update = (next: T) => {
    writeJSON(key, next);
    set(() => next);
  };
  return [get, update] as const;
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

export function deleteHabit(habitId: number) {
  writeHabits(habits().filter((h) => h.id != habitId));
  const entries = { ...habitEntries() };
  const prefix = `${habitId}_`;
  for (const key of Object.keys(entries)) {
    if (key.startsWith(prefix)) delete entries[key];
  }
  writeHabitEntries(entries);
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
// Deliberately excludes the user account (username/password/avatar) - a
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
