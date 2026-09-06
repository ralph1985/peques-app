"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePeques } from "@/shared/ui/app-context";
import { useLocalData } from "@/shared/ui/use-local-data";
import { errorMessage } from "@/shared/ui/local-form";
import { CalendarView } from "@/modules/calendar/ui/calendar-view";
import { deriveCalendarEvents } from "@/modules/calendar/application/derive-calendar-events";

export default function CalendarPage() {
  const { app, family } = usePeques();
  const router = useRouter();
  const result = useLocalData(app.watchAllChildren);
  const [error, setError] = useState<string | null>(null);
  const all = family.settings.calendarAllChildren;
  const events = useMemo(
    () =>
      (result?.data ?? [])
        .filter(({ child }) => all || child.id === family.activeChild?.id)
        .flatMap(({ child, data }) => deriveCalendarEvents(child, data)),
    [result?.data, all, family.activeChild?.id],
  );
  return (
    <main className="content-page">
      <h1>Calendario</h1>
      <p>Pesos, vacunas y sueño guardados en este dispositivo. Horas de Madrid.</p>
      <label>
        <input
          type="checkbox"
          checked={all}
          onChange={async (event) => {
            try {
              await app.settings.update({ calendarAllChildren: event.target.checked });
              setError(null);
            } catch (cause) {
              setError(errorMessage(cause));
            }
          }}
        />{" "}
        Todos los hijos
      </label>
      {(error || Boolean(result?.error)) && (
        <p role="alert">{error || errorMessage(result?.error)}</p>
      )}
      {!result?.data ? (
        <p role="status">Cargando calendario…</p>
      ) : (
        <CalendarView
          key={String(all)}
          events={events}
          onOpen={async (event) => {
            try {
              await app.children.select(event.childId);
              router.push(event.href);
            } catch (cause) {
              setError(errorMessage(cause));
            }
          }}
        />
      )}
    </main>
  );
}
