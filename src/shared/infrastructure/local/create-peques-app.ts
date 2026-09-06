import { liveQuery } from "dexie";
import { getDatabase, type PequesDatabase } from "./database";
import type { PequesApp, Watch } from "@/shared/application/peques-app";
import { DexieChildRepository } from "@/modules/profile/infrastructure/dexie-child-repository";
import { DexieWeightRepository } from "@/modules/weight/infrastructure/dexie-weight-repository";
import { DexieSleepRepository } from "@/modules/sleep/infrastructure/dexie-sleep-repository";
import { DexieVaccinePlanRepository } from "@/modules/vaccines/infrastructure/dexie-vaccine-plan-repository";
import { DexieTravelChecklistRepository } from "@/modules/travel/infrastructure/dexie-travel-checklist-repository";
import { DexieSettingsRepository } from "@/modules/settings/infrastructure/dexie-settings-repository";
import { DexieBackupRepository } from "@/modules/backup/infrastructure/dexie-backup-repository";
import { listTravelChecklist } from "@/modules/travel/application/list-travel-checklist";

function watch<T>(read: () => Promise<T>): Watch<T> {
  return (next, error) => {
    const subscription = liveQuery(read).subscribe({ next, error });
    return () => subscription.unsubscribe();
  };
}

export function createPequesApp(db: PequesDatabase = getDatabase()): PequesApp {
  const children = new DexieChildRepository(db);
  const settings = new DexieSettingsRepository(db);
  const travel = new DexieTravelChecklistRepository(db);
  const forChild: PequesApp["forChild"] = (childId) => ({
    weight: new DexieWeightRepository(db, childId),
    sleep: new DexieSleepRepository(db, childId),
    vaccines: new DexieVaccinePlanRepository(db, childId),
  });
  const readChild = async (childId: string) => {
    const repositories = forChild(childId);
    return {
      weights: await repositories.weight.listWeightEntries(),
      sleeps: await repositories.sleep.listSleepEntries(),
      planned: await repositories.vaccines.listPlannedVaccineDoses(),
      applied: await repositories.vaccines.listAppliedVaccineDoses(),
    };
  };
  return {
    children,
    settings,
    travel,
    backup: new DexieBackupRepository(db),
    forChild,
    watchFamily: watch(() =>
      db.transaction("r", db.children, db.settings, async () => ({
        children: await children.list(),
        activeChild: await children.active(),
        settings: await settings.read(),
      })),
    ),
    watchChild: (childId) =>
      watch(() =>
        db.transaction(
          "r",
          db.weightEntries,
          db.sleepEntries,
          db.plannedVaccineDoses,
          db.appliedVaccineDoses,
          () => readChild(childId),
        ),
      ),
    watchTravel: watch(() =>
      db.transaction(
        "r",
        db.travelChecklistCategories,
        db.travelChecklistItems,
        db.travelStorageLocations,
        () => listTravelChecklist(travel),
      ),
    ),
    watchAllChildren: watch(() =>
      db.transaction(
        "r",
        [
          db.children,
          db.weightEntries,
          db.sleepEntries,
          db.plannedVaccineDoses,
          db.appliedVaccineDoses,
        ],
        async () =>
          Promise.all(
            (await children.list()).map(async (child) => ({
              child,
              data: await readChild(child.id),
            })),
          ),
      ),
    ),
  };
}
