import type { GrowthMeasurement } from "../domain/growth-measurement";
import type { WeightEntry } from "@/modules/weight/domain/weight-entry";
import {
  buildWhoAgeReferenceCurves,
  buildWhoDimensionReferenceCurves,
  type GrowthIndicator,
  type GrowthSex,
} from "./who-growth";
import { calculateAgeInDaysFromBirth } from "@/modules/weight/application/who-weight-for-age";

export type GrowthChartRange = "current" | "twoYears" | "fourYears" | "tenYears" | "nineteenYears";
export type GrowthChartPoint = {
  date: string;
  label: string;
  value: number;
  x: number;
  y: number;
};
export type GrowthChartCurve = { label: string; points: Array<{ x: number; y: number }> };
export type GrowthChartSeries = {
  width: number;
  height: number;
  min: number;
  max: number;
  points: GrowthChartPoint[];
  curves: GrowthChartCurve[];
  unit: string;
  xUnit: "age" | "length" | "height";
};

const WIDTH = 320;
const HEIGHT = 360;
const PADDING = { bottom: 34, left: 42, right: 16, top: 24 };
const YEAR = 365.25;

export function buildGrowthChartSeries(
  indicator: GrowthIndicator,
  birthDate: string,
  sex: GrowthSex,
  weights: WeightEntry[],
  measurements: GrowthMeasurement[],
  range: GrowthChartRange,
): GrowthChartSeries {
  const rawPoints = buildRawPoints(indicator, birthDate, weights, measurements);
  if (!rawPoints.length) return emptySeries(indicator);
  const latestAge = Math.max(1, ...rawPoints.map((point) => point.ageDays ?? 0));
  const maxAge = rangeMaxAge(range, latestAge, indicator);
  const xMax =
    indicator === "weightForLength" ? 1100 : indicator === "weightForHeight" ? 1300 : maxAge;
  const values = rawPoints.map((point) => point.value);
  const referenceCurves =
    indicator === "weightForLength" || indicator === "weightForHeight"
      ? buildWhoDimensionReferenceCurves(indicator, sex).map((curve) => ({
          label: curve.label,
          points: curve.points.map((point) => ({
            x: getX(point.axis, xMax),
            y: 0,
            value: point.value,
          })),
        }))
      : buildWhoAgeReferenceCurves(indicator, sex, maxAge).map((curve) => ({
          label: curve.label,
          points: curve.points.map((point) => ({
            x: getX(point.axis, maxAge),
            y: 0,
            value: point.value,
          })),
        }));
  const referenceValues = referenceCurves.flatMap((curve) =>
    curve.points.map((point) => point.value),
  );
  const bounds = displayRange(
    Math.min(...values, ...referenceValues),
    Math.max(...values, ...referenceValues),
  );
  return {
    width: WIDTH,
    height: HEIGHT,
    min: Math.min(...values),
    max: Math.max(...values),
    points: rawPoints.map((point) => ({
      date: point.date,
      label: formatDate(point.date),
      value: point.value,
      x: getX(point.x, xMax),
      y: getY(point.value, bounds.min, bounds.max),
    })),
    curves: referenceCurves.map((curve) => ({
      label: curve.label,
      points: curve.points.map((point) => ({
        x: point.x,
        y: getY(point.value, bounds.min, bounds.max),
      })),
    })),
    unit: unitFor(indicator),
    xUnit: indicator === "weightForLength" || indicator === "weightForHeight" ? "length" : "age",
  };
}

type RawPoint = { date: string; value: number; x: number; ageDays?: number };

function buildRawPoints(
  indicator: GrowthIndicator,
  birthDate: string,
  weights: WeightEntry[],
  measurements: GrowthMeasurement[],
): RawPoint[] {
  const sortedWeights = [...weights].sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));
  const sortedMeasurements = [...measurements].sort((a, b) =>
    a.measuredOn.localeCompare(b.measuredOn),
  );
  if (indicator === "weightForAge") {
    return sortedWeights.map((entry) => ({
      date: entry.measuredOn,
      value: entry.weightGrams / 1000,
      x: calculateAgeInDaysFromBirth(birthDate, entry.measuredOn),
      ageDays: calculateAgeInDaysFromBirth(birthDate, entry.measuredOn),
    }));
  }
  if (indicator === "statureForAge")
    return sortedMeasurements
      .filter((entry) => entry.kind === "stature")
      .map((entry) => agePoint(birthDate, entry.measuredOn, entry.valueMillimeters / 10));
  if (indicator === "headCircumferenceForAge")
    return sortedMeasurements
      .filter((entry) => entry.kind === "headCircumference")
      .map((entry) => agePoint(birthDate, entry.measuredOn, entry.valueMillimeters / 10));
  if (indicator === "bmiForAge")
    return sameDatePairs(sortedWeights, sortedMeasurements).map((pair) =>
      agePoint(
        birthDate,
        pair.date,
        pair.weightGrams / 1000 / (pair.statureMillimeters / 1000) ** 2,
      ),
    );
  if (indicator === "weightForLength" || indicator === "weightForHeight")
    return sameDatePairs(sortedWeights, sortedMeasurements).map((pair) => ({
      date: pair.date,
      value: pair.weightGrams / 1000,
      x: pair.statureMillimeters,
      ageDays: calculateAgeInDaysFromBirth(birthDate, pair.date),
    }));
  return [];
}

function agePoint(birthDate: string, date: string, value: number): RawPoint {
  const ageDays = calculateAgeInDaysFromBirth(birthDate, date);
  return { date, value, x: ageDays, ageDays };
}

function sameDatePairs(weights: WeightEntry[], measurements: GrowthMeasurement[]) {
  return measurements
    .filter((entry) => entry.kind === "stature")
    .flatMap((measurement) => {
      const weight = weights.find((entry) => entry.measuredOn === measurement.measuredOn);
      return weight
        ? [
            {
              date: measurement.measuredOn,
              weightGrams: weight.weightGrams,
              statureMillimeters: measurement.valueMillimeters,
            },
          ]
        : [];
    });
}

function rangeMax(range: GrowthChartRange, latestAge: number) {
  return range === "twoYears"
    ? 2 * YEAR
    : range === "fourYears"
      ? 4 * YEAR
      : range === "tenYears"
        ? 10 * YEAR
        : range === "nineteenYears"
          ? 19 * YEAR
          : latestAge;
}

function rangeMaxAge(range: GrowthChartRange, latestAge: number, indicator: GrowthIndicator) {
  const max = rangeMax(range, latestAge);
  return indicator === "headCircumferenceForAge"
    ? Math.min(max, 5 * YEAR)
    : indicator === "weightForAge"
      ? Math.min(max, 10 * YEAR)
      : Math.min(max, 19 * YEAR);
}

function displayRange(min: number, max: number) {
  const raw = Math.max(0.2, max - min);
  const margin = Math.max(0.1, raw * 0.18);
  return {
    min: Math.max(0, Math.floor((min - margin) * 10) / 10),
    max: Math.ceil((max + margin) * 10) / 10,
  };
}

function getX(value: number, max: number) {
  return PADDING.left + ((WIDTH - PADDING.left - PADDING.right) * value) / Math.max(1, max);
}
function getY(value: number, min: number, max: number) {
  return (
    HEIGHT -
    PADDING.bottom -
    ((HEIGHT - PADDING.top - PADDING.bottom) * (value - min)) / Math.max(0.01, max - min)
  );
}
function unitFor(indicator: GrowthIndicator) {
  return indicator === "weightForAge" ||
    indicator === "weightForLength" ||
    indicator === "weightForHeight"
    ? "kg"
    : indicator === "bmiForAge"
      ? "kg/m²"
      : "cm";
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function buildGrowthChartPath(points: Array<{ x: number; y: number }>) {
  return points.length < 2
    ? ""
    : points
        .map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
        .join(" ");
}

function emptySeries(indicator: GrowthIndicator): GrowthChartSeries {
  return {
    width: WIDTH,
    height: HEIGHT,
    min: 0,
    max: 0,
    points: [],
    curves: [],
    unit: unitFor(indicator),
    xUnit: indicator === "weightForLength" || indicator === "weightForHeight" ? "length" : "age",
  };
}
