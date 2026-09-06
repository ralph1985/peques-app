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
      <label>
        Identificador sanitario · opcional
        <input
          name="healthId"
          maxLength={80}
          autoComplete="off"
          defaultValue={child?.healthId ?? ""}
        />
      </label>
      {child && (
        <p>
          Si cambias el nacimiento, revisa las fechas de vacunas. Se conservan las citas y
          aplicaciones ya guardadas.
        </p>
      )}
    </LocalForm>
  );
}
