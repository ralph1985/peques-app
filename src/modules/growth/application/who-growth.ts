import {
  whoGrowthTables,
  type WhoGrowthTable,
  type WhoPercentile,
} from "@/modules/weight/application/who-growth-data";

export type GrowthIndicator =
  | "weightForAge"
  | "statureForAge"
  | "bmiForAge"
  | "headCircumferenceForAge"
  | "weightForLength"
  | "weightForHeight";

export type GrowthSex = "female" | "male" | "unspecified" | undefined;
export type GrowthReferencePoint = {
  axis: number;
  percentile: WhoPercentile;
  value: number;
};

const tableMap = whoGrowthTables as unknown as Record<string, WhoGrowthTable>;
const MONTH_DAYS = 365.25 / 12;
const YEAR_DAYS = 365.25;

const ageTableNames: Record<
  Extract<GrowthIndicator, "weightForAge" | "statureForAge" | "bmiForAge">,
  string
> = {
  weightForAge: "wfa",
  statureForAge: "lhfa",
  bmiForAge: "bmi",
};

export function whoReferenceAvailable(indicator: GrowthIndicator, sex: GrowthSex, ageDays: number) {
  if (sex !== "female" && sex !== "male") return false;
  if (indicator === "headCircumferenceForAge") return ageDays <= 5 * YEAR_DAYS;
  if (indicator === "weightForLength" || indicator === "weightForHeight") {
    return ageDays <= 5 * YEAR_DAYS;
  }
  if (indicator === "weightForAge") return ageDays <= 10 * YEAR_DAYS;
  return ageDays <= 19 * YEAR_DAYS;
}

export function whoAgeReferenceValue(
  indicator: Extract<
    GrowthIndicator,
    "weightForAge" | "statureForAge" | "bmiForAge" | "headCircumferenceForAge"
  >,
  sex: Exclude<GrowthSex, undefined | "unspecified">,
  ageDays: number,
  percentile: WhoPercentile,
): number | null {
  if (!whoReferenceAvailable(indicator, sex, ageDays)) return null;
  const prefix = ageTableNames[indicator as keyof typeof ageTableNames] ?? "hcfa";
  const base = `${prefix}${sex === "female" ? "Girls" : "Boys"}`;
  const tableNames = [`${base}05`];
  if (indicator !== "headCircumferenceForAge") {
    tableNames.push(`${base}${indicator === "weightForAge" ? "510" : "519"}`);
  }
  const monthAge = ageDays / MONTH_DAYS;
  const tableName = monthAge <= 60 ? tableNames[0] : tableNames[1];
  const table = tableName ? tableMap[tableName] : undefined;
  if (!table) return null;
  const axis = table.axisUnit === "days" ? ageDays : monthAge;
  return interpolateTable(table, axis, percentile);
}

export function buildWhoAgeReferenceCurves(
  indicator: Extract<
    GrowthIndicator,
    "weightForAge" | "statureForAge" | "bmiForAge" | "headCircumferenceForAge"
  >,
  sex: GrowthSex,
  maxAgeDays: number,
): Array<{ label: WhoPercentile; points: GrowthReferencePoint[] }> {
  if (sex !== "female" && sex !== "male") return [];
  const cappedMax = Math.min(
    Math.max(0, maxAgeDays),
    indicator === "weightForAge"
      ? 10 * YEAR_DAYS
      : indicator === "headCircumferenceForAge"
        ? 5 * YEAR_DAYS
        : 19 * YEAR_DAYS,
  );
  const ages = new Set<number>([0, Math.round(cappedMax)]);
  const step = cappedMax <= 90 ? 7 : MONTH_DAYS;
  for (let age = step; age < cappedMax; age += step) ages.add(Math.round(age));
  return ["P3", "P15", "P50", "P85", "P97"].map((percentile) => ({
    label: percentile as WhoPercentile,
    points: [...ages]
      .sort((a, b) => a - b)
      .map((ageDays) => ({
        axis: ageDays,
        percentile: percentile as WhoPercentile,
        value: whoAgeReferenceValue(indicator, sex, ageDays, percentile as WhoPercentile) ?? 0,
      })),
  }));
}

export function buildWhoDimensionReferenceCurves(
  indicator: "weightForLength" | "weightForHeight",
  sex: GrowthSex,
): Array<{ label: WhoPercentile; points: GrowthReferencePoint[] }> {
  if (sex !== "female" && sex !== "male") return [];
  const prefix = indicator === "weightForLength" ? "wfl" : "wfh";
  const suffix = indicator === "weightForLength" ? "02" : "25";
  const table = tableMap[`${prefix}${sex === "female" ? "Girls" : "Boys"}${suffix}`];
  if (!table) return [];
  return ["P3", "P15", "P50", "P85", "P97"].map((percentile) => ({
    label: percentile as WhoPercentile,
    points: table.axis.map((axis, index) => ({
      axis: axis * 10,
      percentile: percentile as WhoPercentile,
      value: table.values[percentile as WhoPercentile][index],
    })),
  }));
}

export function whoTableValue(
  table: WhoGrowthTable,
  axis: number,
  percentile: WhoPercentile,
): number {
  return interpolateTable(table, axis, percentile) ?? 0;
}

function interpolateTable(
  table: WhoGrowthTable,
  axis: number,
  percentile: WhoPercentile,
): number | null {
  const min = table.axis[0];
  const max = table.axis.at(-1);
  if (min === undefined || max === undefined || axis < min || axis > max) return null;
  let upper = table.axis.findIndex((value) => value >= axis);
  if (upper < 0) upper = table.axis.length - 1;
  const lower = Math.max(0, upper - 1);
  const lowerAxis = table.axis[lower];
  const upperAxis = table.axis[upper];
  const lowerValue = table.values[percentile][lower];
  const upperValue = table.values[percentile][upper];
  if (
    lowerAxis === undefined ||
    upperAxis === undefined ||
    lowerValue === undefined ||
    upperValue === undefined
  )
    return null;
  if (lowerAxis === upperAxis) return lowerValue;
  return lowerValue + ((upperValue - lowerValue) * (axis - lowerAxis)) / (upperAxis - lowerAxis);
}
