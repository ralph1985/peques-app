import type { TravelChecklistRepository } from "../application/travel-checklist-repository";
import {
  createTravelChecklistItem,
  type NewTravelChecklistItem,
  type TravelStorageLocation,
  type TravelChecklistReorder,
  type TravelStorageReorder,
} from "../domain/travel-checklist-item";
import type { PequesDatabase } from "@/shared/infrastructure/local/database";
import { assert, isUuid, order, optionalText, text } from "@/shared/domain/validation";

export class DexieTravelChecklistRepository implements TravelChecklistRepository {
  constructor(private readonly db: PequesDatabase) {}
  listTravelChecklistCategories() {
    return this.db.travelChecklistCategories.orderBy("sortOrder").toArray();
  }
  listTravelChecklistItems() {
    return this.db.travelChecklistItems.toArray();
  }
  listTravelStorageLocations() {
    return this.db.travelStorageLocations.orderBy("sortOrder").toArray();
  }
  private async requireCategory(id: string) {
    assert(
      isUuid(id) && (await this.db.travelChecklistCategories.get(id)),
      "La categoría no existe.",
    );
  }
  private async requireLocation(id: string | null | undefined) {
    if (id !== null && id !== undefined)
      assert(
        isUuid(id) && (await this.db.travelStorageLocations.get(id)),
        "La ubicación no existe.",
      );
  }
  private async requireItem(id: string) {
    const item = isUuid(id) ? await this.db.travelChecklistItems.get(id) : undefined;
    assert(item, "El elemento ya no existe.");
    return item;
  }
  async createTravelChecklistCategory(label: string) {
    const value = text(label, "Categoría", 80);
    return this.db.transaction("rw", this.db.travelChecklistCategories, async () => {
      const last = await this.db.travelChecklistCategories.orderBy("sortOrder").last();
      const category = {
        slug: crypto.randomUUID(),
        label: value,
        sortOrder: order((last?.sortOrder ?? -10) + 10),
      };
      await this.db.travelChecklistCategories.add(category);
      return category;
    });
  }
  async updateTravelChecklistCategory(slug: string, label: string, sortOrder: number) {
    const value = { label: text(label, "Categoría", 80), sortOrder: order(sortOrder) };
    await this.db.transaction("rw", this.db.travelChecklistCategories, async () => {
      await this.requireCategory(slug);
      await this.db.travelChecklistCategories.update(slug, value);
    });
  }
  async deleteTravelChecklistCategory(slug: string) {
    await this.db.transaction(
      "rw",
      this.db.travelChecklistCategories,
      this.db.travelChecklistItems,
      async () => {
        await this.requireCategory(slug);
        assert(
          !(await this.db.travelChecklistItems.where("category").equals(slug).count()),
          "Mueve o elimina sus elementos antes de borrar la categoría.",
        );
        await this.db.travelChecklistCategories.delete(slug);
      },
    );
  }
  private async validateLocation(id: string, value: Omit<TravelStorageLocation, "id">) {
    const label = text(value.label, "Ubicación", 80);
    const sortOrder = order(value.sortOrder);
    await this.requireLocation(value.parentId);
    const visited = new Set([id]);
    let parentId = value.parentId;
    while (parentId) {
      assert(!visited.has(parentId), "Una ubicación no puede contenerse a sí misma.");
      visited.add(parentId);
      parentId = (await this.db.travelStorageLocations.get(parentId))?.parentId ?? null;
    }
    return { label, sortOrder, parentId: value.parentId };
  }
  async createTravelStorageLocation(value: Omit<TravelStorageLocation, "id">) {
    return this.db.transaction("rw", this.db.travelStorageLocations, async () => {
      const id = crypto.randomUUID();
      const location = { ...(await this.validateLocation(id, value)), id };
      await this.db.travelStorageLocations.add(location);
      return location;
    });
  }
  async updateTravelStorageLocation(id: string, value: Omit<TravelStorageLocation, "id">) {
    await this.db.transaction("rw", this.db.travelStorageLocations, async () => {
      await this.requireLocation(id);
      await this.db.travelStorageLocations.put({ ...(await this.validateLocation(id, value)), id });
    });
  }
  async deleteTravelStorageLocation(id: string) {
    await this.db.transaction(
      "rw",
      this.db.travelStorageLocations,
      this.db.travelChecklistItems,
      async () => {
        await this.requireLocation(id);
        assert(
          !(await this.db.travelChecklistItems.where("storageLocationId").equals(id).count()) &&
            !(await this.db.travelStorageLocations.where("parentId").equals(id).count()),
          "Vacía la ubicación y sus compartimentos antes de borrarla.",
        );
        await this.db.travelStorageLocations.delete(id);
      },
    );
  }
  private async normalizeItem(input: NewTravelChecklistItem) {
    const value = createTravelChecklistItem({
      ...input,
      notes: optionalText(input.notes, "Notas"),
    });
    await this.requireCategory(value.category);
    await this.requireLocation(value.storageLocationId);
    assert(
      value.isPacked === undefined || typeof value.isPacked === "boolean",
      "Estado de preparación no válido.",
    );
    return {
      ...value,
      isPacked: value.isPacked ?? false,
      storageLocationId: value.storageLocationId ?? null,
      storageSortOrder: value.storageSortOrder == null ? null : order(value.storageSortOrder),
    };
  }
  async createTravelChecklistItem(input: NewTravelChecklistItem) {
    return this.db.transaction(
      "rw",
      this.db.travelChecklistItems,
      this.db.travelChecklistCategories,
      this.db.travelStorageLocations,
      async () => {
        const item = { ...(await this.normalizeItem(input)), id: crypto.randomUUID() };
        await this.db.travelChecklistItems.add(item);
        return item;
      },
    );
  }
  async updateTravelChecklistItem(id: string, input: NewTravelChecklistItem) {
    return this.db.transaction(
      "rw",
      this.db.travelChecklistItems,
      this.db.travelChecklistCategories,
      this.db.travelStorageLocations,
      async () => {
        const previous = await this.requireItem(id);
        const item = {
          ...(await this.normalizeItem({
            ...input,
            isPacked: input.isPacked ?? previous.isPacked,
          })),
          id,
        };
        await this.db.travelChecklistItems.put(item);
        return item;
      },
    );
  }
  async setTravelChecklistItemPacked(id: string, isPacked: boolean) {
    assert(typeof isPacked === "boolean", "Estado de preparación no válido.");
    return this.db.transaction("rw", this.db.travelChecklistItems, async () => {
      const item = { ...(await this.requireItem(id)), isPacked };
      await this.db.travelChecklistItems.put(item);
      return item;
    });
  }
  async deleteTravelChecklistItem(id: string) {
    await this.db.transaction("rw", this.db.travelChecklistItems, async () => {
      await this.requireItem(id);
      await this.db.travelChecklistItems.delete(id);
    });
  }
  async resetTravelChecklist() {
    await this.db.transaction("rw", this.db.travelChecklistItems, async () => {
      await this.db.travelChecklistItems.toCollection().modify({ isPacked: false });
    });
  }
  async reorderItems(items: TravelChecklistReorder[]) {
    assert(
      new Set(items.map((item) => item.id)).size === items.length,
      "Hay elementos repetidos en el orden.",
    );
    await this.db.transaction(
      "rw",
      this.db.travelChecklistItems,
      this.db.travelChecklistCategories,
      async () => {
        for (const item of items) {
          await this.requireItem(item.id);
          await this.requireCategory(item.category);
          await this.db.travelChecklistItems.update(item.id, {
            category: item.category,
            sortOrder: order(item.sortOrder),
          });
        }
      },
    );
  }
  async reorderStorage(items: TravelStorageReorder[]) {
    assert(
      new Set(items.map((item) => item.id)).size === items.length,
      "Hay elementos repetidos en el orden.",
    );
    await this.db.transaction(
      "rw",
      this.db.travelChecklistItems,
      this.db.travelStorageLocations,
      async () => {
        for (const item of items) {
          await this.requireItem(item.id);
          await this.requireLocation(item.storageLocationId);
          await this.db.travelChecklistItems.update(item.id, {
            storageLocationId: item.storageLocationId,
            storageSortOrder: item.storageSortOrder === null ? null : order(item.storageSortOrder),
          });
        }
      },
    );
  }
}
