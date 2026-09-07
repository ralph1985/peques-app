"use client";

import { useState } from "react";
import { usePeques } from "@/shared/ui/app-context";
import { field, LocalForm } from "@/shared/ui/local-form";
import { healthRegionLabels, healthRegions, type HealthRegion } from "../domain/settings";

export function HealthSettingsPanel() {
  const { app, family } = usePeques();
  const [pendingRegion, setPendingRegion] = useState<HealthRegion | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const current = family.settings.healthRegion;
  async function applyRegion() {
    if (!pendingRegion || pendingRegion === current) return;
    await app.children.rebuildVaccinePlans(pendingRegion);
    setMessage(`Calendario actualizado para ${healthRegionLabels[pendingRegion]}.`);
    setPendingRegion(null);
  }
  return (
    <section className="local-panel" aria-labelledby="health-settings-title">
      <h2 id="health-settings-title">Calendario sanitario</h2>
      <p>
        Elige la comunidad de referencia de toda la familia. Peques conserva las vacunas aplicadas y
        solo sustituye el plan pendiente después de confirmarlo.
      </p>
      <label>
        Comunidad
        <select
          value={pendingRegion ?? current}
          onChange={(event) => setPendingRegion(event.target.value as HealthRegion)}
        >
          {healthRegions.map((region) => (
            <option key={region} value={region}>
              {healthRegionLabels[region]}
            </option>
          ))}
        </select>
      </label>
      {pendingRegion && pendingRegion !== current && (
        <div className="confirmation-panel">
          <strong>Revisar cambio de calendario</strong>
          <p>
            Se conservarán los registros aplicados y las vacunas históricas. Se eliminarán las dosis
            pendientes del plan actual y se generará el plan de la nueva comunidad.
          </p>
          <div className="row-actions">
            <button className="primary-button" onClick={() => void applyRegion()} type="button">
              Confirmar actualización
            </button>
            <button className="text-button" onClick={() => setPendingRegion(null)} type="button">
              Cancelar
            </button>
          </div>
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

export function AppointmentPanel() {
  const { app, family } = usePeques();
  const appointment = family.settings.nextAppointment;
  return (
    <section className="local-panel" aria-labelledby="appointment-settings-title">
      <h2 id="appointment-settings-title">Próxima cita</h2>
      <LocalForm
        submitLabel={appointment ? "Guardar cambios" : "Guardar cita"}
        onSuccess={() => undefined}
        onCancel={() => undefined}
        action={(data) =>
          app.settings.updateAppointment({
            date: field(data, "date"),
            title: field(data, "title"),
            place: field(data, "place"),
            notes: field(data, "notes") || null,
          })
        }
      >
        <label>
          Fecha
          <input name="date" type="date" required defaultValue={appointment?.date ?? ""} />
        </label>
        <label>
          Motivo o tipo de cita
          <input
            name="title"
            required
            maxLength={160}
            defaultValue={appointment?.title ?? "Revisión pediátrica"}
          />
        </label>
        <label>
          Centro o lugar
          <input name="place" required maxLength={160} defaultValue={appointment?.place ?? ""} />
        </label>
        <label>
          Notas
          <textarea
            name="notes"
            rows={2}
            maxLength={4000}
            defaultValue={appointment?.notes ?? ""}
          />
        </label>
      </LocalForm>
      {appointment && (
        <button
          className="text-button"
          onClick={() => void app.settings.updateAppointment(null)}
          type="button"
        >
          Quitar próxima cita
        </button>
      )}
    </section>
  );
}
