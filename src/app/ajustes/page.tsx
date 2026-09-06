"use client";
import { ChildManager } from "@/modules/profile/ui/child-manager";
import { BackupPanel } from "@/modules/backup/ui/backup-panel";
export default function SettingsPage() {
  return (
    <main className="content-page">
      <h1>Ajustes</h1>
      <ChildManager />
      <BackupPanel />
      <section className="local-panel">
        <h2>Tu privacidad</h2>
        <p>
          Los datos familiares se almacenan exclusivamente en IndexedDB en el dispositivo. Peques no
          dispone de backend ni base de datos remota.
        </p>
        <p>
          No hay cuentas, sincronización, analytics ni trackers. El almacenamiento y las copias no
          están cifrados por Peques. Usa el bloqueo de tu dispositivo y conserva tus copias en un
          lugar seguro.
        </p>
      </section>
    </main>
  );
}
