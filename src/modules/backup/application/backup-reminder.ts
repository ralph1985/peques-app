const DAY_MS = 24 * 60 * 60 * 1000;
const TWO_WEEKS_MS = 14 * DAY_MS;

export type BackupReminderStatus = "never" | "overdue" | "current";

export function getBackupReminderStatus(
  lastExportedAt: string | null,
  now = new Date(),
): BackupReminderStatus {
  if (!lastExportedAt) return "never";
  const exportedAt = Date.parse(lastExportedAt);
  if (!Number.isFinite(exportedAt) || now.getTime() - exportedAt <= TWO_WEEKS_MS) {
    return "current";
  }
  return "overdue";
}

export function getDaysSinceBackup(lastExportedAt: string | null, now = new Date()): number | null {
  if (!lastExportedAt) return null;
  const exportedAt = Date.parse(lastExportedAt);
  if (!Number.isFinite(exportedAt)) return null;
  return Math.max(0, Math.floor((now.getTime() - exportedAt) / DAY_MS));
}
