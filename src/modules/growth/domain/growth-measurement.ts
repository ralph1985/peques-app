import { assert, isDate, optionalText } from "@/shared/domain/validation";

export const growthMeasurementKinds = ["stature", "headCircumference"] as const;
export type GrowthMeasurementKind = (typeof growthMeasurementKinds)[number];
export const growthMeasurementPositions = ["length", "height"] as const;
export type GrowthMeasurementPosition = (typeof growthMeasurementPositions)[number];

export type GrowthMeasurement = {
  id: string;
  childId: string;
  measuredOn: string;
  kind: GrowthMeasurementKind;
  position?: GrowthMeasurementPosition;
  valueMillimeters: number;
  notes?: string | null;
};

export type NewGrowthMeasurement = Omit<GrowthMeasurement, "id" | "childId">;

export class GrowthMeasurementValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join(" "));
    this.name = "GrowthMeasurementValidationError";
  }
}

export function createGrowthMeasurement(input: NewGrowthMeasurement): NewGrowthMeasurement {
  const issues: string[] = [];
  if (!isDate(input.measuredOn)) issues.push("La fecha de la medida no es válida.");
  if (!growthMeasurementKinds.includes(input.kind)) issues.push("El tipo de medida no es válido.");
  if (
    input.kind === "stature" &&
    input.position !== undefined &&
    !growthMeasurementPositions.includes(input.position)
  ) {
    issues.push("La forma de medir la estatura no es válida.");
  }
  const limits = input.kind === "stature" ? [300, 2200] : [200, 800];
  if (
    !Number.isInteger(input.valueMillimeters) ||
    input.valueMillimeters < limits[0] ||
    input.valueMillimeters > limits[1]
  ) {
    issues.push(
      input.kind === "stature"
        ? "La longitud o estatura debe estar entre 30 y 220 cm."
        : "El perímetro cefálico debe estar entre 20 y 80 cm.",
    );
  }
  if (issues.length) throw new GrowthMeasurementValidationError(issues);
  assert(growthMeasurementKinds.includes(input.kind), "El tipo de medida no es válido.");
  return {
    measuredOn: input.measuredOn,
    kind: input.kind,
    ...(input.position ? { position: input.position } : {}),
    valueMillimeters: input.valueMillimeters,
    notes: optionalText(input.notes, "Notas"),
  };
}
