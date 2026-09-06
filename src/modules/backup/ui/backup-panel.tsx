"use client";
import { useState } from "react";
import { usePeques } from "@/shared/ui/app-context";
import { errorMessage, LocalForm, field } from "@/shared/ui/local-form";
import { LoadingButton } from "@/shared/ui/pending-submit-button";
import { maxBackupBytes, parseBackup, summarizeBackup, type PequesBackup } from "../domain/backup";
import { assert } from "@/shared/domain/validation";
import ui from "@/shared/ui/local-form.module.css";

export function BackupExportButton() {
  const { app } = usePeques();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function download() {
    if (pending) return;
    setPending(true);
    setMessage(null);
    try {
      const backup = await app.backup.export();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      assert(
        blob.size <= maxBackupBytes,
        "La copia supera 25 MiB. No se ha descargado un archivo que esta versión no pueda restaurar.",
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `peques-backup-${backup.exportedAt.replaceAll(":", "-")}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      await app.settings.recordExport(backup.exportedAt);
      setMessage("Copia preparada. Guarda el archivo descargado en un lugar que controles.");
    } catch (reason) {
      setMessage(errorMessage(reason));
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <LoadingButton
        type="button"
        className={ui.secondary}
        onClick={() => void download()}
        pending={pending}
      >
        Exportar copia
      </LoadingButton>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

export function BackupPanel() {
  const { app, family } = usePeques();
  const [preview, setPreview] = useState<PequesBackup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  async function read(file: File | undefined) {
    setPreview(null);
    setError(null);
    setMessage(null);
    if (!file) return;
    setReading(true);
    try {
      assert(file.size <= maxBackupBytes, "La copia supera el límite de 25 MiB.");
      setPreview(parseBackup(await file.text()));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setReading(false);
    }
  }
  const counts = preview ? summarizeBackup(preview) : null;
  return (
    <section className="local-panel" aria-labelledby="backup-title">
      <h2 id="backup-title">Copias de seguridad</h2>
      <p>
        Los datos están solo en este dispositivo. Borrar los datos del navegador o perder el
        dispositivo puede eliminarlos si no tienes una copia exportada.
      </p>
      <BackupExportButton />
      {family.settings.lastExportedAt && (
        <p>
          Última copia preparada: {new Date(family.settings.lastExportedAt).toLocaleString("es-ES")}
        </p>
      )}
      <label className="file-label">
        Importar copia
        <input
          type="file"
          accept="application/json,.json"
          disabled={reading}
          onChange={(event) => {
            void read(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      {reading && <p role="status">Comprobando copia…</p>}
      {error && (
        <p role="alert" className={ui.error}>
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {preview && counts && (
        <div className="import-preview">
          <h3>Revisar copia antes de restaurar</h3>
          <dl className="count-grid">
            <dt>Hijos</dt>
            <dd>{counts.children}</dd>
            <dt>Pesos</dt>
            <dd>{counts.weightEntries}</dd>
            <dt>Vacunas planificadas</dt>
            <dd>{counts.plannedVaccineDoses}</dd>
            <dt>Vacunas aplicadas</dt>
            <dd>{counts.appliedVaccineDoses}</dd>
            <dt>Registros de sueño</dt>
            <dd>{counts.sleepEntries}</dd>
            <dt>Elementos de viaje</dt>
            <dd>{counts.travelChecklistItems}</dd>
            <dt>Categorías</dt>
            <dd>{counts.travelChecklistCategories}</dd>
            <dt>Ubicaciones</dt>
            <dd>{counts.travelStorageLocations}</dd>
          </dl>
          <LocalForm
            submitLabel="Restaurar copia"
            onCancel={() => setPreview(null)}
            onSuccess={() => {
              setPreview(null);
              setMessage("Copia restaurada correctamente.");
            }}
            action={async (data) => {
              assert(field(data, "confirm") === "RESTAURAR", "Escribe RESTAURAR para confirmar.");
              await app.backup.restore(preview);
            }}
          >
            <p>
              Se sustituirán TODOS los datos actuales de Peques en este dispositivo. Exporta una
              copia antes de continuar si quieres conservarlos.
            </p>
            <label>
              Escribe RESTAURAR para confirmar
              <input name="confirm" required autoComplete="off" />
            </label>
          </LocalForm>
        </div>
      )}
      <p>Las copias son archivos sin cifrar. Peques no las envía a ningún servidor.</p>
    </section>
  );
}
