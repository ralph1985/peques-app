"use client";
import { useState } from "react";
import type { Child } from "../domain/child";
import type { ChildDataCounts } from "../application/child-repository";
import { ChildForm } from "./child-form";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { usePeques } from "@/shared/ui/app-context";
import { LocalForm, field, errorMessage } from "@/shared/ui/local-form";
import { BackupExportButton } from "@/modules/backup/ui/backup-panel";
import styles from "@/app/(app)/peso/page.module.css";
import ui from "@/shared/ui/local-form.module.css";

type Sheet =
  | { mode: "create" }
  | { mode: "edit"; child: Child }
  | { mode: "delete"; child: Child; counts: ChildDataCounts }
  | null;

export function ChildManager() {
  const { app, family } = usePeques();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [error, setError] = useState<string | null>(null);
  async function prepareDelete(child: Child) {
    try {
      setError(null);
      setSheet({ mode: "delete", child, counts: await app.children.counts(child.id) });
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }
  return (
    <section className="local-panel" aria-labelledby="children-title">
      <div className="section-heading">
        <h2 id="children-title">Tus peques</h2>
        <button className={ui.secondary} onClick={() => setSheet({ mode: "create" })}>
          Añadir hijo
        </button>
      </div>
      <ul className="child-list">
        {family.children.map((child) => (
          <li key={child.id}>
            <div>
              <strong>{child.name}</strong>
              <span>{child.id === family.activeChild?.id ? "Seleccionado" : child.birthDate}</span>
            </div>
            <div className="row-actions">
              <button
                onClick={() => setSheet({ mode: "edit", child })}
                aria-label={`Editar ${child.name}`}
              >
                Editar
              </button>
              <button
                onClick={() => void prepareDelete(child)}
                aria-label={`Eliminar ${child.name}`}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error && <p role="alert">{error}</p>}
      {sheet && (
        <BottomSheet
          ariaLabel="Gestión de hijos"
          labelledBy="child-sheet-title"
          onClose={() => setSheet(null)}
          styles={styles}
        >
          <div className="sheet-content">
            <h2 id="child-sheet-title">
              {sheet.mode === "create"
                ? "Añadir hijo"
                : sheet.mode === "edit"
                  ? "Editar hijo"
                  : `Eliminar a ${sheet.child.name}`}
            </h2>
            {sheet.mode !== "delete" ? (
              <ChildForm
                child={sheet.mode === "edit" ? sheet.child : undefined}
                onDone={() => setSheet(null)}
                onCancel={() => setSheet(null)}
              />
            ) : (
              <>
                <p>
                  Se eliminarán todos sus datos de este dispositivo. La lista familiar de Viaje se
                  conserva.
                </p>
                <dl className="count-grid">
                  <dt>Pesos</dt>
                  <dd>{sheet.counts.weights}</dd>
                  <dt>Medidas</dt>
                  <dd>{sheet.counts.growthMeasurements}</dd>
                  <dt>Vacunas planificadas</dt>
                  <dd>{sheet.counts.plannedVaccines}</dd>
                  <dt>Vacunas aplicadas</dt>
                  <dd>{sheet.counts.appliedVaccines}</dd>
                  <dt>Registros de sueño</dt>
                  <dd>{sheet.counts.sleep}</dd>
                </dl>
                <BackupExportButton />
                <LocalForm
                  submitLabel="Eliminar hijo y sus datos"
                  onCancel={() => setSheet(null)}
                  onSuccess={() => setSheet(null)}
                  action={(data) =>
                    app.children.delete(sheet.child.id, field(data, "confirmedName"))
                  }
                >
                  <label>
                    Escribe {sheet.child.name} para confirmar
                    <input name="confirmedName" required autoComplete="off" />
                  </label>
                </LocalForm>
              </>
            )}
          </div>
        </BottomSheet>
      )}
    </section>
  );
}
