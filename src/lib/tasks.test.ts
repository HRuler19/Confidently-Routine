import { describe, it, expect } from "vitest";
import { shouldSpawnNextOccurrence } from "./tasks";

describe("shouldSpawnNextOccurrence", () => {
  it("spawns on the first completion of a recurring task", () => {
    expect(shouldSpawnNextOccurrence({ completed: true, recurrence: "daily" })).toBe(true);
  });

  it("doesn't spawn for a non-recurring task", () => {
    expect(shouldSpawnNextOccurrence({ completed: true })).toBe(false);
  });

  it("doesn't spawn when unchecking", () => {
    expect(shouldSpawnNextOccurrence({ completed: false, recurrence: "daily" })).toBe(false);
  });

  it("doesn't spawn a duplicate once already spawned, even toggled off and back on", () => {
    expect(
      shouldSpawnNextOccurrence({ completed: true, recurrence: "daily", recurrenceSpawned: true }),
    ).toBe(false);
  });
});
