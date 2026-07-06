// Auto-update helper - Tauri desktop only. The updater/process plugins
// aren't registered on Android/iOS (the app store owns updates there) or
// in the plain browser/PWA build, so every export here safely no-ops
// unless running inside a Tauri desktop window.
import type { Update } from "@tauri-apps/plugin-updater";

let pendingUpdate: Update | null = null;

export async function isUpdateCapable(): Promise<boolean> {
  if (!("__TAURI_INTERNALS__" in window)) return false;
  try {
    const { platform } = await import("@tauri-apps/plugin-os");
    const p = platform();
    return p !== "android" && p !== "ios";
  } catch {
    return false;
  }
}

export interface UpdateCheckResult {
  available: boolean;
  version?: string;
}

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (!(await isUpdateCapable())) return { available: false };
  const { check } = await import("@tauri-apps/plugin-updater");
  pendingUpdate = await check();
  return pendingUpdate ? { available: true, version: pendingUpdate.version } : { available: false };
}

/** Downloads and installs the update found by the most recent checkForUpdate() call, then relaunches. */
export async function installPendingUpdate(): Promise<void> {
  if (!pendingUpdate) return;
  await pendingUpdate.downloadAndInstall();
  const { relaunch } = await import("@tauri-apps/plugin-process");
  await relaunch();
}
