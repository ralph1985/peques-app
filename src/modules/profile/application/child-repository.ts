import type { Child, ChildInput } from "../domain/child";

export type ChildDataCounts = {
  weights: number;
  growthMeasurements: number;
  plannedVaccines: number;
  appliedVaccines: number;
  sleep: number;
};
export interface ChildRepository {
  list(): Promise<Child[]>;
  create(input: ChildInput): Promise<Child>;
  update(id: string, input: ChildInput): Promise<Child>;
  select(id: string): Promise<void>;
  active(): Promise<Child | null>;
  counts(id: string): Promise<ChildDataCounts>;
  delete(id: string, confirmedName: string): Promise<void>;
}
