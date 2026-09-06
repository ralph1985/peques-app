import type { BackupRepository } from "../application/backup-repository";
import { validateBackup, type PequesBackup } from "../domain/backup";
import type { PequesDatabase } from "@/shared/infrastructure/local/database";

export class DexieBackupRepository implements BackupRepository {
  constructor(private readonly db: PequesDatabase) {}
  async export(): Promise<PequesBackup> {
    return this.db.transaction("r", this.db.tables, async () =>
      validateBackup({
        format: "peques-backup",
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        data: {
          children: await this.db.children.toArray(),
          weightEntries: await this.db.weightEntries.toArray(),
          plannedVaccineDoses: await this.db.plannedVaccineDoses.toArray(),
          appliedVaccineDoses: await this.db.appliedVaccineDoses.toArray(),
          sleepEntries: await this.db.sleepEntries.toArray(),
          travelChecklistCategories: await this.db.travelChecklistCategories.toArray(),
          travelChecklistItems: await this.db.travelChecklistItems.toArray(),
          travelStorageLocations: await this.db.travelStorageLocations.toArray(),
          settings: await this.db.settings.toArray(),
        },
      }),
    );
  }
  async restore(input: PequesBackup): Promise<void> {
    // Validate and copy again: callers cannot bypass validation or mutate a preview mid-write.
    const { data } = validateBackup(input);
    await this.db.transaction("rw", this.db.tables, async () => {
      for (const table of this.db.tables) await table.clear();
      await this.db.children.bulkAdd(data.children);
      await this.db.weightEntries.bulkAdd(data.weightEntries);
      await this.db.plannedVaccineDoses.bulkAdd(data.plannedVaccineDoses);
      await this.db.appliedVaccineDoses.bulkAdd(data.appliedVaccineDoses);
      await this.db.sleepEntries.bulkAdd(data.sleepEntries);
      await this.db.travelChecklistCategories.bulkAdd(data.travelChecklistCategories);
      await this.db.travelStorageLocations.bulkAdd(data.travelStorageLocations);
      await this.db.travelChecklistItems.bulkAdd(data.travelChecklistItems);
      await this.db.settings.bulkAdd(data.settings);
    });
  }
}
