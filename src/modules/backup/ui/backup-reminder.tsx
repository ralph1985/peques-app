"use client";

import Link from "next/link";
import { getBackupReminderStatus, getDaysSinceBackup } from "../application/backup-reminder";
import { usePeques } from "@/shared/ui/app-context";
import styles from "@/app/(app)/_components/app-shell.module.css";

export function BackupReminder() {
  const { family } = usePeques();
  const status = getBackupReminderStatus(
    family.settings.lastExportedAt,
    family.settings.firstUsedAt,
  );
  if (status === "current") return null;

  const days = getDaysSinceBackup(family.settings.lastExportedAt);
  return (
    <aside className={styles.backupReminder} aria-label="Recordatorio de copia de seguridad">
      <div>
        <strong>
          {status === "never" ? "Aún no hay una copia de seguridad" : "Copia pendiente"}
        </strong>
        <p>
          {status === "never"
            ? "Protege los datos de este dispositivo exportando una copia desde Ajustes."
            : `Han pasado ${days ?? 0} días desde la última copia preparada.`}
        </p>
      </div>
      <Link href="/ajustes">Hacer copia</Link>
    </aside>
  );
}
