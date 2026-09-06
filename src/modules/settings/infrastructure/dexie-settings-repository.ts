import type { SettingsInput, SettingsRepository } from "../application/settings-repository";
import type { PequesDatabase } from "@/shared/infrastructure/local/database";
import { assert, isTimestamp } from "@/shared/domain/validation";

export class DexieSettingsRepository implements SettingsRepository {
  constructor(private readonly db: PequesDatabase) {}
  async read() {
    const settings = await this.db.settings.get("main");
    assert(settings, "No se pudo leer la configuración local.");
    return settings;
  }
  async update(input: Partial<SettingsInput>) {
    const patch: Partial<SettingsInput> = {};
    if (input.travelView !== undefined) {
      assert(["prepare", "location"].includes(input.travelView), "Vista de viaje no válida.");
      patch.travelView = input.travelView;
    }
    if (input.vaccineView !== undefined) {
      assert(["status", "timeline"].includes(input.vaccineView), "Vista de vacunas no válida.");
      patch.vaccineView = input.vaccineView;
    }
    if (input.calendarAllChildren !== undefined) {
      assert(typeof input.calendarAllChildren === "boolean", "Vista de calendario no válida.");
      patch.calendarAllChildren = input.calendarAllChildren;
    }
    await this.db.transaction("rw", this.db.settings, async () => {
      await this.read();
      await this.db.settings.update("main", patch);
    });
  }
  async recordExport(timestamp: string) {
    assert(isTimestamp(timestamp), "Fecha de exportación no válida.");
    await this.db.transaction("rw", this.db.settings, async () => {
      await this.read();
      await this.db.settings.update("main", { lastExportedAt: timestamp });
    });
  }
}
