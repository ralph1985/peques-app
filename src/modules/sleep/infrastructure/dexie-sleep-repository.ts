import type { SleepRepository } from "../application/sleep-repository";
import { createSleepEntry, type NewSleepEntry, type SleepKind } from "../domain/sleep-entry";
import type { ToggleSleepResult } from "../application/toggle-sleep-entry";
import type { PequesDatabase } from "@/shared/infrastructure/local/database";
import { requireChild, requireOwned } from "@/shared/infrastructure/local/ownership";
import { assert } from "@/shared/domain/validation";

export class DexieSleepRepository implements SleepRepository {
  constructor(
    private readonly db: PequesDatabase,
    readonly childId: string,
  ) {}
  async toggleSleepEntry(kind: SleepKind, now: string): Promise<ToggleSleepResult> {
    return this.db.transaction("rw", this.db.children, this.db.sleepEntries, async () => {
      await requireChild(this.db, this.childId);
      const active = await this.getActiveSleepEntry();
      if (active)
        return {
          action: "stopped",
          entry: await this.updateSleepEntry(active.id, {
            kind: active.kind,
            startedAt: active.startedAt,
            endedAt: now,
            notes: active.notes ?? null,
          }),
        };
      return {
        action: "started",
        entry: await this.createSleepEntry({ kind, startedAt: now, endedAt: null }),
      };
    });
  }
  listSleepEntries() {
    return this.db.sleepEntries.where("childId").equals(this.childId).reverse().sortBy("startedAt");
  }
  async getActiveSleepEntry() {
    return (
      (await this.db.sleepEntries
        .where("childId")
        .equals(this.childId)
        .and((entry) => entry.endedAt === null)
        .first()) ?? null
    );
  }
  async createSleepEntry(input: NewSleepEntry) {
    const value = createSleepEntry(input);
    return this.db.transaction("rw", this.db.children, this.db.sleepEntries, async () => {
      await requireChild(this.db, this.childId);
      if (value.endedAt === null)
        assert(!(await this.getActiveSleepEntry()), "Este hijo ya tiene un cronómetro activo.");
      const now = new Date().toISOString();
      const entry = {
        ...value,
        id: crypto.randomUUID(),
        childId: this.childId,
        createdAt: now,
        updatedAt: now,
      };
      await this.db.sleepEntries.add(entry);
      return entry;
    });
  }
  async updateSleepEntry(id: string, input: NewSleepEntry) {
    const value = createSleepEntry(input);
    return this.db.transaction("rw", this.db.children, this.db.sleepEntries, async () => {
      await requireChild(this.db, this.childId);
      const previous = await requireOwned(this.db.sleepEntries, id, this.childId);
      if (value.endedAt === null) {
        const active = await this.getActiveSleepEntry();
        assert(!active || active.id === id, "Este hijo ya tiene un cronómetro activo.");
      }
      const entry = { ...previous, ...value, updatedAt: new Date().toISOString() };
      await this.db.sleepEntries.put(entry);
      return entry;
    });
  }
  async deleteSleepEntry(id: string) {
    await this.db.transaction("rw", this.db.children, this.db.sleepEntries, async () => {
      await requireChild(this.db, this.childId);
      await requireOwned(this.db.sleepEntries, id, this.childId);
      await this.db.sleepEntries.delete(id);
    });
  }
}
