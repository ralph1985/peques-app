import type { WeightRepository } from "../application/weight-repository";
import { createWeightEntry, type NewWeightEntry } from "../domain/weight-entry";
import type { PequesDatabase } from "@/shared/infrastructure/local/database";
import { requireChild, requireOwned } from "@/shared/infrastructure/local/ownership";
import { optionalText } from "@/shared/domain/validation";

export class DexieWeightRepository implements WeightRepository {
  constructor(
    private readonly db: PequesDatabase,
    readonly childId: string,
  ) {}
  listWeightEntries() {
    return this.db.weightEntries
      .where("childId")
      .equals(this.childId)
      .reverse()
      .sortBy("measuredOn");
  }
  async createWeightEntry(input: NewWeightEntry) {
    const value = createWeightEntry({ ...input, notes: optionalText(input.notes, "Notas") });
    return this.db.transaction("rw", this.db.children, this.db.weightEntries, async () => {
      await requireChild(this.db, this.childId);
      const entry = { ...value, id: crypto.randomUUID(), childId: this.childId };
      await this.db.weightEntries.add(entry);
      return entry;
    });
  }
  async updateWeightEntry(id: string, input: NewWeightEntry) {
    const value = createWeightEntry({ ...input, notes: optionalText(input.notes, "Notas") });
    return this.db.transaction("rw", this.db.children, this.db.weightEntries, async () => {
      await requireChild(this.db, this.childId);
      await requireOwned(this.db.weightEntries, id, this.childId);
      const entry = { ...value, id, childId: this.childId };
      await this.db.weightEntries.put(entry);
      return entry;
    });
  }
  async deleteWeightEntry(id: string) {
    await this.db.transaction("rw", this.db.children, this.db.weightEntries, async () => {
      await requireChild(this.db, this.childId);
      await requireOwned(this.db.weightEntries, id, this.childId);
      await this.db.weightEntries.delete(id);
    });
  }
}
