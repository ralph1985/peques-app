import Dexie, { type Table } from "dexie";
import type { Child } from "@/modules/profile/domain/child";
import type { WeightEntry } from "@/modules/weight/domain/weight-entry";
import type { GrowthMeasurement } from "@/modules/growth/domain/growth-measurement";
import type {
  PlannedVaccineDose,
  AppliedVaccineDose,
} from "@/modules/vaccines/domain/vaccine-calendar";
import type { SleepEntry } from "@/modules/sleep/domain/sleep-entry";
import type {
  TravelChecklistCategoryDefinition,
  TravelChecklistItem,
  TravelStorageLocation,
} from "@/modules/travel/domain/travel-checklist-item";
import { createDefaultSettings, type AppSettings } from "@/modules/settings/domain/settings";

export class PequesDatabase extends Dexie {
  children!: Table<Child, string>;
  weightEntries!: Table<WeightEntry, string>;
  growthMeasurements!: Table<GrowthMeasurement, string>;
  plannedVaccineDoses!: Table<PlannedVaccineDose, string>;
  appliedVaccineDoses!: Table<AppliedVaccineDose, string>;
  sleepEntries!: Table<SleepEntry, string>;
  travelChecklistCategories!: Table<TravelChecklistCategoryDefinition, string>;
  travelChecklistItems!: Table<TravelChecklistItem, string>;
  travelStorageLocations!: Table<TravelStorageLocation, string>;
  settings!: Table<AppSettings, string>;

  constructor(name = "peques-local") {
    super(name);
    this.version(1).stores({
      children: "id, createdAt",
      weightEntries: "id, childId, [childId+measuredOn]",
      plannedVaccineDoses: "id, childId, [childId+plannedDate]",
      appliedVaccineDoses: "id, childId, &plannedDoseId, [childId+appliedOn]",
      sleepEntries: "id, childId, [childId+startedAt]",
      travelChecklistCategories: "slug, sortOrder",
      travelChecklistItems:
        "id, category, storageLocationId, [category+sortOrder], [storageLocationId+storageSortOrder]",
      travelStorageLocations: "id, parentId, sortOrder",
      settings: "id",
    });
    this.version(2).stores({
      children: "id, createdAt",
      weightEntries: "id, childId, [childId+measuredOn]",
      growthMeasurements: "id, childId, [childId+measuredOn]",
      plannedVaccineDoses: "id, childId, [childId+plannedDate]",
      appliedVaccineDoses: "id, childId, &plannedDoseId, [childId+appliedOn]",
      sleepEntries: "id, childId, [childId+startedAt]",
      travelChecklistCategories: "slug, sortOrder",
      travelChecklistItems:
        "id, category, storageLocationId, [category+sortOrder], [storageLocationId+storageSortOrder]",
      travelStorageLocations: "id, parentId, sortOrder",
      settings: "id",
    });
    this.version(3)
      .stores({
        children: "id, createdAt",
        weightEntries: "id, childId, [childId+measuredOn]",
        growthMeasurements: "id, childId, [childId+measuredOn]",
        plannedVaccineDoses: "id, childId, [childId+plannedDate]",
        appliedVaccineDoses: "id, childId, &plannedDoseId, [childId+appliedOn]",
        sleepEntries: "id, childId, [childId+startedAt]",
        travelChecklistCategories: "slug, sortOrder",
        travelChecklistItems:
          "id, category, storageLocationId, [category+sortOrder], [storageLocationId+storageSortOrder]",
        travelStorageLocations: "id, parentId, sortOrder",
        settings: "id",
      })
      .upgrade((transaction) => {
        const firstUsedAt = new Date().toISOString();
        return transaction
          .table<AppSettings, string>("settings")
          .toCollection()
          .modify((settings) => {
            settings.firstUsedAt ??= firstUsedAt;
          });
      });
    this.on("populate", async () => {
      await this.settings.add(createDefaultSettings());
      await this.travelChecklistCategories.bulkAdd(
        ["Alimentación", "Higiene", "Ropa", "Descanso", "Salud", "Paseo", "Documentación"].map(
          (label, index) => ({ slug: crypto.randomUUID(), label, sortOrder: index * 10 }),
        ),
      );
    });
  }
}

let instance: PequesDatabase | undefined;
export function getDatabase(): PequesDatabase {
  return (instance ??= new PequesDatabase());
}
