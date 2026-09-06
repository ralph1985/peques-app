import type { Table } from "dexie";
import type { PequesDatabase } from "./database";
import { assert, isUuid } from "@/shared/domain/validation";

export async function requireChild(db: PequesDatabase, childId: string): Promise<void> {
  assert(
    isUuid(childId) && (await db.children.get(childId)),
    "El hijo ya no existe. Selecciona otro perfil.",
  );
}

export async function requireOwned<T extends { childId: string }>(
  table: Table<T, string>,
  id: string,
  childId: string,
): Promise<T> {
  const record = isUuid(id) ? await table.get(id) : undefined;
  assert(
    record && record.childId === childId,
    "El registro no pertenece al hijo seleccionado o ya no existe.",
  );
  return record;
}
