import { validateChild, type Child } from "@/modules/profile/domain/child";
import {
  createWeightEntry,
  isWeightPlace,
  type WeightEntry,
} from "@/modules/weight/domain/weight-entry";
import {
  createPlannedVaccineDose,
  createAppliedVaccineDose,
  type PlannedVaccineDose,
  type AppliedVaccineDose,
} from "@/modules/vaccines/domain/vaccine-calendar";
import { createSleepEntry, isSleepKind, type SleepEntry } from "@/modules/sleep/domain/sleep-entry";
import {
  createGrowthMeasurement,
  growthMeasurementKinds,
  type GrowthMeasurement,
} from "@/modules/growth/domain/growth-measurement";
import type {
  TravelChecklistCategoryDefinition,
  TravelChecklistItem,
  TravelStorageLocation,
} from "@/modules/travel/domain/travel-checklist-item";
import { isTutorialRoute, type AppSettings } from "@/modules/settings/domain/settings";
import {
  assert,
  isDate,
  isTimestamp,
  isUuid,
  order,
  text,
  ValidationError,
} from "@/shared/domain/validation";

export type BackupData = {
  children: Child[];
  weightEntries: WeightEntry[];
  growthMeasurements: GrowthMeasurement[];
  plannedVaccineDoses: PlannedVaccineDose[];
  appliedVaccineDoses: AppliedVaccineDose[];
  sleepEntries: SleepEntry[];
  travelChecklistCategories: TravelChecklistCategoryDefinition[];
  travelChecklistItems: TravelChecklistItem[];
  travelStorageLocations: TravelStorageLocation[];
  settings: AppSettings[];
};
export type PequesBackup = {
  format: "peques-backup";
  schemaVersion: 1 | 2 | 3;
  exportedAt: string;
  data: BackupData;
};
export const backupTables = [
  "children",
  "weightEntries",
  "growthMeasurements",
  "plannedVaccineDoses",
  "appliedVaccineDoses",
  "sleepEntries",
  "travelChecklistCategories",
  "travelChecklistItems",
  "travelStorageLocations",
  "settings",
] as const;
export const maxBackupBytes = 25 * 1024 * 1024;

function record(
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): Record<string, unknown> {
  assert(
    value !== null && typeof value === "object" && !Array.isArray(value),
    "La copia contiene un registro no válido.",
  );
  const row = value as Record<string, unknown>;
  assert(
    required.every((key) => Object.hasOwn(row, key)),
    "Faltan campos en la copia.",
  );
  assert(
    Object.keys(row).every((key) => required.includes(key) || optional.includes(key)),
    "La copia contiene campos desconocidos.",
  );
  return row;
}
function uuid(value: unknown): string {
  assert(isUuid(value), "Identificador UUID no válido.");
  return value;
}
function timestamp(value: unknown): string {
  assert(isTimestamp(value), "Timestamp no válido.");
  return value;
}
function date(value: unknown): string {
  assert(isDate(value), "Fecha no válida.");
  return value;
}
function boolean(value: unknown): boolean {
  assert(typeof value === "boolean", "Valor booleano no válido.");
  return value;
}
function nullableText(value: unknown, max = 4000): string | null {
  if (value === null || value === undefined) return null;
  assert(typeof value === "string" && value.length <= max, "Texto opcional no válido.");
  return value;
}
function nullableUuid(value: unknown): string | null {
  return value === null || value === undefined ? null : uuid(value);
}
function owned(row: Record<string, unknown>) {
  return { id: uuid(row.id), childId: uuid(row.childId) };
}

function parseChild(value: unknown): Child {
  const row = record(
    value,
    ["id", "name", "birthDate", "createdAt", "updatedAt"],
    ["birthTime", "sex", "healthId"],
  );
  assert(
    row.sex === undefined ||
      row.sex === "female" ||
      row.sex === "male" ||
      row.sex === "unspecified",
    "Sexo no válido.",
  );
  assert(
    row.birthTime === undefined || typeof row.birthTime === "string",
    "Hora de nacimiento no válida.",
  );
  assert(
    row.healthId === undefined || typeof row.healthId === "string",
    "Identificador sanitario no válido.",
  );
  return {
    ...validateChild({
      name: text(row.name, "Nombre", 80),
      birthDate: date(row.birthDate),
      birthTime: row.birthTime,
      sex: row.sex,
      healthId: row.healthId,
    }),
    id: uuid(row.id),
    createdAt: timestamp(row.createdAt),
    updatedAt: timestamp(row.updatedAt),
  };
}
function parseWeight(value: unknown): WeightEntry {
  const row = record(value, ["id", "childId", "measuredOn", "weightGrams", "place"], ["notes"]);
  assert(typeof row.place === "string" && isWeightPlace(row.place), "Lugar de peso no válido.");
  assert(typeof row.weightGrams === "number", "Peso no válido.");
  return {
    ...createWeightEntry({
      measuredOn: date(row.measuredOn),
      weightGrams: row.weightGrams,
      place: row.place,
      notes: nullableText(row.notes),
    }),
    ...owned(row),
  };
}
function parseGrowthMeasurement(value: unknown): GrowthMeasurement {
  const row = record(value, ["id", "childId", "measuredOn", "kind", "valueMillimeters"], ["notes"]);
  assert(
    typeof row.kind === "string" && growthMeasurementKinds.includes(row.kind as never),
    "Tipo de medida de crecimiento no válido.",
  );
  assert(typeof row.valueMillimeters === "number", "Valor de crecimiento no válido.");
  return {
    ...createGrowthMeasurement({
      measuredOn: date(row.measuredOn),
      kind: row.kind as GrowthMeasurement["kind"],
      valueMillimeters: row.valueMillimeters,
      notes: nullableText(row.notes),
    }),
    ...owned(row),
  };
}
function parsePlanned(value: unknown): PlannedVaccineDose {
  const row = record(value, [
    "id",
    "childId",
    "vaccineName",
    "doseLabel",
    "plannedDate",
    "ageLabel",
    "notes",
  ]);
  return {
    ...createPlannedVaccineDose({
      vaccineName: text(row.vaccineName, "Vacuna"),
      doseLabel: text(row.doseLabel, "Dosis"),
      plannedDate: row.plannedDate === null ? null : date(row.plannedDate),
      ageLabel: nullableText(row.ageLabel, 120),
      notes: nullableText(row.notes),
    }),
    ...owned(row),
  };
}
function parseApplied(value: unknown): AppliedVaccineDose {
  const row = record(value, [
    "id",
    "childId",
    "plannedDoseId",
    "appliedOn",
    "vaccineName",
    "doseLabel",
    "place",
    "lot",
    "notes",
  ]);
  return {
    ...createAppliedVaccineDose({
      plannedDoseId: nullableUuid(row.plannedDoseId),
      appliedOn: date(row.appliedOn),
      vaccineName: text(row.vaccineName, "Vacuna"),
      doseLabel: text(row.doseLabel, "Dosis"),
      place: text(row.place, "Lugar"),
      lot: nullableText(row.lot, 120),
      notes: nullableText(row.notes),
    }),
    ...owned(row),
  };
}
function parseSleep(value: unknown): SleepEntry {
  const row = record(value, [
    "id",
    "childId",
    "kind",
    "startedAt",
    "endedAt",
    "createdAt",
    "updatedAt",
  ]);
  assert(typeof row.kind === "string" && isSleepKind(row.kind), "Tipo de sueño no válido.");
  return {
    ...createSleepEntry({
      kind: row.kind,
      startedAt: timestamp(row.startedAt),
      endedAt: row.endedAt === null ? null : timestamp(row.endedAt),
    }),
    ...owned(row),
    createdAt: timestamp(row.createdAt),
    updatedAt: timestamp(row.updatedAt),
  };
}
function parseCategory(value: unknown): TravelChecklistCategoryDefinition {
  const row = record(value, ["slug", "label", "sortOrder"]);
  return {
    slug: uuid(row.slug),
    label: text(row.label, "Categoría", 80),
    sortOrder: order(row.sortOrder),
  };
}
function parseLocation(value: unknown): TravelStorageLocation {
  const row = record(value, ["id", "label", "parentId", "sortOrder"]);
  return {
    id: uuid(row.id),
    label: text(row.label, "Ubicación", 80),
    parentId: nullableUuid(row.parentId),
    sortOrder: order(row.sortOrder),
  };
}
function parseItem(value: unknown): TravelChecklistItem {
  const row = record(
    value,
    ["id", "label", "category", "sortOrder", "isPacked"],
    ["notes", "storageLocationId", "storageSortOrder"],
  );
  return {
    id: uuid(row.id),
    label: text(row.label, "Elemento"),
    category: uuid(row.category),
    sortOrder: order(row.sortOrder),
    isPacked: boolean(row.isPacked),
    notes: nullableText(row.notes),
    storageLocationId: nullableUuid(row.storageLocationId),
    storageSortOrder: row.storageSortOrder == null ? null : order(row.storageSortOrder),
  };
}
function parseSettings(
  value: unknown,
  legacyFirstUsedAt: string,
  requireFirstUsedAt: boolean,
): AppSettings {
  const row = record(
    value,
    [
      "id",
      "activeChildId",
      "lastExportedAt",
      "travelView",
      "vaccineView",
      "calendarAllChildren",
      ...(requireFirstUsedAt ? ["firstUsedAt"] : []),
    ],
    [
      "tutorialSeenRoutes",
      "tutorialReplayRequested",
      ...(requireFirstUsedAt ? [] : ["firstUsedAt"]),
    ],
  );
  assert(row.id === "main", "Identificador de configuración no válido.");
  assert(
    row.travelView === "prepare" || row.travelView === "location",
    "Vista de viaje no válida.",
  );
  assert(
    row.vaccineView === "status" || row.vaccineView === "timeline",
    "Vista de vacunas no válida.",
  );
  const tutorialSeenRoutes = row.tutorialSeenRoutes ?? [];
  assert(
    Array.isArray(tutorialSeenRoutes) && tutorialSeenRoutes.every(isTutorialRoute),
    "Rutas del tutorial no válidas.",
  );
  const tutorialReplayRequested = row.tutorialReplayRequested ?? false;
  assert(typeof tutorialReplayRequested === "boolean", "Estado del tutorial no válido.");
  const firstUsedAt =
    row.firstUsedAt === undefined ? legacyFirstUsedAt : timestamp(row.firstUsedAt);
  return {
    id: "main",
    firstUsedAt,
    activeChildId: nullableUuid(row.activeChildId),
    lastExportedAt: row.lastExportedAt === null ? null : timestamp(row.lastExportedAt),
    tutorialSeenRoutes: [...new Set(tutorialSeenRoutes)],
    tutorialReplayRequested,
    travelView: row.travelView,
    vaccineView: row.vaccineView,
    calendarAllChildren: boolean(row.calendarAllChildren),
  };
}
function array<T>(value: unknown, parse: (row: unknown) => T): T[] {
  assert(Array.isArray(value), "Una tabla de la copia no es una lista.");
  return value.map(parse);
}

export function validateBackup(value: unknown): PequesBackup {
  const root = record(value, ["format", "schemaVersion", "exportedAt", "data"]);
  assert(root.format === "peques-backup", "El archivo no es una copia de Peques.");
  assert(
    root.schemaVersion === 1 || root.schemaVersion === 2 || root.schemaVersion === 3,
    "Esta versión de copia no es compatible con Peques.",
  );
  const exportedAt = timestamp(root.exportedAt);
  const requiredTables =
    root.schemaVersion === 1
      ? backupTables.filter((name) => name !== "growthMeasurements")
      : backupTables;
  const raw = record(root.data, requiredTables);
  const data: BackupData = {
    children: array(raw.children, parseChild),
    weightEntries: array(raw.weightEntries, parseWeight),
    growthMeasurements:
      root.schemaVersion === 1 ? [] : array(raw.growthMeasurements, parseGrowthMeasurement),
    plannedVaccineDoses: array(raw.plannedVaccineDoses, parsePlanned),
    appliedVaccineDoses: array(raw.appliedVaccineDoses, parseApplied),
    sleepEntries: array(raw.sleepEntries, parseSleep),
    travelChecklistCategories: array(raw.travelChecklistCategories, parseCategory),
    travelChecklistItems: array(raw.travelChecklistItems, parseItem),
    travelStorageLocations: array(raw.travelStorageLocations, parseLocation),
    settings: array(raw.settings, (value) =>
      parseSettings(value, exportedAt, root.schemaVersion === 3),
    ),
  };
  const ids = new Set<string>();
  for (const name of backupTables.filter((name) => name !== "settings")) {
    for (const row of data[name]) {
      const id = "id" in row ? row.id : row.slug;
      assert(!ids.has(id), "La copia contiene identificadores duplicados.");
      ids.add(id);
    }
  }
  const childIds = new Set(data.children.map((child) => child.id));
  for (const row of [
    ...data.weightEntries,
    ...data.plannedVaccineDoses,
    ...data.appliedVaccineDoses,
    ...data.sleepEntries,
  ])
    assert(childIds.has(row.childId), "La copia contiene registros sin hijo.");
  const plans = new Map(data.plannedVaccineDoses.map((dose) => [dose.id, dose]));
  const appliedPlans = new Set<string>();
  for (const row of data.appliedVaccineDoses) {
    if (row.plannedDoseId === null) continue;
    assert(
      plans.get(row.plannedDoseId)?.childId === row.childId,
      "Una aplicación no corresponde al plan de su hijo.",
    );
    assert(!appliedPlans.has(row.plannedDoseId), "Una dosis tiene más de una aplicación.");
    appliedPlans.add(row.plannedDoseId);
  }
  const activeTimers = new Set<string>();
  for (const row of data.sleepEntries.filter((row) => row.endedAt === null)) {
    assert(!activeTimers.has(row.childId), "Un hijo tiene más de un cronómetro activo.");
    activeTimers.add(row.childId);
  }
  const categories = new Set(data.travelChecklistCategories.map((row) => row.slug));
  const locations = new Map(data.travelStorageLocations.map((row) => [row.id, row]));
  for (const row of data.travelChecklistItems) {
    assert(categories.has(row.category), "Un elemento de viaje no tiene categoría.");
    assert(
      row.storageLocationId == null || locations.has(row.storageLocationId),
      "Un elemento de viaje no tiene ubicación válida.",
    );
  }
  for (const row of data.travelStorageLocations) {
    const visited = new Set([row.id]);
    let parentId = row.parentId;
    while (parentId !== null) {
      assert(!visited.has(parentId), "La jerarquía de ubicaciones contiene un ciclo.");
      visited.add(parentId);
      const parent = locations.get(parentId);
      assert(parent, "Una ubicación tiene un contenedor inexistente.");
      parentId = parent.parentId;
    }
  }
  assert(data.settings.length === 1, "La copia debe contener una configuración local.");
  const activeId = data.settings[0].activeChildId;
  assert(
    childIds.size ? activeId !== null && childIds.has(activeId) : activeId === null,
    "El hijo seleccionado no es válido.",
  );
  return {
    format: "peques-backup",
    schemaVersion: root.schemaVersion,
    exportedAt,
    data,
  };
}

export function parseBackup(contents: string): PequesBackup {
  assert(
    new TextEncoder().encode(contents).length <= maxBackupBytes,
    "La copia supera el límite de 25 MiB.",
  );
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch {
    throw new ValidationError("El archivo no contiene JSON válido.");
  }
  return validateBackup(value);
}

export function summarizeBackup(backup: PequesBackup) {
  return Object.fromEntries(backupTables.map((name) => [name, backup.data[name].length])) as Record<
    keyof BackupData,
    number
  >;
}
