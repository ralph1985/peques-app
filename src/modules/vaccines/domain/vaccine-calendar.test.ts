import { expect, it } from "vitest";
import {
  buildMadridInitialVaccinePlan,
  calculatePlannedDate,
  getPlannedVaccineDoseStatus,
  createAppliedVaccineDose,
  type PlannedVaccineDose,
} from "./vaccine-calendar";

it("derives separate plans from birth and clamps month-end appointments", () => {
  const definition = {
    vaccineName: "Vacuna ficticia",
    doseLabel: "Dosis ficticia",
    ageLabel: "Mes ficticio",
    monthsFromBirth: 1,
  };
  expect(calculatePlannedDate("2024-01-31", definition)).toBe("2024-02-29");
  expect(calculatePlannedDate("2023-01-31", definition)).toBe("2023-02-28");
  const a = buildMadridInitialVaccinePlan("2024-01-01");
  const b = buildMadridInitialVaccinePlan("2024-02-01");
  expect(a).toHaveLength(22);
  expect(a.filter((dose) => dose.plannedDate === null)).toHaveLength(1);
  expect(a[0].plannedDate).toBe("2024-03-01");
  expect(b[0].plannedDate).toBe("2024-04-01");
  expect(a[0]).not.toBe(b[0]);
});

it.each([
  ["2024-03-01", "retrasada"],
  ["2024-03-02", "proxima"],
  ["2024-03-16", "proxima"],
  ["2024-03-17", "pendiente"],
  [null, "pendiente"],
] as const)("classifies %s as %s using Madrid's date", (plannedDate, expected) => {
  const dose: PlannedVaccineDose = {
    id: crypto.randomUUID(),
    childId: crypto.randomUUID(),
    vaccineName: "Vacuna ficticia",
    doseLabel: "Dosis ficticia",
    plannedDate,
    notes: null,
    ageLabel: null,
  };
  expect(getPlannedVaccineDoseStatus(dose, undefined, new Date("2024-03-01T23:30:00Z"))).toBe(
    expected,
  );
});

it("validates application dates and preserves optional independent applications", () => {
  const value = {
    plannedDoseId: null,
    vaccineName: " Vacuna ficticia ",
    doseLabel: "Dosis ficticia",
    appliedOn: "2024-02-29",
    place: "Centro ficticio",
    lot: " ",
    notes: null,
  };
  expect(createAppliedVaccineDose(value)).toMatchObject({
    plannedDoseId: null,
    vaccineName: "Vacuna ficticia",
    lot: null,
  });
  expect(() => createAppliedVaccineDose({ ...value, appliedOn: "2023-02-29" })).toThrow();
});
