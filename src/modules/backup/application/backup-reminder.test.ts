import { describe, expect, it } from "vitest";
import { getBackupReminderStatus, getDaysSinceBackup } from "./backup-reminder";

describe("recordatorio de copia", () => {
  const now = new Date("2026-09-07T12:00:00.000Z");

  it("da siete días de margen al empezar sin copia", () => {
    expect(getBackupReminderStatus(null, "2026-09-01T12:00:00.000Z", now)).toBe("current");
    expect(getBackupReminderStatus(null, "2026-08-31T11:59:59.999Z", now)).toBe("never");
  });

  it("mantiene la calma hasta que pasan más de catorce días", () => {
    expect(
      getBackupReminderStatus("2026-08-24T12:00:00.000Z", "2026-08-01T12:00:00.000Z", now),
    ).toBe("current");
    expect(
      getBackupReminderStatus("2026-08-24T11:59:59.999Z", "2026-08-01T12:00:00.000Z", now),
    ).toBe("overdue");
  });

  it("calcula los días completos desde la exportación", () => {
    expect(getDaysSinceBackup("2026-08-20T12:00:00.000Z", now)).toBe(18);
    expect(getDaysSinceBackup(null, now)).toBeNull();
  });
});
