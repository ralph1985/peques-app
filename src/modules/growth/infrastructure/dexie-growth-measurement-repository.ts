import type { PequesDatabase } from "@/shared/infrastructure/local/database";
import { requireChild, requireOwned } from "@/shared/infrastructure/local/ownership";
import { createGrowthMeasurement, type NewGrowthMeasurement } from "../domain/growth-measurement";
import type { GrowthMeasurementRepository } from "../application/growth-measurement-repository";

export class DexieGrowthMeasurementRepository implements GrowthMeasurementRepository {
  constructor(
    private readonly db: PequesDatabase,
    readonly childId: string,
  ) {}

  listGrowthMeasurements() {
    return this.db.growthMeasurements
      .where("childId")
      .equals(this.childId)
      .reverse()
      .sortBy("measuredOn");
  }

  async createGrowthMeasurement(input: NewGrowthMeasurement) {
    const value = createGrowthMeasurement(input);
    return this.db.transaction("rw", this.db.children, this.db.growthMeasurements, async () => {
      await requireChild(this.db, this.childId);
      const measurement = { ...value, id: crypto.randomUUID(), childId: this.childId };
      await this.db.growthMeasurements.add(measurement);
      return measurement;
    });
  }

  async updateGrowthMeasurement(id: string, input: NewGrowthMeasurement) {
    const value = createGrowthMeasurement(input);
    return this.db.transaction("rw", this.db.children, this.db.growthMeasurements, async () => {
      await requireChild(this.db, this.childId);
      await requireOwned(this.db.growthMeasurements, id, this.childId);
      const measurement = { ...value, id, childId: this.childId };
      await this.db.growthMeasurements.put(measurement);
      return measurement;
    });
  }

  async deleteGrowthMeasurement(id: string) {
    await this.db.transaction("rw", this.db.children, this.db.growthMeasurements, async () => {
      await requireChild(this.db, this.childId);
      await requireOwned(this.db.growthMeasurements, id, this.childId);
      await this.db.growthMeasurements.delete(id);
    });
  }
}
