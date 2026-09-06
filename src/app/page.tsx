"use client";
import { usePeques } from "@/shared/ui/app-context";
import { LiveAge } from "@/modules/profile/ui/live-age";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocalData } from "@/shared/ui/use-local-data";
import { useClock } from "@/shared/ui/use-clock";
import { buildHomeAgenda } from "@/modules/home/application/home-agenda";
import { buildWeightTrendSummary } from "@/modules/weight/application/weight-trend-summary";
import { assignPlannedVaccineDoseStatuses } from "@/modules/vaccines/domain/vaccine-calendar";
import { deriveCalendarEvents } from "@/modules/calendar/application/derive-calendar-events";
import { filterCalendarEvents } from "@/modules/calendar/domain/calendar-event";
import { formatCalendarEventDate } from "@/modules/calendar/ui/calendar-date-format";
import { WeightForm } from "@/modules/weight/ui/weight-view";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import styles from "./(app)/page.module.css";
import sheetStyles from "./(app)/peso/page.module.css";

export default function Home() {
  const { app, family } = usePeques();
  const child = family.activeChild;
  const watch = useMemo(() => app.watchChild(child?.id ?? ""), [app, child?.id]);
  const state = useLocalData(watch);
  const now = useClock();
  const [sheet, setSheet] = useState<"add" | "weight" | null>(null);
  if (!child) return null;
  const data = state?.data;
  const summary = buildWeightTrendSummary(data?.weights ?? [], now);
  const doses = assignPlannedVaccineDoseStatuses(data?.planned ?? [], data?.applied ?? [], now);
  const agenda = buildHomeAgenda({ today: now, vaccineDoses: doses, weightSummary: summary });
  const upcoming = data
    ? filterCalendarEvents(deriveCalendarEvents(child, data), { now }).slice(0, 2)
    : [];
  const activeSleep = data?.sleeps.find((entry) => !entry.endedAt);
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <p className={styles.kicker}>Su día a día</p>
        <h1>{child.name}</h1>
        <LiveAge profile={child} initialNow={now.toISOString()} />
        <p className={styles.birthDate}>
          Nacimiento: {child.birthDate}
          {child.birthTime ? ` · ${child.birthTime}` : ""}
        </p>
        {child.healthId && <p>Identificador sanitario: {child.healthId}</p>}
      </section>
      {state?.error ? (
        <p role="alert">No se pudieron leer los datos locales.</p>
      ) : !data ? (
        <p role="status">Cargando resúmenes…</p>
      ) : (
        <>
          <section className={styles.reviewSoon} data-kind={agenda.reviewPrompt?.kind ?? "calm"}>
            <div>
              <span>Para revisar</span>
              <h2>{agenda.reviewPrompt?.title ?? "Todo a mano"}</h2>
              <p>
                {agenda.reviewPrompt?.detail ?? "Consulta y añade registros cuando lo necesites."}
              </p>
            </div>
            <Link href={agenda.reviewPrompt?.href ?? "/vacunas"}>Ver</Link>
          </section>
          <section className={styles.agenda}>
            <div className={styles.sectionTitle}>
              <h2>Qué toca hoy</h2>
              <Link href="/vacunas">Ver vacunas</Link>
            </div>
            {agenda.items.length ? (
              <ol>
                {agenda.items.slice(0, 4).map((item) => (
                  <li key={item.id} data-kind={item.kind}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </div>
                    <Link href={item.href}>{item.date}</Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No hay avisos con fecha. Las campañas sin fecha se revisan en Vacunas.</p>
            )}
          </section>
          <section className="local-panel">
            <div className={styles.sectionTitle}>
              <h2>Último peso</h2>
              <Link href="/peso">Ver evolución</Link>
            </div>
            {summary.latest ? (
              <>
                <strong>
                  {summary.latest.weightGrams.toLocaleString("es-ES")} g ·{" "}
                  {summary.latest.measuredOn}
                </strong>
                <p>
                  {summary.differenceGrams === null
                    ? "Primer registro"
                    : `${summary.differenceGrams > 0 ? "+" : ""}${summary.differenceGrams} g desde el anterior`}
                  {summary.averageGramsPerDay !== null
                    ? ` · ${summary.averageGramsPerDay} g/día`
                    : ""}
                </p>
              </>
            ) : (
              <p>Aún no hay pesos registrados.</p>
            )}
          </section>
          <section className="local-panel">
            <div className={styles.sectionTitle}>
              <h2>Sueño</h2>
              <Link href="/sueno">Ver sueño</Link>
            </div>
            <p>
              {activeSleep
                ? `${activeSleep.kind === "nap" ? "Siesta" : "Noche"} en curso · ${Math.max(0, Math.floor((now.getTime() - Date.parse(activeSleep.startedAt)) / 60000))} min`
                : "Sin cronómetro activo"}
            </p>
          </section>
          <section className={styles.calendarAgenda}>
            <div className={styles.sectionTitle}>
              <h2>Próximos eventos</h2>
              <Link href="/calendario">Ver calendario</Link>
            </div>
            {upcoming.length ? (
              <ol>
                {upcoming.map((event) => (
                  <li key={event.id}>
                    <div>
                      <strong>{event.title}</strong>
                      <span>{formatCalendarEventDate(event.startsAt, event.isAllDay, now)}</span>
                    </div>
                    <Link href={event.href}>Ver</Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No hay próximos eventos con fecha.</p>
            )}
          </section>
        </>
      )}
      <div className={styles.quickActions}>
        <button className={styles.addButton} onClick={() => setSheet("add")}>
          <span aria-hidden="true">+</span> Añadir
        </button>
      </div>
      {sheet && (
        <BottomSheet
          ariaLabel="Añadir registro"
          labelledBy="home-add-title"
          onClose={() => setSheet(null)}
          styles={sheetStyles}
        >
          <div className="sheet-content">
            <h2 id="home-add-title">{sheet === "weight" ? "Añadir peso" : "Añadir registro"}</h2>
            {sheet === "weight" ? (
              <WeightForm childId={child.id} onDone={() => setSheet(null)} />
            ) : (
              <div className={styles.addMenuOptions}>
                <button className={styles.addMenuButton} onClick={() => setSheet("weight")}>
                  Peso
                </button>
                <Link
                  className={styles.addMenuButton}
                  href="/vacunas"
                  onClick={() => setSheet(null)}
                >
                  Vacuna
                </Link>
                <Link className={styles.addMenuButton} href="/sueno" onClick={() => setSheet(null)}>
                  Sueño
                </Link>
                <Link className={styles.addMenuButton} href="/viaje" onClick={() => setSheet(null)}>
                  Elemento de viaje
                </Link>
              </div>
            )}
          </div>
        </BottomSheet>
      )}
    </main>
  );
}
