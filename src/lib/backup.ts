// Browser-standard file I/O for the export/import backup feature. Uses a
// plain Blob download + <input type="file"> instead of any Tauri-specific
// dialog API, so the exact same code works unmodified in the browser, the
// desktop app, and the mobile apps - all three run on a real web engine
// that already supports both.
import { createBackup, isValidBackup, restoreBackup, type BackupData } from "./stores";

export function exportBackupFile(): void {
  const backup = createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const dateStamp = new Date().toISOString().slice(0, 10);

  const link = document.createElement("a");
  link.href = url;
  link.download = `confidently-routine-backup-${dateStamp}.json`;
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
