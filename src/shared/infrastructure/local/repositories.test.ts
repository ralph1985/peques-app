import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PequesDatabase } from "./database";
import { DexieChildRepository } from "@/modules/profile/infrastructure/dexie-child-repository";
import { DexieWeightRepository } from "@/modules/weight/infrastructure/dexie-weight-repository";
import { DexieSleepRepository } from "@/modules/sleep/infrastructure/dexie-sleep-repository";
import { DexieVaccinePlanRepository } from "@/modules/vaccines/infrastructure/dexie-vaccine-plan-repository";
import { DexieTravelChecklistRepository } from "@/modules/travel/infrastructure/dexie-travel-checklist-repository";
import { DexieSettingsRepository } from "@/modules/settings/infrastructure/dexie-settings-repository";
import type { Child } from "@/modules/profile/domain/child";

describe("integridad de los repositorios locales", () => {
  let db: PequesDatabase;
  let children: DexieChildRepository;
  let a: Child;
  let b: Child;
  const weight = {
    measuredOn: "2024-03-02",
    weightGrams: 4500,
    place: "farmacia" as const,
    notes: "Nota ficticia",
  };
  const sleep = { kind: "nap" as const, startedAt: "2024-03-02T12:00:00.000Z", endedAt: null };
  const application = {
    appliedOn: "2024-03-02",
    vaccineName: "Vacuna de prueba",
    doseLabel: "Dosis de prueba",
    place: "Centro ficticio",
    lot: "LOTE-FICTICIO",
    notes: null,
  };
  beforeEach(async () => {
    db = new PequesDatabase(`test-${crypto.randomUUID()}`);
    await db.open();
    children = new DexieChildRepository(db);
    a = await children.create({ name: "Peque de prueba A", birthDate: "2024-01-02" });
    b = await children.create({ name: "Peque de prueba B", birthDate: "2024-01-03" });
  });
  afterEach(async () => {
    await db.delete();
  });

  it("isolates weight reads, edits and deletion even with a known foreign ID", async () => {
    const ra = new DexieWeightRepository(db, a.id);
    const rb = new DexieWeightRepository(db, b.id);
    const entry = await ra.createWeightEntry(weight);
    expect(await rb.listWeightEntries()).toEqual([]);
    await expect(
      rb.updateWeightEntry(entry.id, { ...weight, weightGrams: 4700 }),
    ).rejects.toThrow();
    await expect(rb.deleteWeightEntry(entry.id)).rejects.toThrow();
    expect((await ra.listWeightEntries())[0].weightGrams).toBe(4500);
    await ra.updateWeightEntry(entry.id, { ...weight, weightGrams: 4600 });
    expect((await ra.listWeightEntries())[0].weightGrams).toBe(4600);
    await ra.deleteWeightEntry(entry.id);
    expect(await ra.listWeightEntries()).toEqual([]);
    await expect(ra.createWeightEntry({ ...weight, weightGrams: NaN })).rejects.toThrow();
  });
  it("toggles sleep transactionally while retaining the original timer kind and child", async () => {
    const ra = new DexieSleepRepository(db, a.id);
    const rb = new DexieSleepRepository(db, b.id);
    const started = await ra.toggleSleepEntry("night", "2024-03-02T20:00:00.000Z");
    expect(started.action).toBe("started");
    expect(await rb.getActiveSleepEntry()).toBeNull();
    const stopped = await ra.toggleSleepEntry("nap", "2024-03-03T06:00:00.000Z");
    expect(stopped.action).toBe("stopped");
    expect(stopped.entry).toMatchObject({
      id: started.entry.id,
      childId: a.id,
      kind: "night",
      endedAt: "2024-03-03T06:00:00.000Z",
    });
    expect(await ra.getActiveSleepEntry()).toBeNull();
    expect(await ra.listSleepEntries()).toHaveLength(1);
    await ra.toggleSleepEntry("nap", "2024-03-03T12:00:00.000Z");
    await expect(ra.toggleSleepEntry("nap", "2024-03-03T11:00:00.000Z")).rejects.toThrow();
    expect((await ra.getActiveSleepEntry())?.startedAt).toBe("2024-03-03T12:00:00.000Z");
  });
  it("binds an applied vaccine to a plan belonging to the same child", async () => {
    const ra = new DexieVaccinePlanRepository(db, a.id);
    const rb = new DexieVaccinePlanRepository(db, b.id);
    const plan = (await ra.listPlannedVaccineDoses())[0];
    await expect(
      rb.createAppliedVaccineDose({ ...application, plannedDoseId: plan.id }),
    ).rejects.toThrow();
    const applied = await ra.createAppliedVaccineDose({ ...application, plannedDoseId: plan.id });
    expect(await rb.listAppliedVaccineDoses()).toEqual([]);
    await expect(rb.updatePlannedVaccineDose(plan.id, plan)).rejects.toThrow();
    await expect(rb.updateAppliedVaccineDose(applied.id, applied)).rejects.toThrow();
    await expect(rb.deleteAppliedVaccineDose(applied.id)).rejects.toThrow();
    await expect(
      ra.createAppliedVaccineDose({ ...application, plannedDoseId: plan.id }),
    ).rejects.toThrow();
    await ra.updateAppliedVaccineDose(applied.id, { ...applied, lot: "EDITADO-FICTICIO" });
    await ra.deleteAppliedVaccineDose(applied.id);
    expect(await ra.listAppliedVaccineDoses()).toEqual([]);
    expect((await ra.listPlannedVaccineDoses()).some((dose) => dose.id === plan.id)).toBe(true);
  });
  it("serializes simultaneous vaccine application without duplicate rows", async () => {
    const repo = new DexieVaccinePlanRepository(db, a.id);
    const plan = (await repo.listPlannedVaccineDoses())[0];
    const input = { ...application, plannedDoseId: plan.id };
    const results = await Promise.allSettled([
      repo.createAppliedVaccineDose(input),
      repo.createAppliedVaccineDose(input),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await repo.listAppliedVaccineDoses()).toHaveLength(1);
  });
  it("keeps one active timer per child across reopening and parallel connections", async () => {
    const ra = new DexieSleepRepository(db, a.id);
    const rb = new DexieSleepRepository(db, b.id);
    const secondConnection = new PequesDatabase(db.name);
    await secondConnection.open();
    try {
      const anotherTab = new DexieSleepRepository(secondConnection, a.id);
      const results = await Promise.allSettled([
        ra.createSleepEntry(sleep),
        anotherTab.createSleepEntry(sleep),
      ]);
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      const active = (await ra.getActiveSleepEntry())!;
      await rb.createSleepEntry({ ...sleep, kind: "night" });
      expect(await rb.listSleepEntries()).toHaveLength(1);
      await expect(
        rb.updateSleepEntry(active.id, { ...sleep, endedAt: "2024-03-02T13:00:00.000Z" }),
      ).rejects.toThrow();
      await expect(rb.deleteSleepEntry(active.id)).rejects.toThrow();
      db.close();
      await db.open();
      expect(await ra.getActiveSleepEntry()).toEqual(active);
      await ra.updateSleepEntry(active.id, { ...sleep, endedAt: "2024-03-02T13:00:00.000Z" });
      expect(await ra.getActiveSleepEntry()).toBeNull();
      expect((await rb.getActiveSleepEntry())?.kind).toBe("night");
    } finally {
      secondConnection.close();
    }
  });
  it("cascades all owned tables, prevents subsequent orphan writes and preserves other children", async () => {
    const weights = new DexieWeightRepository(db, a.id);
    const vaccines = new DexieVaccinePlanRepository(db, a.id);
    const sleeps = new DexieSleepRepository(db, a.id);
    await weights.createWeightEntry(weight);
    await sleeps.createSleepEntry(sleep);
    await vaccines.createAppliedVaccineDose({
      ...application,
      plannedDoseId: (await vaccines.listPlannedVaccineDoses())[0].id,
    });
    await new DexieWeightRepository(db, b.id).createWeightEntry(weight);
    expect(await children.counts(a.id)).toMatchObject({ weights: 1, appliedVaccines: 1, sleep: 1 });
    await children.delete(a.id, a.name);
    expect(await weights.listWeightEntries()).toEqual([]);
    expect(await sleeps.listSleepEntries()).toEqual([]);
    expect(await vaccines.listAppliedVaccineDoses()).toEqual([]);
    expect(await vaccines.listPlannedVaccineDoses()).toEqual([]);
    await expect(weights.createWeightEntry(weight)).rejects.toThrow();
    await expect(sleeps.createSleepEntry(sleep)).rejects.toThrow();
    await expect(
      vaccines.createAppliedVaccineDose({ ...application, plannedDoseId: null }),
    ).rejects.toThrow();
    expect(await new DexieWeightRepository(db, b.id).listWeightEntries()).toHaveLength(1);
  });
  it("rolls back a failed cascade without deleting only part of a child", async () => {
    const repo = new DexieWeightRepository(db, a.id);
    await repo.createWeightEntry(weight);
    const before = await children.counts(a.id);
    const fail = () => {
      throw new Error("test delete failure");
    };
    db.weightEntries.hook("deleting", fail);
    await expect(children.delete(a.id, a.name)).rejects.toThrow("test delete failure");
    db.weightEntries.hook("deleting").unsubscribe(fail);
    expect(await children.counts(a.id)).toEqual(before);
  });
  it("preserves packing state and independent category/location orders", async () => {
    const repo = new DexieTravelChecklistRepository(db);
    const categories = await repo.listTravelChecklistCategories();
    const location = await repo.createTravelStorageLocation({
      label: "Bolsa de prueba",
      parentId: null,
      sortOrder: 0,
    });
    const item = await repo.createTravelChecklistItem({
      label: "Elemento ficticio",
      category: categories[0].slug,
      sortOrder: 20,
      isPacked: true,
    });
    await repo.reorderStorage([
      { id: item.id, storageLocationId: location.id, storageSortOrder: 10 },
    ]);
    expect((await repo.listTravelChecklistItems())[0]).toMatchObject({
      category: item.category,
      sortOrder: 20,
      isPacked: true,
    });
    await repo.reorderItems([{ id: item.id, category: categories[1].slug, sortOrder: 0 }]);
    expect((await repo.listTravelChecklistItems())[0]).toMatchObject({
      storageLocationId: location.id,
      storageSortOrder: 10,
      isPacked: true,
    });
    await repo.resetTravelChecklist();
    expect((await repo.listTravelChecklistItems())[0].isPacked).toBe(false);
  });
  it("rejects dangling travel references, cycles and deleting occupied containers", async () => {
    const repo = new DexieTravelChecklistRepository(db);
    const category = (await repo.listTravelChecklistCategories())[0];
    const parent = await repo.createTravelStorageLocation({
      label: "Bolsa de prueba",
      parentId: null,
      sortOrder: 0,
    });
    const compartment = await repo.createTravelStorageLocation({
      label: "Bolsillo de prueba",
      parentId: parent.id,
      sortOrder: 10,
    });
    await expect(
      repo.updateTravelStorageLocation(parent.id, { ...parent, parentId: compartment.id }),
    ).rejects.toThrow();
    await expect(repo.deleteTravelStorageLocation(parent.id)).rejects.toThrow();
    await expect(
      repo.createTravelChecklistItem({
        label: "Elemento ficticio",
        category: crypto.randomUUID(),
        sortOrder: 0,
      }),
    ).rejects.toThrow();
    const item = await repo.createTravelChecklistItem({
      label: "Elemento ficticio",
      category: category.slug,
      storageLocationId: compartment.id,
      sortOrder: 0,
    });
    await expect(repo.deleteTravelChecklistCategory(category.slug)).rejects.toThrow();
    await expect(repo.deleteTravelStorageLocation(compartment.id)).rejects.toThrow();
    await expect(
      repo.reorderItems([
        { id: item.id, category: category.slug, sortOrder: 30 },
        { id: crypto.randomUUID(), category: category.slug, sortOrder: 40 },
      ]),
    ).rejects.toThrow();
    expect((await repo.listTravelChecklistItems())[0].sortOrder).toBe(0);
    await repo.deleteTravelChecklistItem(item.id);
    await repo.deleteTravelStorageLocation(compartment.id);
    await repo.deleteTravelStorageLocation(parent.id);
    await repo.deleteTravelChecklistCategory(category.slug);
  });
  it("persists local preferences without allowing the selection invariant to be bypassed", async () => {
    const repo = new DexieSettingsRepository(db);
    await repo.update({
      calendarAllChildren: true,
      travelView: "location",
      tutorialSeenRoutes: ["/", "/peso"],
      tutorialReplayRequested: true,
    });
    await repo.recordExport("2024-04-01T00:00:00.000Z");
    db.close();
    await db.open();
    expect(await repo.read()).toMatchObject({
      activeChildId: b.id,
      calendarAllChildren: true,
      travelView: "location",
      lastExportedAt: "2024-04-01T00:00:00.000Z",
      tutorialSeenRoutes: ["/", "/peso"],
      tutorialReplayRequested: true,
    });
    await expect(repo.recordExport("invalid")).rejects.toThrow();
  });
});
