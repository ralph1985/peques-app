import { createGrowthMeasurement, type NewGrowthMeasurement } from "../domain/growth-measurement";
import type { GrowthMeasurementRepository } from "./growth-measurement-repository";

export function registerGrowthMeasurement(
  repository: GrowthMeasurementRepository,
  input: NewGrowthMeasurement,
) {
  return repository.createGrowthMeasurement(createGrowthMeasurement(input));
}
