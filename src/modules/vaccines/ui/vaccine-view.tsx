"use client";
import { useState } from "react";
import type { ChildData } from "@/shared/application/peques-app";
import { usePeques } from "@/shared/ui/app-context";
import {
  assignPlannedVaccineDoseStatuses,
  getVaccineDoseStatusLabel,
  vaccineDoseStatuses,
  type PlannedVaccineDoseWithStatus,
  type AppliedVaccineDose,
} from "../domain/vaccine-calendar";
import { updatePlannedVaccineDose } from "../application/update-planned-vaccine-dose";
import { markVaccineDoseApplied } from "../application/mark-vaccine-dose-applied";
import { updateAppliedVaccineDose } from "../application/update-applied-vaccine-dose";
import { reopenPlannedVaccineDose } from "../application/reopen-planned-vaccine-dose";
import { LocalForm, field, errorMessage } from "@/shared/ui/local-form";
import { useClock } from "@/shared/ui/use-clock";
import { StandaloneApplicationSheet } from "./standalone-application-sheet";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { localDate } from "@/shared/domain/validation";
import styles from "@/app/(app)/vacunas/page.module.css";

type EditState = {
  mode: "plan" | "apply" | "application" | "reopen";
  dose: PlannedVaccineDoseWithStatus;
} | null;

export function VaccineView({ childId, data }: { childId: string; data: ChildData }) {
  const { app, family } = usePeques();
  const [sheet, setSheet] = useState<EditState>(null);
  const [standalone, setStandalone] = useState<{
    entry?: AppliedVaccineDose;
    deleting?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = useClock();
  const view = family.settings.vaccineView;
  const doses = assignPlannedVaccineDoseStatuses(data.planned, data.applied, now);
  async function changeView(view: "status" | "timeline") {
    try {
      await app.settings.update({ vaccineView: view });
      setError(null);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }
  const groups =
    view === "status"
      ? vaccineDoseStatuses.map((status) => ({
          key: status,
          label: getVaccineDoseStatusLabel(status),
          doses: doses.filter((dose) => dose.status === status),
        }))
      : [...new Set(doses.map((dose) => dose.ageLabel || "Edad por definir"))].map((label) => ({
          key: label,
          label,
          doses: doses.filter((dose) => (dose.ageLabel || "Edad por definir") === label),
        }));
  return (
    <>
      <section className={styles.panel}>
        <div className="filter-row" role="group" aria-label="Vista de vacunas">
          <button
            className="text-button"
            aria-pressed={view === "status"}
            onClick={() => void changeView("status")}
          >
            Por estado
          </button>
          <button
            className="text-button"
            aria-pressed={view === "timeline"}
            onClick={() => void changeView("timeline")}
          >
            Línea temporal
          </button>
        </div>
        <div className="filter-row">
          {vaccineDoseStatuses.map((status) => (
            <span className={styles.statusBadge} data-status={status} key={status}>
              {getVaccineDoseStatusLabel(status)}:{" "}
              {doses.filter((dose) => dose.status === status).length}
            </span>
          ))}
        </div>
        <p className={styles.notes}>
          Calendario orientativo de Madrid 2026, editable. Confirma las campañas y cualquier cambio
          con tu centro de salud.
        </p>
      </section>
      <section className={styles.panel}>
        {groups.map((group) => (
          <section
            className={view === "timeline" ? styles.timelineGroup : styles.statusGroup}
            key={group.key}
          >
            <div className={styles.statusTitle}>
              <h2>{group.label}</h2>
              <span>{group.doses.length}</span>
            </div>
            {!group.doses.length && <p className={styles.empty}>Nada en este grupo.</p>}
            <ol className={styles.doseList}>
              {group.doses.map((dose) => (
                <li key={dose.id}>
                  <div className={styles.doseSummary}>
                    <div>
                      <strong>{dose.vaccineName}</strong>
                      <span>
                        {dose.doseLabel}
                        {dose.ageLabel ? ` · ${dose.ageLabel}` : ""}
                      </span>
                    </div>
                    <div className={styles.dateStack}>
                      <span className={styles.statusBadge} data-status={dose.status}>
                        {dose.plannedDate === null && !dose.application
                          ? "Fecha por confirmar"
                          : getVaccineDoseStatusLabel(dose.status)}
                      </span>
                      <time dateTime={dose.plannedDate ?? undefined}>
                        {dose.plannedDate ?? "Sin fecha"}
                      </time>
                    </div>
                  </div>
                  {dose.notes && <p className={styles.notes}>{dose.notes}</p>}
                  {dose.application && (
                    <p className={styles.notes}>
                      Aplicada el {dose.application.appliedOn} · {dose.application.place}
                      {dose.application.lot ? ` · Lote: ${dose.application.lot}` : ""}
                      {dose.application.notes ? ` · ${dose.application.notes}` : ""}
                    </p>
                  )}
                  <div className={styles.doseActions}>
                    <button
                      className="text-button"
                      onClick={() =>
                        setSheet({ mode: dose.application ? "application" : "apply", dose })
                      }
                    >
                      {dose.application ? "Editar aplicación" : "Marcar aplicada"}
                    </button>
                    <button
                      className="text-button"
                      onClick={() => setSheet({ mode: "plan", dose })}
                    >
                      Editar planificación
                    </button>
                    {dose.application && (
                      <button
                        className="text-button"
                        onClick={() => setSheet({ mode: "reopen", dose })}
                      >
                        Volver a pendiente
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </section>
      {error && <p role="alert">{error}</p>}
      <section className={styles.panel} aria-label="Vacunas fuera de la planificación">
        <h2>Otras vacunas aplicadas</h2>
        <p>Para registros que no corresponden a una dosis de la planificación.</p>
        <button className="text-button" onClick={() => setStandalone({})}>
          Añadir vacuna aplicada
        </button>
        <ul className="child-list">
          {data.applied
            .filter((dose) => dose.plannedDoseId === null)
            .map((dose) => (
              <li key={dose.id}>
                <div>
                  <strong>
                    {dose.vaccineName} · {dose.doseLabel}
                  </strong>
                  <span>
                    {dose.appliedOn} · {dose.place}
                  </span>
                  {dose.lot && <span>Lote: {dose.lot}</span>}
                  {dose.notes && <span>{dose.notes}</span>}
                </div>
                <div className="row-actions">
                  <button
                    aria-label={`Editar aplicación de ${dose.vaccineName}`}
                    onClick={() => setStandalone({ entry: dose })}
                  >
                    Editar
                  </button>
                  <button
                    aria-label={`Borrar aplicación de ${dose.vaccineName}`}
                    onClick={() => setStandalone({ entry: dose, deleting: true })}
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ))}
        </ul>
      </section>
      {standalone && (
        <StandaloneApplicationSheet
          childId={childId}
          {...standalone}
          onClose={() => setStandalone(null)}
        />
      )}
      {sheet && <VaccineSheet childId={childId} state={sheet} onClose={() => setSheet(null)} />}
    </>
  );
}

function VaccineSheet({
  childId,
  state,
  onClose,
}: {
  childId: string;
  state: NonNullable<EditState>;
  onClose: () => void;
}) {
  const { app } = usePeques();
  const repository = app.forChild(childId).vaccines;
  const { dose, mode } = state;
  const applied = dose.application;
  const title =
    mode === "plan"
      ? "Editar planificación"
      : mode === "reopen"
        ? "Volver a pendiente"
        : mode === "application"
          ? "Editar aplicación"
          : "Marcar aplicada";
  return (
    <BottomSheet
      ariaLabel={title}
      labelledBy="vaccine-sheet-title"
      onClose={onClose}
      styles={styles}
    >
      <div className="sheet-content">
        <h2 id="vaccine-sheet-title">{title}</h2>
        <p>
          {dose.vaccineName} · {dose.doseLabel}
        </p>
        <LocalForm
          submitLabel={mode === "reopen" ? "Volver a pendiente" : "Guardar vacuna"}
          onSuccess={onClose}
          onCancel={onClose}
          action={(form) => {
            if (mode === "reopen") return reopenPlannedVaccineDose(repository, applied!.id);
            if (mode === "plan")
              return updatePlannedVaccineDose(repository, dose.id, {
                vaccineName: field(form, "vaccineName"),
                doseLabel: field(form, "doseLabel"),
                plannedDate: field(form, "date") || null,
                ageLabel: field(form, "ageLabel") || null,
                notes: field(form, "notes") || null,
              });
            const input = {
              plannedDoseId: dose.id,
              appliedOn: field(form, "date"),
              vaccineName: field(form, "vaccineName"),
              doseLabel: field(form, "doseLabel"),
              place: field(form, "place"),
              lot: field(form, "lot") || null,
              notes: field(form, "notes") || null,
            };
            return mode === "application"
              ? updateAppliedVaccineDose(repository, applied!.id, input)
              : markVaccineDoseApplied(repository, input);
          }}
        >
          {mode === "reopen" ? (
            <p>
              Se eliminará la aplicación y sus datos de fecha, lugar, lote y notas. La planificación
              se conservará.
            </p>
          ) : (
            <>
              <label>
                {mode === "plan" ? "Fecha prevista · opcional" : "Fecha de aplicación"}
                <input
                  name="date"
                  type="date"
                  required={mode !== "plan"}
                  defaultValue={
                    mode === "plan" ? (dose.plannedDate ?? "") : (applied?.appliedOn ?? localDate())
                  }
                />
              </label>
              <label>
                Vacuna
                <input
                  name="vaccineName"
                  required
                  maxLength={120}
                  defaultValue={
                    mode === "plan" ? dose.vaccineName : (applied?.vaccineName ?? dose.vaccineName)
                  }
                />
              </label>
              <label>
                Dosis
                <input
                  name="doseLabel"
                  required
                  maxLength={120}
                  defaultValue={
                    mode === "plan" ? dose.doseLabel : (applied?.doseLabel ?? dose.doseLabel)
                  }
                />
              </label>
              {mode === "plan" ? (
                <label>
                  Edad prevista
                  <input name="ageLabel" maxLength={120} defaultValue={dose.ageLabel ?? ""} />
                </label>
              ) : (
                <>
                  <label>
                    Lugar
                    <input
                      name="place"
                      required
                      maxLength={120}
                      defaultValue={applied?.place ?? ""}
                    />
                  </label>
                  <label>
                    Lote · opcional
                    <input name="lot" maxLength={120} defaultValue={applied?.lot ?? ""} />
                  </label>
                </>
              )}
              <label>
                Notas
                <textarea
                  name="notes"
                  maxLength={4000}
                  rows={3}
                  defaultValue={mode === "plan" ? (dose.notes ?? "") : (applied?.notes ?? "")}
                />
              </label>
            </>
          )}
        </LocalForm>
      </div>
    </BottomSheet>
  );
}
