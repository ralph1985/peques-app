import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PequesDatabase } from "@/shared/infrastructure/local/database";
import { DexieChildRepository } from "./dexie-child-repository";

describe("hijos locales", () => {
  let db: PequesDatabase;
  let repository: DexieChildRepository;
  beforeEach(async () => {
    db = new PequesDatabase(`test-${crypto.randomUUID()}`);
    await db.open();
    repository = new DexieChildRepository(db);
  });
  afterEach(async () => {
    await db.delete();
  });
  const first = { name: "Peque de prueba A", birthDate: "2020-01-31", sex: "female" as const };
  const second = { name: "Peque de prueba B", birthDate: "2021-03-15", sex: "male" as const };

  it("starts without children and creates a separate vaccine plan atomically", async () => {
    expect(await repository.active()).toBeNull();
    const a = await repository.create(first);
    const b = await repository.create(second);
    const dosesA = await db.plannedVaccineDoses.where("childId").equals(a.id).toArray();
    const dosesB = await db.plannedVaccineDoses.where("childId").equals(b.id).toArray();
    expect(dosesA.length).toBeGreaterThan(15);
    expect(dosesA).toHaveLength(dosesB.length);
    expect(dosesA.some((dose) => dosesB.some((other) => other.id === dose.id))).toBe(false);
    expect(
      dosesA.find(
        (dose) => dose.vaccineName.startsWith("Hexavalente") && dose.doseLabel === "1.ª dosis",
      )?.plannedDate,
    ).toBe("2020-03-31");
    expect(
      dosesB.find(
        (dose) => dose.vaccineName.startsWith("Hexavalente") && dose.doseLabel === "1.ª dosis",
      )?.plannedDate,
    ).toBe("2021-05-15");
    expect(dosesA.find((dose) => dose.vaccineName.includes("VRS"))?.plannedDate).toBeNull();
    expect((await repository.active())?.id).toBe(b.id);
  });
  it("persists selection and profile edits across database reopening without overwriting vaccine dates", async () => {
    const a = await repository.create(first);
    await repository.create(second);
    await repository.select(a.id);
    const previous = await db.plannedVaccineDoses.where("childId").equals(a.id).toArray();
    await repository.update(a.id, {
      ...first,
      birthDate: "2020-02-01",
      name: "Peque de prueba editado",
      healthId: "FICTICIO-TEST",
    });
    db.close();
    await db.open();
    expect((await repository.active())?.name).toBe("Peque de prueba editado");
    expect(await db.plannedVaccineDoses.where("childId").equals(a.id).toArray()).toEqual(previous);
  });
  it("rejects malformed profiles and unknown selection", async () => {
    await expect(repository.create({ ...first, birthDate: "2020-02-30" })).rejects.toThrow();
    await expect(repository.create({ ...first, name: " " })).rejects.toThrow();
    await expect(repository.create({ ...first, birthTime: "25:01" })).rejects.toThrow();
    await expect(repository.select(crypto.randomUUID())).rejects.toThrow();
    expect(await db.children.count()).toBe(0);
  });
  it("requires the name, cascades child data and keeps the family checklist", async () => {
    const a = await repository.create(first);
    const b = await repository.create(second);
    await repository.select(a.id);
    expect((await repository.counts(a.id)).plannedVaccines).toBeGreaterThan(15);
    await expect(repository.delete(a.id, "incorrecto")).rejects.toThrow();
    expect(await db.children.count()).toBe(2);
    await repository.delete(a.id, a.name);
    expect(await db.plannedVaccineDoses.where("childId").equals(a.id).count()).toBe(0);
    expect((await repository.active())?.id).toBe(b.id);
    expect(await db.travelChecklistCategories.count()).toBe(7);
    await repository.delete(b.id, b.name);
    expect(await repository.active()).toBeNull();
  });
  it("rolls back child creation when saving the vaccine plan fails", async () => {
    const fail = () => {
      throw new Error("test write failure");
    };
    db.plannedVaccineDoses.hook("creating", fail);
    await expect(repository.create(first)).rejects.toThrow("test write failure");
    db.plannedVaccineDoses.hook("creating").unsubscribe(fail);
    expect(await db.children.count()).toBe(0);
    expect(await db.plannedVaccineDoses.count()).toBe(0);
    expect(await repository.active()).toBeNull();
  });
});
