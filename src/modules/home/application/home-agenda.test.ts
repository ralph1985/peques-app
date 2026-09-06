import { expect, it } from "vitest";
import { buildHomeAgenda } from "./home-agenda";
import { buildWeightTrendSummary } from "@/modules/weight/application/weight-trend-summary";
import type { PlannedVaccineDoseWithStatus } from "@/modules/vaccines/domain/vaccine-calendar";

it("does not invent an appointment for an undated campaign", () => {
  const today = new Date("2024-03-01T12:00:00.000Z");
  const dose: PlannedVaccineDoseWithStatus = {
    id: crypto.randomUUID(),
    childId: crypto.randomUUID(),
    vaccineName: "Campaña ficticia",
    doseLabel: "Por confirmar",
    plannedDate: null,
    ageLabel: null,
    notes: null,
    appliedOn: null,
    application: null,
    status: "pendiente",
  };
  expect(
    buildHomeAgenda({
      today,
      vaccineDoses: [dose],
      weightSummary: buildWeightTrendSummary([], today),
    }),
  ).toEqual({ items: [], reviewPrompt: null });
});

it("prioritizes overdue vaccines over the existing seven-day weight reminder", () => {
  const today = new Date("2024-03-01T12:00:00.000Z");
  const childId = crypto.randomUUID();
  const dose: PlannedVaccineDoseWithStatus = {
    id: crypto.randomUUID(),
    childId,
    vaccineName: "Vacuna ficticia",
    doseLabel: "Dosis ficticia",
    plannedDate: "2024-02-20",
    ageLabel: null,
    notes: null,
    appliedOn: null,
    application: null,
    status: "retrasada",
  };
  const weightSummary = buildWeightTrendSummary(
    [
      {
        id: crypto.randomUUID(),
        childId,
        measuredOn: "2024-02-01",
        weightGrams: 6000,
        place: "pediatra",
      },
    ],
    today,
  );
  const agenda = buildHomeAgenda({ today, vaccineDoses: [dose], weightSummary });
  expect(agenda.reviewPrompt?.kind).toBe("overdue-vaccine");
  expect(agenda.items.map((item) => item.kind)).toEqual(["overdue", "weight"]);
});
