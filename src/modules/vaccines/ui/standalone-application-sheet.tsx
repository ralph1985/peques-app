"use client";
import type { AppliedVaccineDose } from "../domain/vaccine-calendar";
import { usePeques } from "@/shared/ui/app-context";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { LocalForm, field } from "@/shared/ui/local-form";
import { localDate } from "@/shared/domain/validation";
import { markVaccineDoseApplied } from "../application/mark-vaccine-dose-applied";
import { updateAppliedVaccineDose } from "../application/update-applied-vaccine-dose";
import { reopenPlannedVaccineDose } from "../application/reopen-planned-vaccine-dose";
import styles from "@/app/(app)/vacunas/page.module.css";

export function StandaloneApplicationSheet({
  childId,
  entry,
  deleting = false,
  onClose,
}: {
  childId: string;
  entry?: AppliedVaccineDose;
  deleting?: boolean;
  onClose: () => void;
}) {
  const { app } = usePeques();
  const repository = app.forChild(childId).vaccines;
  const title = deleting
    ? "Borrar aplicación"
    : entry
      ? "Editar aplicación"
      : "Añadir vacuna aplicada";
  return (
    <BottomSheet ariaLabel={title} labelledBy="standalone-title" onClose={onClose} styles={styles}>
      <div className="sheet-content">
        <h2 id="standalone-title">{title}</h2>
        <LocalForm
          submitLabel={deleting ? "Borrar aplicación" : "Guardar vacuna"}
          onSuccess={onClose}
          onCancel={onClose}
          action={(form) => {
            if (deleting && entry) return reopenPlannedVaccineDose(repository, entry.id);
            const input = {
              plannedDoseId: null,
              appliedOn: field(form, "date"),
              vaccineName: field(form, "vaccineName"),
              doseLabel: field(form, "doseLabel"),
              place: field(form, "place"),
              lot: field(form, "lot") || null,
              notes: field(form, "notes") || null,
            };
            return entry
              ? updateAppliedVaccineDose(repository, entry.id, input)
              : markVaccineDoseApplied(repository, input);
          }}
        >
          {deleting ? (
            <p>
              ¿Borrar {entry?.vaccineName} y todos los datos de esta aplicación? No se puede
              deshacer.
            </p>
          ) : (
            <>
              <label>
                Fecha de aplicación
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={entry?.appliedOn ?? localDate()}
                />
              </label>
              <label>
                Vacuna
                <input
                  name="vaccineName"
                  required
                  maxLength={120}
                  defaultValue={entry?.vaccineName}
                />
              </label>
              <label>
                Dosis
                <input name="doseLabel" required maxLength={120} defaultValue={entry?.doseLabel} />
              </label>
              <label>
                Lugar
                <input name="place" required maxLength={120} defaultValue={entry?.place} />
              </label>
              <label>
                Lote · opcional
                <input name="lot" maxLength={120} defaultValue={entry?.lot ?? ""} />
              </label>
              <label>
                Notas
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={4000}
                  defaultValue={entry?.notes ?? ""}
                />
              </label>
            </>
          )}
        </LocalForm>
      </div>
    </BottomSheet>
  );
}
