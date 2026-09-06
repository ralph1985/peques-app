import { describe, expect, it } from "vitest";
import { deriveCalendarEvents } from "./derive-calendar-events";
import { filterCalendarEvents, isPastEvent } from "../domain/calendar-event";
import type { Child } from "@/modules/profile/domain/child";
import type { ChildData } from "@/shared/application/peques-app";

const child: Child = {
  id: crypto.randomUUID(),
  name: "Peque ficticio A",
  birthDate: "2024-01-01",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};
const empty = (): ChildData => ({ weights: [], planned: [], applied: [], sleeps: [] });

describe("local derived calendar", () => {
  it("identifies children and excludes another child's records even with mixed input", () => {
    const data = empty();
    data.weights = [child.id, crypto.randomUUID()].map((childId) => ({
      id: crypto.randomUUID(),
      childId,
      measuredOn: "2024-02-01",
      weightGrams: 6000,
      place: "pediatra",
    }));
    const events = deriveCalendarEvents(child, data);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      childId: child.id,
      title: "Peque ficticio A · Peso · 6000 g",
      href: "/peso",
    });
    expect(events[0].href).not.toContain(child.id);
  });

  it("replaces applied plans with actual dates and omits undated campaigns", () => {
    const data = empty();
    const plan = {
      id: crypto.randomUUID(),
      childId: child.id,
      vaccineName: "Vacuna ficticia",
      doseLabel: "Dosis ficticia",
      plannedDate: "2024-03-01",
      ageLabel: null,
      notes: null,
    };
    data.planned = [plan, { ...plan, id: crypto.randomUUID(), plannedDate: null }];
    data.applied = [
      {
        ...plan,
        id: crypto.randomUUID(),
        plannedDoseId: plan.id,
        appliedOn: "2024-03-04",
        place: "Centro ficticio",
        lot: null,
      },
    ];
    const events = deriveCalendarEvents(child, data);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ dateKey: "2024-03-04", location: "Centro ficticio" });
  });

  it("keeps active timers visible and groups timestamps in Madrid, not UTC", () => {
    const data = empty();
    data.sleeps = [
      {
        id: crypto.randomUUID(),
        childId: child.id,
        kind: "night",
        startedAt: "2024-07-01T23:30:00.000Z",
        endedAt: null,
        createdAt: "2024-07-01T23:30:00.000Z",
        updatedAt: "2024-07-01T23:30:00.000Z",
      },
    ];
    const events = deriveCalendarEvents(child, data);
    expect(events[0].dateKey).toBe("2024-07-02");
    expect(
      filterCalendarEvents(events, { now: new Date("2024-07-03T00:00:00.000Z") }),
    ).toHaveLength(1);
  });

  it("treats all-day events as past at Madrid midnight and does not mutate input", () => {
    const data = empty();
    data.weights = [
      {
        id: crypto.randomUUID(),
        childId: child.id,
        measuredOn: "2024-07-01",
        weightGrams: 6000,
        place: "pediatra",
      },
    ];
    const events = deriveCalendarEvents(child, data);
    expect(isPastEvent(events[0], new Date("2024-07-01T21:59:00.000Z"))).toBe(false);
    expect(isPastEvent(events[0], new Date("2024-07-01T22:00:00.000Z"))).toBe(true);
    expect(filterCalendarEvents(events, { now: new Date("2024-07-02T12:00:00.000Z") })).toEqual([]);
    expect(events).toHaveLength(1);
  });
});
