"use client";
import { useState } from "react";
import { usePeques } from "@/shared/ui/app-context";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { LocalForm, field } from "@/shared/ui/local-form";
import type {
  TravelChecklistCategoryDefinition,
  TravelStorageLocation,
} from "../domain/travel-checklist-item";
import styles from "@/app/(app)/viaje/page.module.css";

type OrganizationSheet =
  | { kind: "category"; value?: TravelChecklistCategoryDefinition; deleting?: boolean }
  | { kind: "location"; value?: TravelStorageLocation; deleting?: boolean }
  | null;
export function TravelOrganization({
  categories,
  locations,
}: {
  categories: TravelChecklistCategoryDefinition[];
  locations: TravelStorageLocation[];
}) {
  const { app } = usePeques();
  const [sheet, setSheet] = useState<OrganizationSheet>(null);
  return (
    <section className={styles.panel}>
      <details>
        <summary className="section-heading">
          <h2>Organización</h2>
        </summary>
        <div className="organization-body">
          <h3>Categorías</h3>
          <ul className="child-list">
            {categories.map((value) => (
              <li key={value.slug}>
                <strong>{value.label}</strong>
                <div className="row-actions">
                  <button
                    aria-label={`Editar categoría ${value.label}`}
                    onClick={() => setSheet({ kind: "category", value })}
                  >
                    Editar
                  </button>
                  <button
                    aria-label={`Borrar categoría ${value.label}`}
                    onClick={() => setSheet({ kind: "category", value, deleting: true })}
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button className="text-button" onClick={() => setSheet({ kind: "category" })}>
            Crear categoría
          </button>
          <h3>Ubicaciones y compartimentos</h3>
          <ul className="child-list">
            {locations.map((value) => (
              <li key={value.id}>
                <div>
                  <strong>{value.label}</strong>
                  {value.parentId && (
                    <span>
                      Dentro de {locations.find((row) => row.id === value.parentId)?.label}
                    </span>
                  )}
                </div>
                <div className="row-actions">
                  <button
                    aria-label={`Editar ubicación ${value.label}`}
                    onClick={() => setSheet({ kind: "location", value })}
                  >
                    Editar
                  </button>
                  <button
                    aria-label={`Borrar ubicación ${value.label}`}
                    onClick={() => setSheet({ kind: "location", value, deleting: true })}
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button className="text-button" onClick={() => setSheet({ kind: "location" })}>
            Crear ubicación
          </button>
        </div>
      </details>
      {sheet && (
        <BottomSheet
          ariaLabel="Organización de viaje"
          labelledBy="organization-title"
          styles={styles}
          onClose={() => setSheet(null)}
        >
          <div className="sheet-content">
            <h2 id="organization-title">
              {sheet.deleting ? "Borrar" : sheet.value ? "Editar" : "Crear"}{" "}
              {sheet.kind === "category" ? "categoría" : "ubicación"}
            </h2>
            <LocalForm
              submitLabel={sheet.deleting ? "Borrar" : "Guardar"}
              onCancel={() => setSheet(null)}
              onSuccess={() => setSheet(null)}
              action={(data) => {
                if (sheet.kind === "category") {
                  if (sheet.deleting)
                    return app.travel.deleteTravelChecklistCategory(sheet.value!.slug);
                  return sheet.value
                    ? app.travel.updateTravelChecklistCategory(
                        sheet.value.slug,
                        field(data, "label"),
                        Number(field(data, "sortOrder")),
                      )
                    : app.travel.createTravelChecklistCategory(field(data, "label"));
                }
                if (sheet.deleting) return app.travel.deleteTravelStorageLocation(sheet.value!.id);
                const value = {
                  label: field(data, "label"),
                  parentId: field(data, "parentId") || null,
                  sortOrder: Number(field(data, "sortOrder")),
                };
                return sheet.value
                  ? app.travel.updateTravelStorageLocation(sheet.value.id, value)
                  : app.travel.createTravelStorageLocation(value);
              }}
            >
              {sheet.deleting ? (
                <p>
                  ¿Borrar {sheet.value?.label}? Solo se puede borrar si no contiene elementos ni
                  compartimentos.
                </p>
              ) : (
                <>
                  <label>
                    Nombre
                    <input
                      name="label"
                      required
                      maxLength={80}
                      defaultValue={sheet.value?.label ?? ""}
                    />
                  </label>
                  {(sheet.value || sheet.kind === "location") && (
                    <label>
                      Orden
                      <input
                        name="sortOrder"
                        type="number"
                        min={0}
                        max={10000}
                        step={1}
                        defaultValue={sheet.value?.sortOrder ?? locations.length * 10}
                        required
                      />
                    </label>
                  )}
                  {sheet.kind === "location" && (
                    <label>
                      Dentro de
                      <select name="parentId" defaultValue={sheet.value?.parentId ?? ""}>
                        <option value="">Ninguna · ubicación principal</option>
                        {locations
                          .filter((row) => row.id !== sheet.value?.id)
                          .map((row) => (
                            <option value={row.id} key={row.id}>
                              {row.label}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                </>
              )}
            </LocalForm>
          </div>
        </BottomSheet>
      )}
    </section>
  );
}
