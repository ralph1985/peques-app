import type { PlannedVaccineDoseWithStatus } from "../domain/vaccine-calendar";

export type VaccineAlert = {
  id: string;
  kind: "retrasada" | "proxima";
  title: string;
  detail: string;
  plannedDate: string;
};

export function buildVaccineAlerts(doses: PlannedVaccineDoseWithStatus[]): VaccineAlert[] {
  return doses
    .filter(
      (
        dose,
      ): dose is PlannedVaccineDoseWithStatus & {
        status: VaccineAlert["kind"];
        plannedDate: string;
      } => dose.plannedDate !== null && (dose.status === "retrasada" || dose.status === "proxima"),
    )
    .map((dose) => ({
      id: dose.id,
      kind: dose.status,
      title:
        dose.status === "retrasada"
          ? `${dose.vaccineName} retrasada`
          : `${dose.vaccineName} próxima`,
      detail: `${dose.doseLabel}${dose.ageLabel ? ` · ${dose.ageLabel}` : ""}`,
      plannedDate: dose.plannedDate,
    }));
}
