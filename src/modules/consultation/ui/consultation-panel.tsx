"use client";

import { useMemo, useState } from "react";
import type { ChildData } from "@/shared/application/peques-app";
import { usePeques } from "@/shared/ui/app-context";
import { field, LocalForm } from "@/shared/ui/local-form";
import { localDate } from "@/shared/domain/validation";
import { healthRegionLabels } from "@/modules/settings/domain/settings";
import { assignPlannedVaccineDoseStatuses } from "@/modules/vaccines/domain/vaccine-calendar";
import { summarizeSleepEntries } from "@/modules/sleep/application/sleep-summary";
import { buildWeightHistory } from "@/modules/weight/application/weight-history";
import { ActionIcon } from "@/shared/ui/action-icon";

export function ConsultationPanel({
  child,
  data,
}: {
  child: import("@/modules/profile/domain/child").Child;
  data: ChildData;
}) {
  const { app, family } = usePeques();
  const [message, setMessage] = useState<string | null>(null);
  const doses = assignPlannedVaccineDoseStatuses(data.planned, data.applied, new Date());
  const history = useMemo(() => buildWeightHistory(data.weights).slice(0, 8), [data.weights]);
  const sleepSummary = summarizeSleepEntries(data.sleeps.filter((entry) => entry.endedAt));
  const appointment = family.settings.nextAppointment;

  return (
    <main className="content-page consultation-page">
      <div className="section-heading">
        <div>
          <p className="kicker">Para la consulta</p>
          <h1>Resumen de {child.name}</h1>
        </div>
        <button className="primary-button" onClick={() => window.print()} type="button">
          <ActionIcon name="printer" size={18} /> Imprimir resumen
        </button>
      </div>
      <p className="medical-boundary">
        Este resumen organiza registros familiares. No es una historia clínica ni sustituye la
        valoración de vuestro equipo de pediatría.
      </p>

      <section className="local-panel report-sheet" aria-labelledby="report-profile-title">
        <h2 id="report-profile-title">Datos del perfil</h2>
        <dl className="report-grid">
          <dt>Fecha de nacimiento</dt>
          <dd>{child.birthDate}</dd>
          <dt>Comunidad del calendario</dt>
          <dd>{healthRegionLabels[family.settings.healthRegion]}</dd>
          <dt>Informe generado</dt>
          <dd>{localDate()}</dd>
          {child.gestationalAgeWeeks !== undefined && (
            <>
              <dt>Gestación registrada</dt>
              <dd>
                {child.gestationalAgeWeeks} semanas y {child.gestationalAgeDays ?? 0} días
              </dd>
            </>
          )}
        </dl>
      </section>

      <section className="local-panel report-sheet" aria-labelledby="report-appointment-title">
        <h2 id="report-appointment-title">Próxima cita</h2>
        {appointment ? (
          <div className="report-highlight">
            <strong>{appointment.title}</strong>
            <span>
              {appointment.date} · {appointment.place}
            </span>
            {appointment.notes && <p>{appointment.notes}</p>}
          </div>
        ) : (
          <p>No hay una próxima cita guardada.</p>
        )}
      </section>

      <section className="local-panel report-sheet" aria-labelledby="report-growth-title">
        <h2 id="report-growth-title">Crecimiento registrado</h2>
        {history.length ? (
          <div className="report-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Peso</th>
                  <th>Lugar</th>
                  <th>Cambio</th>
                </tr>
              </thead>
              <tbody>
                {history.map(({ entry, differenceGrams }) => (
                  <tr key={entry.id}>
                    <td>{entry.measuredOn}</td>
                    <td>{formatKg(entry.weightGrams)}</td>
                    <td>{entry.place}</td>
                    <td>{differenceGrams === null ? "—" : formatKg(differenceGrams)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Aún no hay pesos registrados.</p>
        )}
        <p className="form-help">
          Las gráficas de crecimiento deben interpretarse junto con el pediatra y la evolución
          completa.
        </p>
      </section>

      <section className="local-panel report-sheet" aria-labelledby="report-vaccine-title">
        <h2 id="report-vaccine-title">Vacunas para revisar</h2>
        <ul className="report-list">
          {doses
            .filter((dose) => dose.status !== "aplicada")
            .slice(0, 12)
            .map((dose) => (
              <li key={dose.id}>
                <strong>{dose.vaccineName}</strong>
                <span>
                  {dose.doseLabel} · {dose.plannedDate ?? "Fecha por confirmar"} · {dose.status}
                </span>
              </li>
            ))}
        </ul>
        {!doses.some((dose) => dose.status !== "aplicada") && (
          <p>No hay dosis pendientes en el plan local.</p>
        )}
      </section>

      <section className="local-panel report-sheet" aria-labelledby="report-sleep-title">
        <h2 id="report-sleep-title">Sueño registrado</h2>
        <p>
          {sleepSummary.completedEntries} descansos completados ·{" "}
          {formatMinutes(sleepSummary.totalMinutes)} acumulados en los registros disponibles.
        </p>
      </section>

      <section className="local-panel no-print" aria-labelledby="questions-title">
        <h2 id="questions-title">Preguntas para la consulta</h2>
        <LocalForm
          submitLabel="Añadir pregunta"
          onSuccess={() => setMessage("Pregunta añadida.")}
          action={(data) => app.settings.addConsultationQuestion(field(data, "question"))}
        >
          <label>
            Pregunta o preocupación
            <textarea name="question" rows={2} maxLength={4000} required />
          </label>
        </LocalForm>
        <ul className="question-list">
          {family.settings.consultationQuestions.map((question) => (
            <li key={question.id} data-completed={question.completed}>
              <label>
                <input
                  type="checkbox"
                  checked={question.completed}
                  onChange={(event) =>
                    void app.settings.toggleConsultationQuestion(question.id, event.target.checked)
                  }
                />{" "}
                <span>{question.text}</span>
              </label>
              <button
                className="text-button"
                aria-label={`Borrar pregunta: ${question.text}`}
                title={`Borrar pregunta: ${question.text}`}
                onClick={() => void app.settings.deleteConsultationQuestion(question.id)}
                type="button"
              >
                <ActionIcon name="trash" size={18} />
              </button>
            </li>
          ))}
        </ul>
        {message && <p role="status">{message}</p>}
      </section>
    </main>
  );
}

function formatKg(grams: number) {
  return `${(grams / 1000).toLocaleString("es-ES", { maximumFractionDigits: 3 })} kg`;
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} h ${rest} min` : `${rest} min`;
}
