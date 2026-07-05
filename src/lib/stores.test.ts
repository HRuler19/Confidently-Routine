// The stores module keeps signals at module scope, so each test file run
// gets a fresh module via resetModules + dynamic import after seeding
// storage — mirroring a real app boot.
import { describe, it, expect, beforeEach, vi } from "vitest";

async function freshStores() {
  vi.resetModules();
  return await import("./stores");
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("tasks", () => {
  it("persists added tasks under the v1-compatible key", async () => {
    const stores = await freshStores();
    stores.addTask({
      id: 1,
      title: "Test task",
      category: "Personal",
      priority: "medium",
      dueDate: "2026-07-06",
      completed: false,
    });
    const raw = JSON.parse(localStorage.getItem("confidently_tasks")!);
    expect(raw).toHaveLength(1);
    expect(raw[0].title).toBe("Test task");
    expect(stores.tasks()).toHaveLength(1);
  });

  it("updates and deletes by id", async () => {
    const stores = await freshStores();
    stores.addTask({
      id: 7,
      title: "A",
      category: "Work",
      priority: "high",
      dueDate: "2026-07-06",
      completed: false,
    });
    stores.updateTask(7, { completed: true });
    expect(stores.tasks()[0].completed).toBe(true);

    stores.deleteTask(7);
    expect(stores.tasks()).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem("confidently_tasks")!)).toEqual([]);
  });

  it("hydrates existing v1 data on boot", async () => {
    localStorage.setItem(
      "confidently_tasks",
      JSON.stringify([
        { id: 5, title: "Legacy", category: "Personal", priority: "low", dueDate: "2026-01-01", completed: true },
      ]),
    );
    const stores = await freshStores();
    expect(stores.tasks()[0].title).toBe("Legacy");
  });
});

describe("user session", () => {
  it("remember-me persists to localStorage", async () => {
    const stores = await freshStores();
    stores.saveUser({ username: "Alex", avatar: "/a.svg" }, true);
    expect(JSON.parse(localStorage.getItem("confidently_user")!).username).toBe("Alex");
    expect(localStorage.getItem("confidently_remember")).toBe("true");
  });

  it("session-only login stays out of localStorage", async () => {
    const stores = await freshStores();
    stores.saveUser({ username: "Tmp", avatar: "/a.svg" }, false);
    expect(localStorage.getItem("confidently_user")).toBeNull();
    expect(JSON.parse(sessionStorage.getItem("confidently_session_user")!).username).toBe("Tmp");
  });

  it("logout clears both storages and the signal", async () => {
    const stores = await freshStores();
    stores.saveUser({ username: "Alex", avatar: "/a.svg" }, true);
    stores.logout();
    expect(stores.user()).toBeNull();
    expect(localStorage.getItem("confidently_user")).toBeNull();
  });
});

describe("habits + entries", () => {
  it("deleting a habit removes all of its entries", async () => {
    const stores = await freshStores();
    const habit = stores.addHabit("Read");
    stores.setHabitEntry(habit.id, "2026-07-01", { type: "plus" });
    stores.setHabitEntry(habit.id, "2026-07-02", { type: "count", value: 3 });

    stores.deleteHabit(habit.id);
    expect(stores.habits()).toHaveLength(0);
    expect(Object.keys(stores.habitEntries())).toHaveLength(0);
  });

  it("entryKey format matches the v1 storage layout", async () => {
    const stores = await freshStores();
    expect(stores.entryKey(123, "2026-07-06")).toBe("123_2026-07-06");
  });
});

describe("sleep", () => {
  it("set and clear round-trips", async () => {
    const stores = await freshStores();
    stores.setSleepEntry("2026-07-06", 7.5);
    expect(stores.sleepEntries()["2026-07-06"]).toBe(7.5);
    stores.clearSleepEntry("2026-07-06");
    expect(stores.sleepEntries()["2026-07-06"]).toBeUndefined();
  });
});
