import { createGrowthMeasurement, type NewGrowthMeasurement } from "../domain/growth-measurement";
import type { GrowthMeasurementRepository } from "./growth-measurement-repository";

export function updateGrowthMeasurement(
  repository: GrowthMeasurementRepository,
  id: string,
  input: NewGrowthMeasurement,
) {
  return repository.updateGrowthMeasurement(id, createGrowthMeasurement(input));
}
