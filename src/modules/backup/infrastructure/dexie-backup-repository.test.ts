import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PequesDatabase } from "@/shared/infrastructure/local/database";
import { DexieChildRepository } from "@/modules/profile/infrastructure/dexie-child-repository";
import { DexieWeightRepository } from "@/modules/weight/infrastructure/dexie-weight-repository";
import { DexieSleepRepository } from "@/modules/sleep/infrastructure/dexie-sleep-repository";
import { DexieVaccinePlanRepository } from "@/modules/vaccines/infrastructure/dexie-vaccine-plan-repository";
import { DexieTravelChecklistRepository } from "@/modules/travel/infrastructure/dexie-travel-checklist-repository";
import { DexieSettingsRepository } from "@/modules/settings/infrastructure/dexie-settings-repository";
import { DexieBackupRepository } from "./dexie-backup-repository";
import { parseBackup, summarizeBackup, type PequesBackup } from "../domain/backup";

describe("copia completa y restauración atómica", () => {
  let db: PequesDatabase;
  let repo: DexieBackupRepository;
  let backup: PequesBackup;
  beforeEach(async () => {
    db = new PequesDatabase(`test-${crypto.randomUUID()}`);
    await db.open();
    repo = new DexieBackupRepository(db);
    const children = new DexieChildRepository(db);
    const a = await children.create({
      name: "Peque ficticio A",
      birthDate: "2022-04-11",
      birthTime: "09:15",
      sex: "female",
      healthId: "FICTICIO-A",
    });
    await children.create({ name: "Peque ficticio B", birthDate: "2023-02-05" });
    await children.select(a.id);
    await new DexieWeightRepository(db, a.id).createWeightEntry({
      measuredOn: "2022-06-10",
      weightGrams: 5200,
      place: "pediatra",
      notes: "Nota de prueba",
    });
    await new DexieSleepRepository(db, a.id).createSleepEntry({
      kind: "night",
      startedAt: "2022-06-10T20:00:00.000Z",
      endedAt: null,
    });
    const vaccines = new DexieVaccinePlanRepository(db, a.id);
    await vaccines.createAppliedVaccineDose({
      plannedDoseId: (await vaccines.listPlannedVaccineDoses())[0].id,
      appliedOn: "2022-06-11",
      vaccineName: "Vacuna ficticia",
      doseLabel: "Dosis ficticia",
      place: "Lugar de prueba",
      lot: "FICTICIO",
      notes: "Nota ficticia",
    });
    const travel = new DexieTravelChecklistRepository(db);
    const category = (await travel.listTravelChecklistCategories())[0];
    const location = await travel.createTravelStorageLocation({
      label: "Bolsa ficticia",
      parentId: null,
      sortOrder: 0,
    });
    const compartment = await travel.createTravelStorageLocation({
      label: "Bolsillo ficticio",
      parentId: location.id,
      sortOrder: 10,
    });
    await travel.createTravelChecklistItem({
      label: "Elemento ficticio",
      category: category.slug,
      sortOrder: 10,
      storageLocationId: compartment.id,
      storageSortOrder: 20,
      isPacked: true,
      notes: "Texto de prueba",
    });
    await new DexieSettingsRepository(db).update({
      calendarAllChildren: true,
      vaccineView: "timeline",
      travelView: "location",
    });
    backup = await repo.export();
  });
  afterEach(async () => {
    await db.delete();
  });

  it("round-trips all tables, relations, active timer and settings into another database", async () => {
    const other = new PequesDatabase(`test-${crypto.randomUUID()}`);
    await other.open();
    try {
      const destination = new DexieBackupRepository(other);
      const parsed = parseBackup(JSON.stringify(backup));
      expect(summarizeBackup(parsed)).toMatchObject({
        children: 2,
        weightEntries: 1,
        appliedVaccineDoses: 1,
        sleepEntries: 1,
        travelStorageLocations: 2,
        travelChecklistItems: 1,
      });
      await destination.restore(parsed);
      other.close();
      await other.open();
      expect((await destination.export()).data).toEqual(backup.data);
    } finally {
      await other.delete();
    }
  });
  it("accepts version 1 backups without growth measurements", () => {
    const legacy = structuredClone(backup);
    legacy.schemaVersion = 1;
    Reflect.deleteProperty(legacy.data, "growthMeasurements");

    const parsed = parseBackup(JSON.stringify(legacy));

    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.data.growthMeasurements).toEqual([]);
  });
  it("restores by replacement rather than merging records or generating extra vaccines", async () => {
    await new DexieChildRepository(db).create({
      name: "Peque ficticio temporal",
      birthDate: "2021-08-20",
    });
    await repo.restore(backup);
    expect((await repo.export()).data).toEqual(backup.data);
  });
  it("rolls back a mid-import write failure, including tables cleared earlier", async () => {
    await new DexieChildRepository(db).create({
      name: "Peque ficticio anterior",
      birthDate: "2021-08-20",
    });
    const before = (await repo.export()).data;
    const fail = () => {
      throw new Error("test import failure");
    };
    db.travelChecklistItems.hook("creating", fail);
    await expect(repo.restore(backup)).rejects.toThrow("test import failure");
    db.travelChecklistItems.hook("creating").unsubscribe(fail);
    expect((await repo.export()).data).toEqual(before);
  });
  const corruptions: [string, (value: PequesBackup) => void][] = [
    [
      "unknown format",
      (value) => {
        Object.assign(value, { format: "another-app" });
      },
    ],
    [
      "future version",
      (value) => {
        Object.assign(value, { schemaVersion: 3 });
      },
    ],
    [
      "missing table",
      (value) => {
        Reflect.deleteProperty(value.data, "sleepEntries");
      },
    ],
    [
      "unknown fields",
      (value) => {
        Object.assign(value.data.children[0], { secretExtra: "unused" });
      },
    ],
    [
      "invalid UUID",
      (value) => {
        value.data.children[0].id = "1";
      },
    ],
    [
      "duplicate IDs",
      (value) => {
        value.data.weightEntries.push({ ...value.data.weightEntries[0] });
      },
    ],
    [
      "orphan child reference",
      (value) => {
        value.data.weightEntries[0].childId = crypto.randomUUID();
      },
    ],
    [
      "string weight",
      (value) => {
        Object.assign(value.data.weightEntries[0], { weightGrams: "5200" });
      },
    ],
    [
      "impossible date",
      (value) => {
        value.data.children[0].birthDate = "2022-02-30";
      },
    ],
    [
      "invalid timestamp",
      (value) => {
        value.data.sleepEntries[0].startedAt = "2022-02-30T20:00:00.000Z";
      },
    ],
    [
      "invalid active selection",
      (value) => {
        value.data.settings[0].activeChildId = crypto.randomUUID();
      },
    ],
    [
      "duplicate active timers",
      (value) => {
        value.data.sleepEntries.push({ ...value.data.sleepEntries[0], id: crypto.randomUUID() });
      },
    ],
    [
      "missing planned vaccine",
      (value) => {
        value.data.appliedVaccineDoses[0].plannedDoseId = crypto.randomUUID();
      },
    ],
    [
      "cross-child vaccination",
      (value) => {
        const applied = value.data.appliedVaccineDoses[0];
        applied.childId = value.data.children.find((child) => child.id !== applied.childId)!.id;
      },
    ],
    [
      "duplicate vaccination",
      (value) => {
        value.data.appliedVaccineDoses.push({
          ...value.data.appliedVaccineDoses[0],
          id: crypto.randomUUID(),
        });
      },
    ],
    [
      "orphan category",
      (value) => {
        value.data.travelChecklistItems[0].category = crypto.randomUUID();
      },
    ],
    [
      "orphan location",
      (value) => {
        value.data.travelChecklistItems[0].storageLocationId = crypto.randomUUID();
      },
    ],
    [
      "cyclic locations",
      (value) => {
        const rows = value.data.travelStorageLocations;
        rows[0].parentId = rows[1].id;
        rows[1].parentId = rows[0].id;
      },
    ],
    [
      "invalid packing flag",
      (value) => {
        Object.assign(value.data.travelChecklistItems[0], { isPacked: "true" });
      },
    ],
  ];
  it.each(corruptions)("rejects %s before any database mutation", async (_label, corrupt) => {
    const invalid = structuredClone(backup);
    corrupt(invalid);
    expect(() => parseBackup(JSON.stringify(invalid))).toThrow();
    await expect(repo.restore(invalid)).rejects.toThrow();
    expect((await repo.export()).data).toEqual(backup.data);
  });
  it("rejects malformed JSON and primitive roots without exposing file content", () => {
    for (const value of ["not-json", "null", "[]", "true"])
      expect(() => parseBackup(value)).toThrow();
  });
});
