const DAY_MS = 24 * 60 * 60 * 1000;
const INITIAL_GRACE_MS = 7 * DAY_MS;
const TWO_WEEKS_MS = 14 * DAY_MS;

export type BackupReminderStatus = "never" | "overdue" | "current";

export function getBackupReminderStatus(
  lastExportedAt: string | null,
  firstUsedAt: string | null,
  now = new Date(),
): BackupReminderStatus {
  if (lastExportedAt) {
    const exportedAt = Date.parse(lastExportedAt);
    if (!Number.isFinite(exportedAt) || now.getTime() - exportedAt <= TWO_WEEKS_MS) {
      return "current";
    }
    return "overdue";
  }
  if (!firstUsedAt) return "never";
  const startedAt = Date.parse(firstUsedAt);
  if (!Number.isFinite(startedAt) || now.getTime() - startedAt <= INITIAL_GRACE_MS) {
    return "current";
  }
  return "never";
}

export function getDaysSinceBackup(lastExportedAt: string | null, now = new Date()): number | null {
  if (!lastExportedAt) return null;
  const exportedAt = Date.parse(lastExportedAt);
  if (!Number.isFinite(exportedAt)) return null;
  return Math.max(0, Math.floor((now.getTime() - exportedAt) / DAY_MS));
}
