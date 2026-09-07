"use client";
import { usePeques } from "@/shared/ui/app-context";
import { LocalForm, field } from "@/shared/ui/local-form";
import type { Child } from "../domain/child";
import { localDate } from "@/shared/domain/validation";

export function ChildForm({
  child,
  onDone,
  onCancel,
}: {
  child?: Child;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const { app } = usePeques();
  return (
    <LocalForm
      submitLabel={child ? "Guardar cambios" : "Añadir hijo"}
      onSuccess={onDone}
      onCancel={onCancel}
      action={(data) => {
        const sexValue = field(data, "sex");
        const input = {
          name: field(data, "name"),
          birthDate: field(data, "birthDate"),
          birthTime: field(data, "birthTime") || undefined,
          sex:
            sexValue === "female"
              ? ("female" as const)
              : sexValue === "male"
                ? ("male" as const)
                : ("unspecified" as const),
          healthId: field(data, "healthId") || undefined,
          gestationalAgeWeeks: field(data, "gestationalAgeWeeks")
            ? Number(field(data, "gestationalAgeWeeks"))
            : undefined,
          gestationalAgeDays: field(data, "gestationalAgeDays")
            ? Number(field(data, "gestationalAgeDays"))
            : undefined,
        };
        return child ? app.children.update(child.id, input) : app.children.create(input);
      }}
    >
      <label>
        Nombre
        <input
          name="name"
          required
          maxLength={80}
          autoComplete="off"
          defaultValue={child?.name ?? ""}
        />
      </label>
      <label>
        Fecha de nacimiento
        <input
          name="birthDate"
          type="date"
          required
          max={localDate()}
          defaultValue={child?.birthDate ?? ""}
        />
      </label>
      <label>
        Hora de nacimiento · opcional
        <input name="birthTime" type="time" defaultValue={child?.birthTime ?? ""} />
      </label>
      <label>
        Sexo · opcional
        <select name="sex" defaultValue={child?.sex ?? "unspecified"}>
          <option value="unspecified">Sin especificar</option>
          <option value="female">Niña</option>
          <option value="male">Niño</option>
        </select>
      </label>
      <details>
        <summary>Datos avanzados</summary>
        <label>
          Identificador sanitario · opcional y sensible
          <input
            name="healthId"
            maxLength={80}
            autoComplete="off"
            defaultValue={child?.healthId ?? ""}
          />
        </label>
      </details>
      <fieldset className="form-fieldset">
        <legend>Prematuridad · opcional</legend>
        <p className="form-help">
          Solo sirve para mostrar edad corregida en las gráficas. Confírmalo con tu pediatra si el
          nacimiento fue prematuro.
        </p>
        <div className="form-grid-two">
          <label>
            Semanas de gestación
            <input
              name="gestationalAgeWeeks"
              type="number"
              min={22}
              max={42}
              step={1}
              inputMode="numeric"
              defaultValue={child?.gestationalAgeWeeks ?? ""}
            />
          </label>
          <label>
            Días adicionales
            <input
              name="gestationalAgeDays"
              type="number"
              min={0}
              max={6}
              step={1}
              inputMode="numeric"
              defaultValue={child?.gestationalAgeDays ?? ""}
            />
          </label>
        </div>
      </fieldset>
      {child && (
        <p>
          Si cambias el nacimiento, revisa las fechas de vacunas. Se conservan las citas y
          aplicaciones ya guardadas.
        </p>
      )}
    </LocalForm>
  );
}
