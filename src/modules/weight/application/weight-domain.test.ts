import { describe, expect, it } from "vitest";
import { createWeightEntry, type WeightEntry } from "../domain/weight-entry";
import { buildWeightHistory } from "./weight-history";
import { buildWeightDailyEstimates } from "./weight-daily-estimation";
import { buildWeightTrendSummary } from "./weight-trend-summary";
import { filterWeightEntries } from "./weight-filter";
import {
  buildWeightChartSeries,
  buildWeightChartPath,
  buildWeightChartAreaPath,
} from "./weight-chart-series";
import {
  buildWhoWeightForAgeReferences,
  calculateWhoWeightForAgeGrams,
} from "./who-weight-for-age";

const childId = crypto.randomUUID();
const entry = (
  measuredOn: string,
  weightGrams: number,
  place: WeightEntry["place"] = "pediatra",
): WeightEntry => ({ id: crypto.randomUUID(), childId, measuredOn, weightGrams, place });

describe("retained weight domain", () => {
  it.each([NaN, Infinity, 999, 20001, 6000.5])("rejects invalid grams %s", (weightGrams) => {
    expect(() => createWeightEntry(entry("2024-04-01", weightGrams))).toThrow();
  });
  it.each(["2023-02-29", "2024-04-31", "2024-13-01", "", "01/04/2024"])(
    "rejects impossible dates %s",
    (date) => {
      expect(() => createWeightEntry(entry(date, 6000))).toThrow();
    },
  );
  it("normalizes notes and accepts the original weight boundaries", () => {
    expect(
      createWeightEntry({ ...entry("2024-02-29", 1000), notes: "  Nota ficticia  " }).notes,
    ).toBe("Nota ficticia");
    expect(createWeightEntry(entry("2024-03-01", 20000)).weightGrams).toBe(20000);
  });
  it("preserves chronology, signed differences and daily averages without mutating entries", () => {
    const entries = [
      entry("2024-04-04", 6150),
      entry("2024-04-01", 6000),
      entry("2024-04-06", 6130),
    ];
    const before = structuredClone(entries);
    const history = buildWeightHistory(entries);
    expect(history.map((row) => row.differenceGrams)).toEqual([-20, 150, null]);
    expect(history.map((row) => row.averageGramsPerDay)).toEqual([-10, 50, null]);
    expect(buildWeightDailyEstimates(entries).map((row) => row.gramsPerDay)).toEqual([50, -10]);
    expect(buildWeightTrendSummary(entries, new Date("2024-04-08T12:00:00Z"))).toMatchObject({
      differenceGrams: -20,
      averageGramsPerDay: -10,
      daysSinceLatest: 2,
      totalEntries: 3,
    });
    expect(entries).toEqual(before);
  });
  it("does not divide by zero for two measurements on the same day", () => {
    const entries = [entry("2024-04-01", 6000), entry("2024-04-01", 6100)];
    expect(buildWeightHistory(entries)[0].averageGramsPerDay).toBeNull();
    expect(buildWeightDailyEstimates(entries)).toEqual([]);
  });
  it("filters by place and returns empty history and chart safely", () => {
    const entries = [entry("2024-04-01", 6000, "hospital"), entry("2024-04-02", 6050, "farmacia")];
    expect(filterWeightEntries(entries, "hospital")).toEqual([entries[0]]);
    expect(buildWeightHistory([])).toEqual([]);
    expect(buildWeightChartSeries([], "2024-01-01").points).toEqual([]);
    expect(buildWeightChartPath([])).toBe("");
    expect(buildWeightChartAreaPath([])).toBe("");
  });
  it.each(["unspecified", undefined] as const)(
    "does not apply sex-specific references for sex %s",
    (sex) => {
      const chart = buildWeightChartSeries(
        [entry("2024-04-01", 6000)],
        "2024-01-01",
        "current",
        sex,
      );
      expect(chart.points).toHaveLength(1);
      expect(chart.referenceCurves).toEqual([]);
      expect(buildWhoWeightForAgeReferences(90, sex)).toEqual([]);
      expect(Number.isFinite(chart.points[0].x) && Number.isFinite(chart.points[0].y)).toBe(true);
    },
  );
  it("uses the official female and male reference data and daily interpolation", () => {
    expect(calculateWhoWeightForAgeGrams(0, "P50")).toBe(3232);
    expect(calculateWhoWeightForAgeGrams(0, "P50", "male")).toBe(3346);
    const chart = buildWeightChartSeries(
      [entry("2024-04-01", 6000), entry("2024-04-04", 6150)],
      "2024-01-01",
      "current",
      "female",
    );
    expect(chart.referenceCurves).toHaveLength(5);
    expect(chart.estimatePoints.map((point) => point.weightGrams)).toEqual([6050, 6100, 6150]);
    expect(buildWeightChartPath(chart.points)).toMatch(/^M .+ L /);
    expect(buildWeightChartAreaPath(chart.points)).toMatch(/Z$/);
  });
  it("applies the official male reference curves", () => {
    expect(
      buildWeightChartSeries([entry("2024-04-01", 6000)], "2024-01-01", "current", "male")
        .referenceCurves,
    ).toHaveLength(5);
  });
});
