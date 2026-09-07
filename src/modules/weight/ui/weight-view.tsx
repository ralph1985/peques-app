"use client";
import { useMemo, useState } from "react";
import type { Child } from "@/modules/profile/domain/child";
import type { WeightEntry } from "../domain/weight-entry";
import { isWeightPlace } from "../domain/weight-entry";
import { usePeques } from "@/shared/ui/app-context";
import { LocalForm, field } from "@/shared/ui/local-form";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { assert, localDate } from "@/shared/domain/validation";
import { registerWeightEntry } from "../application/register-weight-entry";
import { updateWeightEntry } from "../application/update-weight-entry";
import { deleteWeightEntry } from "../application/delete-weight-entry";
import { buildWeightHistory } from "../application/weight-history";
import {
  filterWeightEntries,
  formatWeightFilterLabel,
  weightFilterValues,
  type WeightFilter,
} from "../application/weight-filter";
import { WeightChart } from "./weight-chart";
import { GrowthChart } from "@/modules/growth/ui/growth-chart";
import { GrowthMeasurementPanel } from "@/modules/growth/ui/growth-measurement-view";
import type { GrowthIndicator } from "@/modules/growth/application/who-growth";
import styles from "@/app/(app)/peso/page.module.css";
import { growthReferenceBirthDate } from "@/modules/profile/domain/baby-profile";
import { ActionIcon } from "@/shared/ui/action-icon";

export function WeightForm({
  childId,
  birthDate,
  entry,
  onDone,
}: {
  childId: string;
  birthDate: string;
  entry?: WeightEntry;
  onDone: () => void;
}) {
  const { app } = usePeques();
  const repository = app.forChild(childId).weight;
  return (
    <LocalForm
      submitLabel={entry ? "Guardar cambios" : "Guardar peso"}
      onSuccess={onDone}
      onCancel={onDone}
      action={(data) => {
        const place = field(data, "place");
        assert(isWeightPlace(place), "Lugar no válido.");
        const input = {
          measuredOn: field(data, "measuredOn"),
          weightGrams: Math.round(Number(field(data, "weightKg").replace(",", ".")) * 1000),
          place,
          notes: field(data, "notes"),
        };
        return entry
          ? updateWeightEntry(repository, entry.id, input)
          : registerWeightEntry(repository, input);
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
        Peso (kg)
        <input
          name="weightKg"
          type="number"
          inputMode="decimal"
          min={0.2}
          max={150}
          step={0.001}
          required
          defaultValue={entry ? entry.weightGrams / 1000 : undefined}
        />
      </label>
      <label>
        Lugar
        <select name="place" defaultValue={entry?.place ?? "pediatra"}>
          <option value="hospital">Hospital</option>
          <option value="pediatra">Pediatra</option>
          <option value="farmacia">Farmacia</option>
        </select>
      </label>
      <label>
        Notas
        <textarea name="notes" rows={3} maxLength={4000} defaultValue={entry?.notes ?? ""} />
      </label>
    </LocalForm>
  );
}

export function WeightCreateButton({
  childId,
  birthDate,
  compact = false,
}: {
  childId: string;
  birthDate: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={compact ? "text-button" : styles.floatingAddButton}
        data-tutorial-target="weight-add"
        onClick={() => setOpen(true)}
        aria-label="Añadir peso"
        title="Añadir peso"
      >
        {compact ? (
          <>
            <ActionIcon name="plus" size={18} /> Añadir peso
          </>
        ) : (
          <ActionIcon name="plus" size={27} />
        )}
      </button>
      {open && (
        <BottomSheet
          ariaLabel="Añadir peso"
          labelledBy="new-weight-title"
          onClose={() => setOpen(false)}
          styles={styles}
        >
          <div className="sheet-content">
            <h2 id="new-weight-title">Añadir peso</h2>
            <WeightForm childId={childId} birthDate={birthDate} onDone={() => setOpen(false)} />
          </div>
        </BottomSheet>
      )}
    </>
  );
}

export function WeightView({
  child,
  entries,
  growthMeasurements,
}: {
  child: Child;
  entries: WeightEntry[];
  growthMeasurements: import("@/modules/growth/domain/growth-measurement").GrowthMeasurement[];
}) {
  const { app } = usePeques();
  const [filter, setFilter] = useState<WeightFilter>("all");
  const [indicator, setIndicator] = useState<GrowthIndicator>("weightForAge");
  const [sheet, setSheet] = useState<{ mode: "edit" | "delete"; entry: WeightEntry } | null>(null);
  const visible = useMemo(() => filterWeightEntries(entries, filter), [entries, filter]);
  const growthBirthDate = growthReferenceBirthDate(child);
  return (
    <>
      <section className={styles.panel} data-tutorial-section="growth">
        <div className={styles.sectionTitle}>
          <h2>Evolución del peso</h2>
          <span>{visible.length} registros</span>
        </div>
        <div className="filter-row" role="group" aria-label="Filtrar pesos por lugar">
          {weightFilterValues.map((value) => (
            <button
              className="text-button"
              key={value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {formatWeightFilterLabel(value)}
            </button>
          ))}
        </div>
        <label className={styles.chartIndicatorSelect}>
          Gráfica
          <select
            data-tutorial-target="growth-indicator"
            name="growth-indicator"
            value={indicator}
            onChange={(event) => setIndicator(event.target.value as GrowthIndicator)}
          >
            <option value="weightForAge">Peso para la edad</option>
            <option value="statureForAge">Longitud / estatura para la edad</option>
            <option value="bmiForAge">IMC para la edad</option>
            <option value="headCircumferenceForAge">Perímetro cefálico para la edad</option>
            <option value="weightForLength">Peso para la longitud</option>
            <option value="weightForHeight">Peso para la estatura</option>
          </select>
        </label>
        {indicator === "weightForAge" ? (
          <WeightChart birthDate={growthBirthDate} sex={child.sex} entries={visible} />
        ) : (
          <GrowthChart
            indicator={indicator}
            birthDate={growthBirthDate}
            sex={child.sex}
            weights={visible}
            measurements={growthMeasurements}
          />
        )}
      </section>
      <section className={styles.panel}>
        <h2>Histórico</h2>
        {!visible.length && <p className={styles.empty}>Aún no hay pesos en este filtro.</p>}
        <ol className={styles.history}>
          {buildWeightHistory(visible).map(({ entry, differenceGrams }) => (
            <li key={entry.id}>
              <div className={styles.historySummary}>
                <div>
                  <strong>{formatWeight(entry.weightGrams)}</strong>
                  <span>
                    {formatWeightFilterLabel(entry.place)} ·{" "}
                    <time dateTime={entry.measuredOn}>{entry.measuredOn}</time>
                  </span>
                  <span>
                    {differenceGrams === null
                      ? "Sin comparación"
                      : `${differenceGrams > 0 ? "+" : ""}${formatWeight(differenceGrams)} desde el anterior`}
                  </span>
                  {entry.notes && <span>{entry.notes}</span>}
                </div>
              </div>
              <div className={styles.historyActions}>
                <button
                  className={styles.iconButton}
                  onClick={() => setSheet({ mode: "edit", entry })}
                  aria-label={`Editar peso del ${entry.measuredOn}`}
                  title={`Editar peso del ${entry.measuredOn}`}
                >
                  <ActionIcon name="edit" />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => setSheet({ mode: "delete", entry })}
                  aria-label={`Borrar peso del ${entry.measuredOn}`}
                  title={`Borrar peso del ${entry.measuredOn}`}
                >
                  <ActionIcon name="trash" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <GrowthMeasurementPanel
        childId={child.id}
        birthDate={child.birthDate}
        measurements={growthMeasurements}
      />
      <WeightCreateButton childId={child.id} birthDate={child.birthDate} />
      {sheet && (
        <BottomSheet
          ariaLabel="Gestionar peso"
          labelledBy="weight-edit-title"
          onClose={() => setSheet(null)}
          styles={styles}
        >
          <div className="sheet-content">
            <h2 id="weight-edit-title">{sheet.mode === "edit" ? "Editar peso" : "Borrar peso"}</h2>
            {sheet.mode === "edit" ? (
              <WeightForm
                childId={child.id}
                birthDate={child.birthDate}
                entry={sheet.entry}
                onDone={() => setSheet(null)}
              />
            ) : (
              <LocalForm
                submitLabel="Borrar peso"
                onCancel={() => setSheet(null)}
                onSuccess={() => setSheet(null)}
                action={() => deleteWeightEntry(app.forChild(child.id).weight, sheet.entry.id)}
              >
                <p>
                  ¿Borrar el peso de {formatWeight(sheet.entry.weightGrams)} del{" "}
                  {sheet.entry.measuredOn}? Esta acción no se puede deshacer.
                </p>
              </LocalForm>
            )}
          </div>
        </BottomSheet>
      )}
    </>
  );
}

function formatWeight(grams: number) {
  return `${(grams / 1000).toLocaleString("es-ES", { maximumFractionDigits: 3 })} kg`;
}
