"use client";
import { ChildManager } from "@/modules/profile/ui/child-manager";
import { BackupPanel } from "@/modules/backup/ui/backup-panel";
import { TutorialRestartButton } from "@/shared/ui/app-tutorial";
import { AppointmentPanel, HealthSettingsPanel } from "@/modules/settings/ui/health-settings-panel";
import Link from "next/link";
export default function SettingsPage() {
  return (
    <main className="content-page" data-tutorial-section="settings">
      <h1>Ajustes</h1>
      <ChildManager />
      <HealthSettingsPanel />
      <AppointmentPanel />
      <section className="local-panel">
        <h2>Organización familiar</h2>
        <p>La lista de viaje sigue disponible como módulo independiente.</p>
        <Link className="text-button" href="/viaje">
          Abrir lista de viaje
        </Link>
      </section>
      <BackupPanel />
      <section className="local-panel">
        <h2>Ayuda</h2>
        <p>Repasa las funciones principales de Peques con una guía breve y contextual.</p>
        <TutorialRestartButton />
      </section>
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
