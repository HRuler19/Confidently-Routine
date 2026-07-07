// File I/O for the export/import backup feature.
//
// Import uses a plain <input type="file">, which every web engine - browser,
// desktop WebView2, mobile WKWebView - handles natively.
//
// Export can't do the same: the browser's <a download> trick is silently
// swallowed inside Tauri's WebView (Tauri intercepts navigations, so the
// download never reaches disk), which is exactly why "export" appeared to do
// nothing in the desktop app. So export branches: in the browser it keeps the
// Blob download; inside Tauri it opens a real native "Save As" dialog and
// writes the file through the fs plugin.
import { createBackup, isValidBackup, restoreBackup, type BackupData } from "./stores";

const isTauri = "__TAURI_INTERNALS__" in window;

export async function exportBackupFile(): Promise<void> {
  const backup = createBackup();
  const json = JSON.stringify(backup, null, 2);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `confidently-routine-backup-${dateStamp}.json`;

  if (isTauri) {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");
      const path = await save({
        defaultPath: filename,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!path) return; // user cancelled the dialog
      await writeTextFile(path, json);
      return;
    } catch {
      // Fall through to the Blob path below - worst case it behaves as it did
      // before rather than throwing, e.g. on a platform where the save dialog
      // isn't available.
    }
  }

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export type ImportResult = { ok: true } | { ok: false; error: "parse" | "invalid" };

export function importBackupFromFile(file: File): Promise<ImportResult> {
  return file
    .text()
    .then((text) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { ok: false, error: "parse" } as const;
      }
      if (!isValidBackup(parsed)) return { ok: false, error: "invalid" } as const;
      restoreBackup(parsed as BackupData);
      return { ok: true } as const;
    })
    .catch(() => ({ ok: false, error: "parse" }) as const);
}
