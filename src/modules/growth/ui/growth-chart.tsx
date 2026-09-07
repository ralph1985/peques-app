"use client";

import { useState } from "react";
import type { GrowthMeasurement } from "../domain/growth-measurement";
import {
  buildGrowthChartPath,
  buildGrowthChartSeries,
  type GrowthChartRange,
} from "../application/growth-chart-series";
import type { GrowthIndicator } from "../application/who-growth";
import type { WeightEntry } from "@/modules/weight/domain/weight-entry";
import styles from "@/app/(app)/peso/page.module.css";

const labels: Record<GrowthIndicator, string> = {
  weightForAge: "Peso para la edad",
  statureForAge: "Longitud / estatura para la edad",
  bmiForAge: "IMC para la edad",
  headCircumferenceForAge: "Perímetro cefálico para la edad",
  weightForLength: "Peso para la longitud",
  weightForHeight: "Peso para la estatura",
};

export function GrowthChart({
  indicator,
  birthDate,
  sex,
  weights,
  measurements,
}: {
  indicator: Exclude<GrowthIndicator, "weightForAge">;
  birthDate: string;
  sex: "female" | "male" | "unspecified" | undefined;
  weights: WeightEntry[];
  measurements: GrowthMeasurement[];
}) {
  const [range, setRange] = useState<GrowthChartRange>("current");
  const series = buildGrowthChartSeries(indicator, birthDate, sex, weights, measurements, range);
  if (!series.points.length) {
    return <p className={styles.empty}>Registra los datos necesarios para mostrar esta gráfica.</p>;
  }
  const whoSexLabel = sex === "female" ? "niñas" : sex === "male" ? "niños" : null;
  return (
    <div className={styles.chart}>
      <div className={styles.chartHeader}>
        <p>
          {whoSexLabel
            ? `Referencia OMS para ${whoSexLabel}. No sustituye una revisión médica.`
            : "Se muestran tus registros. Selecciona el sexo para añadir referencias OMS."}
        </p>
        <GrowthRangeToggle
          range={range}
          maxYears={
            indicator === "headCircumferenceForAge" ||
            indicator === "weightForLength" ||
            indicator === "weightForHeight"
              ? 5
              : 19
          }
          onRangeChange={setRange}
        />
      </div>
      <div className={styles.chartCanvas} aria-label={labels[indicator]}>
        <svg viewBox={`0 0 ${series.width} ${series.height}`} role="img">
          <title>{labels[indicator]}</title>
          <desc>
            Registros y referencias OMS de {labels[indicator].toLocaleLowerCase()}
            {whoSexLabel ? ` para ${whoSexLabel}.` : "."}
          </desc>
          {series.curves.map((curve) => (
            <g className={styles.chartReferenceGroup} key={curve.label}>
              <path
                className={`${styles.chartReferenceCurve} ${curve.label === "P50" ? styles.chartReferenceCurveMedian : ""}`}
                d={buildGrowthChartPath(curve.points)}
              />
              {curve.points.at(-1) && (
                <text
                  className={styles.chartReferenceLabel}
                  x={curve.points.at(-1)!.x}
                  y={curve.points.at(-1)!.y - 3}
                  textAnchor="end"
                >
                  {curve.label}
                </text>
              )}
            </g>
          ))}
          {series.points.length > 1 && (
            <path className={styles.chartLine} d={buildGrowthChartPath(series.points)} />
          )}
          {series.points.map((point) => (
            <circle
              className={styles.chartLatestPoint}
              cx={point.x}
              cy={point.y}
              key={`${point.date}-${point.value}`}
              r="4"
            />
          ))}
          <text className={styles.chartDate} x="42" y={series.height - 6}>
            {series.xUnit === "age"
              ? "Nacimiento"
              : series.xUnit === "length"
                ? "Medida"
                : "Medida"}
          </text>
        </svg>
      </div>
      <div className={styles.chartLegend}>
        <span>{labels[indicator]}</span>
        {whoSexLabel && <span>Referencia OMS para {whoSexLabel}: P3 P15 P50 P85 P97</span>}
      </div>
      <p className={styles.chartHint}>
        La tendencia de varias mediciones es más útil que un percentil aislado. Coméntala en la
        revisión de salud.
      </p>
      <div className={styles.chartMeta}>
        <span>
          Mínimo <strong>{formatValue(series.min, series.unit)}</strong>
        </span>
        <span className={styles.chartMetaPrimary}>
          Último <strong>{formatValue(series.points.at(-1)?.value ?? 0, series.unit)}</strong>
        </span>
        <span>
          Máximo <strong>{formatValue(series.max, series.unit)}</strong>
        </span>
      </div>
    </div>
  );
}

function GrowthRangeToggle({
  range,
  maxYears,
  onRangeChange,
}: {
  range: GrowthChartRange;
  maxYears: 5 | 10 | 19;
  onRangeChange: (range: GrowthChartRange) => void;
}) {
  const values: Array<[GrowthChartRange, string, number]> = [
    ["current", "Actual", 0],
    ["twoYears", "2 años", 2],
    ["fourYears", "4 años", 4],
    ["tenYears", "10 años", 10],
    ["nineteenYears", "19 años", 19],
  ];
  return (
    <div className={styles.chartRangeToggle} aria-label="Rango de edad de la gráfica">
      {values
        .filter(([, , years]) => years === 0 || years <= maxYears)
        .map(([value, label]) => (
          <button
            aria-pressed={range === value}
            className={range === value ? styles.chartRangeButtonActive : styles.chartRangeButton}
            key={value}
            onClick={() => onRangeChange(value)}
            type="button"
          >
            {label}
          </button>
        ))}
    </div>
  );
}

function formatValue(value: number, unit: string) {
  return `${value.toLocaleString("es-ES", { maximumFractionDigits: unit === "kg/m²" ? 1 : 1 })} ${unit}`;
}
