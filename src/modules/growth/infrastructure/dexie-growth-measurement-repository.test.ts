import { describe, expect, it } from "vitest";
import { PequesDatabase } from "@/shared/infrastructure/local/database";
import { DexieChildRepository } from "@/modules/profile/infrastructure/dexie-child-repository";
import { DexieGrowthMeasurementRepository } from "./dexie-growth-measurement-repository";

describe("repositorio local de medidas de crecimiento", () => {
  it("aísla lecturas, ediciones, borrados y cascada por hijo", async () => {
    const db = new PequesDatabase(`test-${crypto.randomUUID()}`);
    await db.open();
    try {
      const children = new DexieChildRepository(db);
      const a = await children.create({ name: "Peque A", birthDate: "2024-01-01" });
      const b = await children.create({ name: "Peque B", birthDate: "2024-01-01" });
      const ra = new DexieGrowthMeasurementRepository(db, a.id);
      const rb = new DexieGrowthMeasurementRepository(db, b.id);
      const input = { measuredOn: "2024-06-01", kind: "stature" as const, valueMillimeters: 650 };
      const measurement = await ra.createGrowthMeasurement(input);
      expect(await rb.listGrowthMeasurements()).toEqual([]);
      await expect(rb.updateGrowthMeasurement(measurement.id, input)).rejects.toThrow();
      await expect(rb.deleteGrowthMeasurement(measurement.id)).rejects.toThrow();
      await children.delete(a.id, a.name);
      expect(await ra.listGrowthMeasurements()).toEqual([]);
      expect(await rb.listGrowthMeasurements()).toEqual([]);
    } finally {
      await db.delete();
    }
  });
});
