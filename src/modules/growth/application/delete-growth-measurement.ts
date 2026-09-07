import type { GrowthMeasurementRepository } from "./growth-measurement-repository";

export function deleteGrowthMeasurement(repository: GrowthMeasurementRepository, id: string) {
  return repository.deleteGrowthMeasurement(id);
}
