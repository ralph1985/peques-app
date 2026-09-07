"use client";

import { useState } from "react";
import type { GrowthMeasurement, GrowthMeasurementKind } from "../domain/growth-measurement";
import { registerGrowthMeasurement } from "../application/register-growth-measurement";
import { updateGrowthMeasurement } from "../application/update-growth-measurement";
import { deleteGrowthMeasurement } from "../application/delete-growth-measurement";
import { usePeques } from "@/shared/ui/app-context";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { field, LocalForm } from "@/shared/ui/local-form";
import { assert, localDate } from "@/shared/domain/validation";
import styles from "@/app/(app)/peso/page.module.css";
import { ActionIcon } from "@/shared/ui/action-icon";

export function GrowthMeasurementPanel({
  childId,
  birthDate,
  measurements,
}: {
  childId: string;
  birthDate: string;
  measurements: GrowthMeasurement[];
}) {
  const { app } = usePeques();
  const [sheet, setSheet] = useState<{
    mode: "add" | "edit" | "delete";
    entry?: GrowthMeasurement;
  } | null>(null);
  return (
    <section
      className={styles.panel}
      data-tutorial-section="growth-measurements"
      data-tutorial-target="growth-measurements"
    >
      <div className={styles.sectionTitle}>
        <h2>Otras medidas</h2>
        <button className="text-button" onClick={() => setSheet({ mode: "add" })} type="button">
          <ActionIcon name="plus" size={18} /> Añadir medida
        </button>
      </div>
      {!measurements.length ? (
        <p className={styles.empty}>Longitud, estatura y perímetro cefálico se guardan aquí.</p>
      ) : (
        <ol className={styles.history}>
          {[...measurements]
            .sort((a, b) => b.measuredOn.localeCompare(a.measuredOn))
            .map((entry) => (
              <li key={entry.id}>
                <div className={styles.historySummary}>
                  <div>
                    <strong>{formatMeasurement(entry)}</strong>
                    <span>
                      {formatMeasurementKind(entry)} · {entry.measuredOn}
                    </span>
                    {entry.notes && <span>{entry.notes}</span>}
                  </div>
                </div>
                <div className={styles.historyActions}>
                  <button
                    className={styles.iconButton}
                    aria-label={`Editar medida del ${entry.measuredOn}`}
                    title={`Editar medida del ${entry.measuredOn}`}
                    onClick={() => setSheet({ mode: "edit", entry })}
                    type="button"
                  >
                    <ActionIcon name="edit" />
                  </button>
                  <button
                    className={styles.iconButton}
                    aria-label={`Borrar medida del ${entry.measuredOn}`}
                    title={`Borrar medida del ${entry.measuredOn}`}
                    onClick={() => setSheet({ mode: "delete", entry })}
                    type="button"
                  >
                    <ActionIcon name="trash" />
                  </button>
                </div>
              </li>
            ))}
        </ol>
      )}
      {sheet && (
        <BottomSheet
          ariaLabel="Gestionar medida"
          labelledBy="growth-measurement-title"
          onClose={() => setSheet(null)}
          styles={styles}
        >
          <div className="sheet-content">
            <h2 id="growth-measurement-title">
              {sheet.mode === "delete"
                ? "Borrar medida"
                : sheet.mode === "edit"
                  ? "Editar medida"
                  : "Añadir medida"}
            </h2>
            {sheet.mode === "delete" && sheet.entry ? (
              <LocalForm
                submitLabel="Borrar medida"
                onCancel={() => setSheet(null)}
                onSuccess={() => setSheet(null)}
                action={() =>
                  deleteGrowthMeasurement(app.forChild(childId).growth, sheet.entry!.id)
                }
              >
                <p>
                  ¿Borrar la medida de {formatMeasurement(sheet.entry)} del {sheet.entry.measuredOn}
                  ?
                </p>
              </LocalForm>
            ) : (
              <GrowthMeasurementForm
                childId={childId}
                birthDate={birthDate}
                entry={sheet.entry}
                onDone={() => setSheet(null)}
              />
            )}
          </div>
        </BottomSheet>
      )}
    </section>
  );
}

function GrowthMeasurementForm({
  childId,
  birthDate,
  entry,
  onDone,
}: {
  childId: string;
  birthDate: string;
  entry?: GrowthMeasurement;
  onDone: () => void;
}) {
  const { app } = usePeques();
  return (
    <LocalForm
      submitLabel={entry ? "Guardar cambios" : "Guardar medida"}
      onSuccess={onDone}
      onCancel={onDone}
      action={(data) => {
        const kind = field(data, "kind");
        assert(kind === "stature" || kind === "headCircumference", "Tipo de medida no válido.");
        const position = field(data, "position");
        assert(position === "length" || position === "height", "Forma de medir no válida.");
        const input = {
          measuredOn: field(data, "measuredOn"),
          kind,
          position: kind === "stature" ? position : undefined,
          valueMillimeters: Math.round(
            Number(field(data, "valueCentimeters").replace(",", ".")) * 10,
          ),
          notes: field(data, "notes"),
        } as const;
        return entry
          ? updateGrowthMeasurement(app.forChild(childId).growth, entry.id, input)
          : registerGrowthMeasurement(app.forChild(childId).growth, input);
      }}
    >
      <label>
        Fecha
        <input
          name="measuredOn"
          type="date"
          required
          min={birthDate}
          defaultValue={entry?.measuredOn ?? localDate()}
        />
      </label>
      <label>
        Medida
        <select name="kind" defaultValue={entry?.kind ?? "stature"}>
          <option value="stature">Longitud / estatura</option>
          <option value="headCircumference">Perímetro cefálico</option>
        </select>
      </label>
      <label>
        Forma de medir
        <select name="position" defaultValue={entry?.position ?? "length"}>
          <option value="length">Longitud tumbado</option>
          <option value="height">Estatura de pie</option>
        </select>
      </label>
      <label>
        Centímetros
        <input
          name="valueCentimeters"
          type="number"
          inputMode="decimal"
          min={20}
          max={220}
          step={0.1}
          required
          defaultValue={entry ? entry.valueMillimeters / 10 : undefined}
        />
      </label>
      <label>
        Notas
        <textarea name="notes" rows={3} maxLength={4000} defaultValue={entry?.notes ?? ""} />
      </label>
    </LocalForm>
  );
}

function formatMeasurement(entry: GrowthMeasurement) {
  return `${(entry.valueMillimeters / 10).toLocaleString("es-ES", { maximumFractionDigits: 1 })} cm`;
}

export function measurementKindLabel(kind: GrowthMeasurementKind) {
  return kind === "stature" ? "Longitud / estatura" : "Perímetro cefálico";
}

function formatMeasurementKind(entry: GrowthMeasurement) {
  if (entry.kind === "headCircumference") return "Perímetro cefálico";
  return entry.position === "height" ? "Estatura de pie" : "Longitud tumbado";
}
