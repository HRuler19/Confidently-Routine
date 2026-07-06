import { describe, it, expect } from "vitest";
import { dueReminders } from "./reminders";

function at(hour: number, minute: number): Date {
  const d = new Date(2026, 6, 6, hour, minute);
  return d;
}

describe("dueReminders", () => {
  it("ignores habits with no reminder time set", () => {
    const result = dueReminders({
      habits: [{ id: 1, name: "Read" }],
      isLoggedToday: () => false,
      alreadyNotifiedToday: () => false,
      now: at(9, 0),
    });
    expect(result).toEqual([]);
  });

  it("is not due before the reminder time", () => {
    const result = dueReminders({
      habits: [{ id: 1, name: "Read", reminderTime: "09:00" }],
      isLoggedToday: () => false,
      alreadyNotifiedToday: () => false,
      now: at(8, 59),
    });
    expect(result).toEqual([]);
  });

  it("is due exactly at and after the reminder time", () => {
    const habits = [{ id: 1, name: "Read", reminderTime: "09:00" }];
    const exact = dueReminders({
      habits,
      isLoggedToday: () => false,
      alreadyNotifiedToday: () => false,
      now: at(9, 0),
    });
    expect(exact).toEqual([{ habitId: 1, habitName: "Read" }]);

    const later = dueReminders({
      habits,
      isLoggedToday: () => false,
      alreadyNotifiedToday: () => false,
      now: at(14, 30),
    });
    expect(later).toEqual([{ habitId: 1, habitName: "Read" }]);
  });

  it("skips habits already logged today", () => {
    const result = dueReminders({
      habits: [{ id: 1, name: "Read", reminderTime: "09:00" }],
      isLoggedToday: () => true,
      alreadyNotifiedToday: () => false,
      now: at(10, 0),
    });
    expect(result).toEqual([]);
  });

  it("skips habits already notified today, so a repeated timer check doesn't spam", () => {
    const result = dueReminders({
      habits: [{ id: 1, name: "Read", reminderTime: "09:00" }],
      isLoggedToday: () => false,
      alreadyNotifiedToday: () => true,
      now: at(10, 0),
    });
    expect(result).toEqual([]);
  });

  it("evaluates each habit independently across a mixed list", () => {
    const result = dueReminders({
      habits: [
        { id: 1, name: "Read", reminderTime: "09:00" },
        { id: 2, name: "Stretch" }, // no reminder
        { id: 3, name: "Meditate", reminderTime: "20:00" }, // not due yet
        { id: 4, name: "Water plants", reminderTime: "08:00" }, // already logged
      ],
      isLoggedToday: (id) => id === 4,
      alreadyNotifiedToday: () => false,
      now: at(10, 0),
    });
    expect(result).toEqual([{ habitId: 1, habitName: "Read" }]);
  });
});
