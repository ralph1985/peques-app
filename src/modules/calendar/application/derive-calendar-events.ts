import type { Child } from "@/modules/profile/domain/child";
import type { ChildData } from "@/shared/application/peques-app";
import { localDate } from "@/shared/domain/validation";
import { sortCalendarEvents, type CalendarEvent } from "../domain/calendar-event";

/** Derived views only: no extra stored copies, network feeds or personal-data URLs. */
export function deriveCalendarEvents(child: Child, data: ChildData): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const day = (
    id: string,
    date: string,
    title: string,
    href: CalendarEvent["href"],
    location: string | null,
    description: string | null,
  ) => {
    events.push({
      id,
      childId: child.id,
      title: `${child.name} · ${title}`,
      dateKey: date,
      startsAt: `${date}T00:00:00.000Z`,
      endsAt: `${date}T23:59:59.999Z`,
      isAllDay: true,
      href,
      location,
      description,
    });
  };
  const appliedPlans = new Set(data.applied.map((dose) => dose.plannedDoseId));
  for (const dose of data.planned) {
    if (dose.childId !== child.id || !dose.plannedDate || appliedPlans.has(dose.id)) continue;
    day(
      `planned:${dose.id}`,
      dose.plannedDate,
      `${dose.vaccineName} · ${dose.doseLabel}`,
      "/vacunas",
      null,
      dose.notes,
    );
  }
  for (const dose of data.applied) {
    if (dose.childId !== child.id) continue;
    day(
      `applied:${dose.id}`,
      dose.appliedOn,
      `${dose.vaccineName} · Aplicada`,
      "/vacunas",
      dose.place,
      dose.notes,
    );
  }
  for (const weight of data.weights) {
    if (weight.childId !== child.id) continue;
    day(
      `weight:${weight.id}`,
      weight.measuredOn,
      `Peso · ${weight.weightGrams} g`,
      "/peso",
      weight.place,
      weight.notes ?? null,
    );
  }
  for (const sleep of data.sleeps) {
    if (sleep.childId !== child.id) continue;
    events.push({
      id: `sleep:${sleep.id}`,
      childId: child.id,
      title: `${child.name} · ${sleep.kind === "nap" ? "Siesta" : "Sueño nocturno"}${sleep.endedAt ? "" : " en curso"}`,
      dateKey: localDate(new Date(sleep.startedAt)),
      startsAt: sleep.startedAt,
      endsAt: sleep.endedAt ?? "9999-12-31T23:59:59.999Z",
      isAllDay: false,
      location: null,
      description: null,
      href: "/sueno",
    });
  }
  return sortCalendarEvents(events);
}
