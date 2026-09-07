import type { GrowthMeasurement, NewGrowthMeasurement } from "../domain/growth-measurement";

export interface GrowthMeasurementRepository {
  listGrowthMeasurements(): Promise<GrowthMeasurement[]>;
  createGrowthMeasurement(input: NewGrowthMeasurement): Promise<GrowthMeasurement>;
  updateGrowthMeasurement(id: string, input: NewGrowthMeasurement): Promise<GrowthMeasurement>;
  deleteGrowthMeasurement(id: string): Promise<void>;
}
