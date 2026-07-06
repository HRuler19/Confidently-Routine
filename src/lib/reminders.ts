// Pure habit-reminder logic, kept separate from the actual notification
// I/O (lib/notifications.ts) so the "which habits are due right now" rule
// is testable without a Tauri runtime or a DOM.
export interface ReminderHabit {
  id: number;
  name: string;
  reminderTime?: string; // HH:MM, 24-hour
}

export interface ReminderCheckInput {
  habits: ReminderHabit[];
  isLoggedToday: (habitId: number) => boolean;
  alreadyNotifiedToday: (habitId: number) => boolean;
  now: Date;
}

export interface DueReminder {
  habitId: number;
  habitName: string;
}

/** Habits whose reminder time has passed today, aren't logged yet today,
    and haven't already triggered a notification today - the "already
    notified" check is what makes this idempotent when called repeatedly
    on a timer throughout the day. */
export function dueReminders(input: ReminderCheckInput): DueReminder[] {
  const nowMinutes = input.now.getHours() * 60 + input.now.getMinutes();
  const due: DueReminder[] = [];

  for (const habit of input.habits) {
    if (!habit.reminderTime) continue;
    const [h, m] = habit.reminderTime.split(":").map(Number);
    if (nowMinutes < h * 60 + m) continue;
    if (input.isLoggedToday(habit.id)) continue;
    if (input.alreadyNotifiedToday(habit.id)) continue;
    due.push({ habitId: habit.id, habitName: habit.name });
  }

  return due;
}
