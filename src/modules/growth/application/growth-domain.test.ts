import { describe, expect, it } from "vitest";
import { createGrowthMeasurement } from "../domain/growth-measurement";
import { buildGrowthChartSeries } from "./growth-chart-series";
import { whoAgeReferenceValue, whoReferenceAvailable } from "./who-growth";
import type { WeightEntry } from "@/modules/weight/domain/weight-entry";

const childId = crypto.randomUUID();
const weight = (date: string, grams: number): WeightEntry => ({
  id: crypto.randomUUID(),
  childId,
  measuredOn: date,
  weightGrams: grams,
  place: "pediatra",
});

describe("growth measurements and WHO references", () => {
  it("validates and normalizes centimetre measurements", () => {
    expect(
      createGrowthMeasurement({
        measuredOn: "2024-01-01",
        kind: "stature",
        valueMillimeters: 512,
        notes: "  Casa ",
      }),
    ).toEqual({
      measuredOn: "2024-01-01",
      kind: "stature",
      valueMillimeters: 512,
      notes: "Casa",
    });
    expect(() =>
      createGrowthMeasurement({
        measuredOn: "2024-01-01",
        kind: "stature",
        valueMillimeters: 2201,
      }),
    ).toThrow();
    expect(() =>
      createGrowthMeasurement({
        measuredOn: "2024-01-01",
        kind: "headCircumference",
        valueMillimeters: 199,
      }),
    ).toThrow();
  });

  it("provides sex-specific official references and respects age limits", () => {
    expect(whoAgeReferenceValue("weightForAge", "female", 0, "P50")).toBeCloseTo(3.232, 3);
    expect(whoAgeReferenceValue("weightForAge", "male", 0, "P50")).toBeCloseTo(3.3464, 3);
    expect(whoReferenceAvailable("weightForAge", "male", 11 * 365.25)).toBe(false);
    expect(whoReferenceAvailable("bmiForAge", "male", 19 * 365.25)).toBe(true);
    expect(whoReferenceAvailable("headCircumferenceForAge", "male", 6 * 365.25)).toBe(false);
    expect(whoReferenceAvailable("weightForAge", "unspecified", 30)).toBe(false);
  });

  it("derives BMI and weight-for-length only from same-day measurements", () => {
    const measurements = [
      {
        id: crypto.randomUUID(),
        childId,
        measuredOn: "2024-01-01",
        kind: "stature" as const,
        valueMillimeters: 500,
      },
      {
        id: crypto.randomUUID(),
        childId,
        measuredOn: "2024-01-02",
        kind: "stature" as const,
        valueMillimeters: 510,
      },
    ];
    const chart = buildGrowthChartSeries(
      "bmiForAge",
      "2024-01-01",
      "male",
      [weight("2024-01-01", 5000)],
      measurements,
      "current",
    );
    expect(chart.points).toHaveLength(1);
    expect(chart.points[0].value).toBeCloseTo(20, 5);
    expect(
      buildGrowthChartSeries(
        "weightForLength",
        "2024-01-01",
        "male",
        [weight("2024-01-01", 5000)],
        measurements,
        "current",
      ).points,
    ).toHaveLength(1);
  });
});
