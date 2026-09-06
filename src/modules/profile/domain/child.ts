import { assert, isDate, localDate, optionalText, text } from "@/shared/domain/validation";

export type Child = {
  id: string;
  name: string;
  birthDate: string;
  birthTime?: string;
  sex?: "female" | "male" | "unspecified";
  healthId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ChildInput = Omit<Child, "id" | "createdAt" | "updatedAt">;

export function validateChild(input: ChildInput): ChildInput {
  const name = text(input.name, "Nombre", 80);
  assert(
    isDate(input.birthDate) && input.birthDate <= localDate(),
    "La fecha de nacimiento no es válida o está en el futuro.",
  );
  assert(
    !input.birthTime || /^([01]\d|2[0-3]):[0-5]\d$/.test(input.birthTime),
    "La hora de nacimiento no es válida.",
  );
  assert(
    input.sex === undefined || ["female", "male", "unspecified"].includes(input.sex),
    "El sexo no es válido.",
  );
  const healthId = optionalText(input.healthId, "Identificador sanitario", 80);
  return {
    name,
    birthDate: input.birthDate,
    ...(input.birthTime ? { birthTime: input.birthTime } : {}),
    sex: input.sex ?? "unspecified",
    ...(healthId ? { healthId } : {}),
  };
}
