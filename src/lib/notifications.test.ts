import { describe, it, expect } from "vitest";
import { requestNotificationPermission, checkAndSendHabitReminders } from "./notifications";

describe("notifications outside Tauri", () => {
  it("never grants permission in a plain browser/test environment", async () => {
    expect(await requestNotificationPermission()).toBe(false);
  });

  it("checkAndSendHabitReminders no-ops without throwing", async () => {
    await expect(checkAndSendHabitReminders()).resolves.toBeUndefined();
  });
});
