import type { VaccinePlanRepository } from "../application/vaccine-plan-repository";
import {
  createAppliedVaccineDose,
  createPlannedVaccineDose,
  type NewAppliedVaccineDose,
  type NewPlannedVaccineDose,
} from "../domain/vaccine-calendar";
import type { PequesDatabase } from "@/shared/infrastructure/local/database";
import { requireChild, requireOwned } from "@/shared/infrastructure/local/ownership";
import { assert, optionalText, text } from "@/shared/domain/validation";

function plannedInput(input: NewPlannedVaccineDose) {
  return createPlannedVaccineDose({
    ...input,
    vaccineName: text(input.vaccineName, "Vacuna"),
    doseLabel: text(input.doseLabel, "Dosis"),
    ageLabel: optionalText(input.ageLabel, "Edad", 120),
    notes: optionalText(input.notes, "Notas"),
  });
}
function appliedInput(input: NewAppliedVaccineDose) {
  return createAppliedVaccineDose({
    ...input,
    vaccineName: text(input.vaccineName, "Vacuna"),
    doseLabel: text(input.doseLabel, "Dosis"),
    place: text(input.place, "Lugar"),
    lot: optionalText(input.lot, "Lote", 120),
    notes: optionalText(input.notes, "Notas"),
  });
}

export class DexieVaccinePlanRepository implements VaccinePlanRepository {
  constructor(
    private readonly db: PequesDatabase,
    readonly childId: string,
  ) {}
  async listPlannedVaccineDoses() {
    return (await this.db.plannedVaccineDoses.where("childId").equals(this.childId).toArray()).sort(
      (a, b) => (a.plannedDate ?? "9999").localeCompare(b.plannedDate ?? "9999"),
    );
  }
  listAppliedVaccineDoses() {
    return this.db.appliedVaccineDoses
      .where("childId")
      .equals(this.childId)
      .reverse()
      .sortBy("appliedOn");
  }
  async updatePlannedVaccineDose(id: string, input: NewPlannedVaccineDose) {
    const value = plannedInput(input);
    return this.db.transaction("rw", this.db.children, this.db.plannedVaccineDoses, async () => {
      await requireChild(this.db, this.childId);
      await requireOwned(this.db.plannedVaccineDoses, id, this.childId);
      const dose = { ...value, id, childId: this.childId };
      await this.db.plannedVaccineDoses.put(dose);
      return dose;
    });
  }
  private async checkPlan(plannedDoseId: string | null, applicationId?: string) {
    if (plannedDoseId === null) return;
    await requireOwned(this.db.plannedVaccineDoses, plannedDoseId, this.childId);
    const existing = await this.db.appliedVaccineDoses
      .where("plannedDoseId")
      .equals(plannedDoseId)
      .first();
    assert(
      !existing || existing.id === applicationId,
      "La dosis ya está aplicada. Edita su aplicación o vuelve a pendiente.",
    );
  }
  async createAppliedVaccineDose(input: NewAppliedVaccineDose) {
    const value = appliedInput(input);
    return this.db.transaction(
      "rw",
      this.db.children,
      this.db.plannedVaccineDoses,
      this.db.appliedVaccineDoses,
      async () => {
        await requireChild(this.db, this.childId);
        await this.checkPlan(value.plannedDoseId);
        const dose = { ...value, id: crypto.randomUUID(), childId: this.childId };
        await this.db.appliedVaccineDoses.add(dose);
        return dose;
      },
    );
  }
  async updateAppliedVaccineDose(id: string, input: NewAppliedVaccineDose) {
    const value = appliedInput(input);
    return this.db.transaction(
      "rw",
      this.db.children,
      this.db.plannedVaccineDoses,
      this.db.appliedVaccineDoses,
      async () => {
        await requireChild(this.db, this.childId);
        await requireOwned(this.db.appliedVaccineDoses, id, this.childId);
        await this.checkPlan(value.plannedDoseId, id);
        const dose = { ...value, id, childId: this.childId };
        await this.db.appliedVaccineDoses.put(dose);
        return dose;
      },
    );
  }
  async deleteAppliedVaccineDose(id: string) {
    await this.db.transaction("rw", this.db.children, this.db.appliedVaccineDoses, async () => {
      await requireChild(this.db, this.childId);
      await requireOwned(this.db.appliedVaccineDoses, id, this.childId);
      await this.db.appliedVaccineDoses.delete(id);
    });
  }
}
