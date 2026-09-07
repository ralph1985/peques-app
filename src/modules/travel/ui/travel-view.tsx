"use client";
import { useRef, useState, type ComponentProps, type ReactNode } from "react";
import { DragDropProvider, useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { usePeques } from "@/shared/ui/app-context";
import { useLocalData } from "@/shared/ui/use-local-data";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { LocalForm, field, errorMessage } from "@/shared/ui/local-form";
import type {
  TravelChecklistItem,
  TravelChecklistCategoryDefinition,
  TravelStorageLocation,
} from "../domain/travel-checklist-item";
import { createTravelChecklistItem } from "../application/create-travel-checklist-item";
import { updateTravelChecklistItem } from "../application/update-travel-checklist-item";
import { TravelOrganization } from "./travel-organization";
import styles from "@/app/(app)/viaje/page.module.css";

type ItemSheet =
  | { mode: "create"; category?: string }
  | { mode: "edit" | "delete"; item: TravelChecklistItem }
  | { mode: "reset" }
  | null;
type GroupItems = Record<string, string[]>;

function compareStorageOrder(a: TravelChecklistItem, b: TravelChecklistItem): number {
  return (
    (a.storageSortOrder ?? Number.MAX_SAFE_INTEGER) -
      (b.storageSortOrder ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id)
  );
}

export function TravelView() {
  const { app, family } = usePeques();
  const state = useLocalData(app.watchTravel);
  const [sheet, setSheet] = useState<ItemSheet>(null);
  const [dragGroups, setDragGroups] = useState<GroupItems | null>(null);
  const dragRef = useRef<GroupItems | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const checklist = state?.data;
  const view = family.settings.travelView;
  if (state?.error) return <p role="alert">No se pudo abrir la lista de viaje.</p>;
  if (!checklist) return <p role="status">Abriendo lista…</p>;
  const items = checklist.groups.flatMap((group) => group.items);
  const byId = new Map(items.map((item) => [item.id, item]));
  const groups =
    view === "prepare"
      ? checklist.groups.map((group) => ({
          id: group.category.slug,
          label: group.category.label,
          items: group.items,
        }))
      : [
          ...(checklist.locations ?? []).map((location) => ({
            id: location.id,
            label: locationLabel(location, checklist.locations ?? []),
            items: items
              .filter((item) => item.storageLocationId === location.id)
              .sort(compareStorageOrder),
          })),
          {
            id: "unassigned",
            label: "Sin ubicación",
            items: items.filter((item) => !item.storageLocationId).sort(compareStorageOrder),
          },
        ];
  const currentGroups = dragGroups
    ? groups.map((group) => ({
        ...group,
        items: (dragGroups[group.id] ?? []).map((id) => byId.get(id)!).filter(Boolean),
      }))
    : groups;
  async function run(action: () => Promise<unknown>) {
    setError(null);
    setSaving(true);
    try {
      await action();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSaving(false);
    }
  }
  function beginDrag() {
    const values = Object.fromEntries(
      groups.map((group) => [group.id, group.items.map((item) => item.id)]),
    );
    dragRef.current = values;
    setDragGroups(values);
  }
  function dragOver(
    event: Parameters<NonNullable<ComponentProps<typeof DragDropProvider>["onDragOver"]>>[0],
  ) {
    const current = dragRef.current;
    if (!current) return;
    const next = move(current, event);
    // Keep the drop snapshot synchronous, even when React batches the preview render.
    dragRef.current = next;
    setDragGroups(next);
  }
  function endDrag(
    event: Parameters<NonNullable<ComponentProps<typeof DragDropProvider>["onDragEnd"]>>[0],
  ) {
    const values = dragRef.current;
    dragRef.current = null;
    setDragGroups(null);
    if (event.canceled || !values || !event.operation.source) return;
    void run(async () => {
      if (view === "prepare")
        await app.travel.reorderItems(
          Object.entries(values).flatMap(([category, ids]) =>
            ids.map((id, index) => ({ id, category, sortOrder: (index + 1) * 10 })),
          ),
        );
      else
        await app.travel.reorderStorage(
          Object.entries(values).flatMap(([group, ids]) =>
            ids.map((id, index) => ({
              id,
              storageLocationId: group === "unassigned" ? null : group,
              storageSortOrder: (index + 1) * 10,
            })),
          ),
        );
      setAnnouncement("Orden guardado.");
    });
  }
  return (
    <>
      <section className={styles.panel}>
        <div className={styles.sectionTitle}>
          <h2>Preparado</h2>
          <span>
            {checklist.progress.packed} de {checklist.progress.total}
          </span>
        </div>
        <progress
          aria-label="Progreso de la lista"
          value={checklist.progress.packed}
          max={Math.max(1, checklist.progress.total)}
        />
        <div className={styles.actions}>
          <div className={styles.modeSwitch} role="group" aria-label="Modo de organización">
            <button
              aria-pressed={view === "prepare"}
              onClick={() => void run(() => app.settings.update({ travelView: "prepare" }))}
            >
              Preparar
            </button>
            <button
              aria-pressed={view === "location"}
              onClick={() => void run(() => app.settings.update({ travelView: "location" }))}
            >
              Dónde está
            </button>
          </div>
          <button
            className={styles.iconCommandButton}
            aria-label="Añadir a la lista"
            onClick={() => setSheet({ mode: "create" })}
          >
            +
          </button>
          <button
            className={styles.iconCommandButton}
            aria-label="Reiniciar lista"
            onClick={() => setSheet({ mode: "reset" })}
          >
            ↺
          </button>
        </div>
        <p className={styles.orderHint}>
          Lista familiar. Arrastra desde ⋮⋮ para ordenar; también puedes usar el teclado.
        </p>
        {error && <p role="alert">{error}</p>}
        <p className={styles.srOnly} role="status">
          {saving ? "Guardando…" : announcement}
        </p>
      </section>
      <section className={styles.panel} aria-busy={saving}>
        <h2>Checklist</h2>
        <DragDropProvider
          key={view}
          onDragStart={beginDrag}
          onDragOver={dragOver}
          onDragEnd={endDrag}
        >
          <div className={styles.groups}>
            {currentGroups.map((group) => (
              <details className={styles.group} open key={group.id}>
                <summary className={styles.groupHeader}>
                  <span className={styles.groupTitle}>{group.label}</span>
                  <span>{group.items.length}</span>
                </summary>
                <DropZone id={group.id}>
                  {group.items.map((item, index) => (
                    <ItemRow
                      key={item.id}
                      group={group.id}
                      index={index}
                      item={item}
                      disabled={saving}
                      onEdit={() => setSheet({ mode: "edit", item })}
                      onDelete={() => setSheet({ mode: "delete", item })}
                      onToggle={() =>
                        void run(() =>
                          app.travel.setTravelChecklistItemPacked(item.id, !item.isPacked),
                        )
                      }
                    />
                  ))}
                  {!group.items.length && <li className={styles.empty}>Sin elementos</li>}
                </DropZone>
                {view === "prepare" && (
                  <button
                    className="text-button"
                    onClick={() => setSheet({ mode: "create", category: group.id })}
                    aria-label={`Añadir a ${group.label}`}
                  >
                    + Añadir
                  </button>
                )}
              </details>
            ))}
          </div>
        </DragDropProvider>
      </section>
      <TravelOrganization categories={checklist.categories} locations={checklist.locations ?? []} />
      {sheet && (
        <BottomSheet
          ariaLabel="Lista de viaje"
          labelledBy="travel-sheet-title"
          onClose={() => setSheet(null)}
          styles={styles}
        >
          <div className="sheet-content">
            <h2 id="travel-sheet-title">
              {sheet.mode === "create"
                ? "Añadir a la lista"
                : sheet.mode === "edit"
                  ? "Editar elemento"
                  : sheet.mode === "reset"
                    ? "Reiniciar lista"
                    : "Borrar elemento"}
            </h2>
            {sheet.mode === "create" || sheet.mode === "edit" ? (
              <ItemForm
                item={sheet.mode === "edit" ? sheet.item : undefined}
                category={sheet.mode === "create" ? sheet.category : undefined}
                categories={checklist.categories}
                locations={checklist.locations ?? []}
                items={items}
                onDone={() => setSheet(null)}
              />
            ) : (
              <LocalForm
                submitLabel={sheet.mode === "reset" ? "Reiniciar lista" : "Borrar elemento"}
                onCancel={() => setSheet(null)}
                onSuccess={() => setSheet(null)}
                action={() =>
                  sheet.mode === "reset"
                    ? app.travel.resetTravelChecklist()
                    : app.travel.deleteTravelChecklistItem(sheet.item.id)
                }
              >
                <p>
                  {sheet.mode === "reset"
                    ? "Se desmarcarán todos los elementos. Se conservarán la lista, sus notas y su organización."
                    : `¿Borrar ${sheet.item.label}? Esta acción no se puede deshacer.`}
                </p>
              </LocalForm>
            )}
          </div>
        </BottomSheet>
      )}
    </>
  );
}

function DropZone({ id, children }: { id: string; children: ReactNode }) {
  const { ref, isDropTarget } = useDroppable({
    id,
    accept: "travel-item",
    type: "travel-group",
    // A containing list must not intercept the more specific item drop targets.
    collisionPriority: -1,
  });
  return (
    <ol ref={ref} className={styles.items} data-drop-target={isDropTarget}>
      {children}
    </ol>
  );
}
function ItemRow({
  item,
  group,
  index,
  onEdit,
  onDelete,
  onToggle,
  disabled,
}: {
  item: TravelChecklistItem;
  group: string;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  disabled: boolean;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: item.id,
    group,
    index,
    accept: "travel-item",
    type: "travel-item",
    collisionPriority: 1,
    disabled,
  });
  return (
    <li
      ref={ref}
      data-packed={item.isPacked}
      data-dragging={isDragging}
      data-travel-item-id={item.id}
    >
      <div className={styles.itemCheck}>
        <button
          aria-label={`${item.isPacked ? "Marcar pendiente" : "Marcar preparado"}: ${item.label}`}
          aria-pressed={item.isPacked}
          disabled={disabled}
          onClick={onToggle}
        >
          {item.isPacked ? "✓" : ""}
        </button>
      </div>
      <div className={styles.itemBody}>
        <strong>{item.label}</strong>
        {item.notes && <p>{item.notes}</p>}
      </div>
      <button
        className={styles.dragHandle}
        ref={handleRef}
        aria-label={`Mover ${item.label}`}
        disabled={disabled}
      >
        ⋮⋮
      </button>
      <div className={styles.itemActions}>
        <button
          className={styles.iconButton}
          aria-label={`Editar ${item.label}`}
          disabled={disabled}
          onClick={onEdit}
        >
          ✎
        </button>
        <button
          className={styles.dangerIconButton}
          aria-label={`Borrar ${item.label}`}
          disabled={disabled}
          onClick={onDelete}
        >
          ×
        </button>
      </div>
    </li>
  );
}

function ItemForm({
  item,
  category,
  categories,
  locations,
  items,
  onDone,
}: {
  item?: TravelChecklistItem;
  category?: string;
  categories: TravelChecklistCategoryDefinition[];
  locations: TravelStorageLocation[];
  items: TravelChecklistItem[];
  onDone: () => void;
}) {
  const { app } = usePeques();
  return (
    <LocalForm
      submitLabel={item ? "Guardar cambios" : "Añadir elemento"}
      onSuccess={onDone}
      onCancel={onDone}
      action={(data) => {
        const category = field(data, "category");
        const storageLocationId = field(data, "storageLocationId") || null;
        const input = {
          label: field(data, "label"),
          category,
          notes: field(data, "notes"),
          isPacked: item?.isPacked ?? false,
          sortOrder:
            item?.category === category
              ? item.sortOrder
              : Math.max(
                  0,
                  ...items.filter((row) => row.category === category).map((row) => row.sortOrder),
                ) + 10,
          storageLocationId,
          storageSortOrder:
            item?.storageLocationId === storageLocationId
              ? (item.storageSortOrder ?? null)
              : Math.max(
                  0,
                  ...items
                    .filter((row) => (row.storageLocationId ?? null) === storageLocationId)
                    .map((row) => row.storageSortOrder ?? 0),
                ) + 10,
        };
        return item
          ? updateTravelChecklistItem(app.travel, item.id, input)
          : createTravelChecklistItem(app.travel, input);
      }}
    >
      <label>
        Elemento
        <input name="label" required maxLength={120} defaultValue={item?.label ?? ""} />
      </label>
      <label>
        Categoría
        <select
          name="category"
          required
          defaultValue={item?.category ?? category ?? categories[0]?.slug}
        >
          {categories.map((row) => (
            <option value={row.slug} key={row.slug}>
              {row.label}
            </option>
          ))}
        </select>
      </label>
      {!categories.length && <p>Crea una categoría en Organización para añadir elementos.</p>}
      <label>
        Ubicación
        <select name="storageLocationId" defaultValue={item?.storageLocationId ?? ""}>
          <option value="">Sin ubicación</option>
          {locations.map((row) => (
            <option value={row.id} key={row.id}>
              {locationLabel(row, locations)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Notas
        <textarea name="notes" maxLength={4000} rows={3} defaultValue={item?.notes ?? ""} />
      </label>
    </LocalForm>
  );
}

export function locationLabel(
  location: TravelStorageLocation,
  locations: TravelStorageLocation[],
): string {
  const labels = [location.label];
  const visited = new Set([location.id]);
  let parent = locations.find((row) => row.id === location.parentId);
  while (parent && !visited.has(parent.id)) {
    labels.unshift(parent.label);
    visited.add(parent.id);
    parent = locations.find((row) => row.id === parent!.parentId);
  }
  return labels.join(" / ");
}
