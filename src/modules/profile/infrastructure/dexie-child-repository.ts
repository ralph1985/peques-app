import type { ChildRepository } from "../application/child-repository";
import { validateChild, type ChildInput } from "../domain/child";
import { buildMadridInitialVaccinePlan } from "@/modules/vaccines/domain/vaccine-calendar";
import { assert } from "@/shared/domain/validation";
import type { PequesDatabase } from "@/shared/infrastructure/local/database";
import { requireChild } from "@/shared/infrastructure/local/ownership";

export class DexieChildRepository implements ChildRepository {
  constructor(private readonly db: PequesDatabase) {}
  list() {
    return this.db.children.orderBy("createdAt").toArray();
  }
  async create(input: ChildInput) {
    const value = validateChild(input);
    const now = new Date().toISOString();
    const child = { ...value, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    const doses = buildMadridInitialVaccinePlan(child.birthDate).map((dose) => ({
      ...dose,
      id: crypto.randomUUID(),
      childId: child.id,
    }));
    await this.db.transaction(
      "rw",
      this.db.children,
      this.db.plannedVaccineDoses,
      this.db.settings,
      async () => {
        await this.db.children.add(child);
        await this.db.plannedVaccineDoses.bulkAdd(doses);
        await this.db.settings.update("main", { activeChildId: child.id });
      },
    );
    return child;
  }
  async update(id: string, input: ChildInput) {
    const value = validateChild(input);
    return this.db.transaction("rw", this.db.children, async () => {
      await requireChild(this.db, id);
      const previous = (await this.db.children.get(id))!;
      const child = {
        ...value,
        id,
        createdAt: previous.createdAt,
        updatedAt: new Date().toISOString(),
      };
      await this.db.children.put(child);
      return child;
    });
  }
  async select(id: string) {
    await this.db.transaction("rw", this.db.children, this.db.settings, async () => {
      await requireChild(this.db, id);
      await this.db.settings.update("main", { activeChildId: id });
    });
  }
  async active() {
    return this.db.transaction("r", this.db.children, this.db.settings, async () => {
      const settings = await this.db.settings.get("main");
      return settings?.activeChildId
        ? ((await this.db.children.get(settings.activeChildId)) ?? null)
        : null;
    });
  }
  async counts(id: string) {
    return this.db.transaction(
      "r",
      [
        this.db.children,
        this.db.weightEntries,
        this.db.growthMeasurements,
        this.db.plannedVaccineDoses,
        this.db.appliedVaccineDoses,
        this.db.sleepEntries,
      ],
      async () => {
        await requireChild(this.db, id);
        return {
          weights: await this.db.weightEntries.where("childId").equals(id).count(),
          growthMeasurements: await this.db.growthMeasurements.where("childId").equals(id).count(),
          plannedVaccines: await this.db.plannedVaccineDoses.where("childId").equals(id).count(),
          appliedVaccines: await this.db.appliedVaccineDoses.where("childId").equals(id).count(),
          sleep: await this.db.sleepEntries.where("childId").equals(id).count(),
        };
      },
    );
  }
  async delete(id: string, confirmedName: string) {
    await this.db.transaction(
      "rw",
      [
        this.db.children,
        this.db.weightEntries,
        this.db.growthMeasurements,
        this.db.plannedVaccineDoses,
        this.db.appliedVaccineDoses,
        this.db.sleepEntries,
        this.db.settings,
      ],
      async () => {
        await requireChild(this.db, id);
        assert(
          (await this.db.children.get(id))!.name === confirmedName,
          "Escribe el nombre del hijo para confirmar el borrado.",
        );
        await this.db.appliedVaccineDoses.where("childId").equals(id).delete();
        await this.db.plannedVaccineDoses.where("childId").equals(id).delete();
        await this.db.weightEntries.where("childId").equals(id).delete();
        await this.db.growthMeasurements.where("childId").equals(id).delete();
        await this.db.sleepEntries.where("childId").equals(id).delete();
        await this.db.children.delete(id);
        if ((await this.db.settings.get("main"))?.activeChildId === id) {
          const next = await this.db.children.orderBy("createdAt").first();
          await this.db.settings.update("main", { activeChildId: next?.id ?? null });
        }
      },
    );
  }
}
