import { describe, it, expect } from "vitest";
import { isUpdateCapable, checkForUpdate, installPendingUpdate } from "./updater";

describe("updater outside Tauri", () => {
  it("is never update-capable in a plain browser/test environment", async () => {
    expect(await isUpdateCapable()).toBe(false);
  });

  it("checkForUpdate no-ops without throwing", async () => {
    expect(await checkForUpdate()).toEqual({ available: false });
  });

  it("installPendingUpdate no-ops without a prior check", async () => {
    await expect(installPendingUpdate()).resolves.toBeUndefined();
  });
});
