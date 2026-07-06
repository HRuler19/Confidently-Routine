// Tauri notification I/O - the actual "ask permission" / "send it" calls
// live here, kept apart from lib/reminders.ts's pure due-reminder logic.
// Safely no-ops outside a Tauri window (plain browser/PWA), where the
// notification plugin isn't registered.
import { habits, habitEntries, entryKey, reminderLog, markReminderNotified } from "./stores";
import { todayStr } from "./dates";
import { dueReminders } from "./reminders";
import { t } from "./i18n";

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    const { isPermissionGranted, requestPermission } = await import("@tauri-apps/plugin-notification");
    if (await isPermissionGranted()) return true;
    return (await requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/** Checks every habit with a reminder time against "now" and fires a native
    notification for any that are due - meant to be called on a timer while
    the app is open. Doesn't wake the app from the background; it only
    catches reminders while the app is actually running. */
export async function checkAndSendHabitReminders(): Promise<void> {
  if (!isTauri()) return;
  let sendNotification: (typeof import("@tauri-apps/plugin-notification"))["sendNotification"];
  try {
    const plugin = await import("@tauri-apps/plugin-notification");
    if (!(await plugin.isPermissionGranted())) return;
    sendNotification = plugin.sendNotification;
  } catch {
    return;
  }

  const today = todayStr();
  const entries = habitEntries();
  const log = reminderLog();

  const due = dueReminders({
    habits: habits(),
    isLoggedToday: (id) => !!entries[entryKey(id, today)],
    alreadyNotifiedToday: (id) => log[id] === today,
    now: new Date(),
  });

  for (const reminder of due) {
    sendNotification({
      title: t("myroutine.reminder_notification_title"),
      body: t("myroutine.reminder_notification_body", { name: reminder.habitName }),
    });
    markReminderNotified(reminder.habitId, today);
  }
}
