import {
  buildWhoAgeReferenceCurves,
  whoAgeReferenceValue,
  type GrowthSex,
} from "@/modules/growth/application/who-growth";
import type { WhoPercentile } from "./who-growth-data";

export type WeightPercentile = WhoPercentile;
export type WeightForAgeReferencePoint = {
  ageDays: number;
  percentile: WeightPercentile;
  weightGrams: number;
};

export const weightPercentiles: WeightPercentile[] = ["P3", "P15", "P50", "P85", "P97"];

export function calculateAgeInDaysFromBirth(birthDate: string, measuredOn: string): number {
  const birthTime = parseUtcDate(birthDate).getTime();
  const measuredTime = parseUtcDate(measuredOn).getTime();
  return Math.max(0, Math.floor((measuredTime - birthTime) / 86_400_000));
}

export function calculateWhoWeightForAgeGrams(
  ageDays: number,
  percentile: WeightPercentile,
  sex: Exclude<GrowthSex, undefined | "unspecified"> = "female",
): number {
  return Math.round(whoAgeReferenceValue("weightForAge", sex, ageDays, percentile)! * 1000);
}

export function buildWhoWeightForAgeReferences(
  maxAgeDays: number,
  sex?: GrowthSex,
): WeightForAgeReferencePoint[] {
  return buildWhoAgeReferenceCurves("weightForAge", sex, maxAgeDays).flatMap((curve) =>
    curve.points.map((point) => ({
      ageDays: point.axis,
      percentile: point.percentile,
      weightGrams: Math.round(point.value * 1000),
    })),
  );
}

function parseUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
