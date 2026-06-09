import { useMemo, useState } from "react";
import { abs, realAtPhase } from "../complex";
import { fieldPhasorsAt, type WaveSolution } from "../physics";
import type { DisplayOptions } from "../types";

interface FieldChartProps {
  solution: WaveSolution;
  display: DisplayOptions;
  phase: number;
}

interface Sample {
  z: number;
  incident: number;
  reflected: number;
  transmitted: number;
  total: number;
  envelope: number;
}

const WIDTH = 1000;
const HEIGHT = 480;
const MARGIN = { top: 42, right: 26, bottom: 58, left: 82 };

const FIELD_UNITS = {
  E: { symbol: "E", unit: "V/m" },
  H: { symbol: "H", unit: "A/m" },
  D: { symbol: "D", unit: "C/m²" },
  B: { symbol: "B", unit: "T" },
} as const;

const SERIES = [
  { key: "incident", label: "padająca", color: "#0ea5e9" },
  { key: "reflected", label: "odbita", color: "#f97316" },
  { key: "transmitted", label: "transmitowana", color: "#22c55e" },
  { key: "total", label: "całkowite", color: "#7c3aed" },
] as const;

function engineeringScale(maxValue: number, unit: string) {
  const prefixes = [
    { exponent: 9, prefix: "G" },
    { exponent: 6, prefix: "M" },
    { exponent: 3, prefix: "k" },
    { exponent: 0, prefix: "" },
    { exponent: -3, prefix: "m" },
    { exponent: -6, prefix: "µ" },
    { exponent: -9, prefix: "n" },
    { exponent: -12, prefix: "p" },
  ];
  const exponent =
    maxValue > 0 ? Math.floor(Math.log10(maxValue) / 3) * 3 : 0;
  const selected =
    prefixes.find((item) => item.exponent === exponent) ??
    (exponent > 9 ? prefixes[0] : prefixes[prefixes.length - 1]);
  return {
    factor: 10 ** selected.exponent,
    label: `${selected.prefix}${unit}`,
  };
}

function pathFrom(
  samples: Sample[],
  key: keyof Omit<Sample, "z" | "envelope">,
  x: (z: number) => number,
  y: (value: number) => number,
) {
  return samples
    .map(
      (sample, index) =>
        `${index === 0 ? "M" : "L"} ${x(sample.z).toFixed(2)} ${y(
          sample[key],
        ).toFixed(2)}`,
    )
    .join(" ");
}

export function FieldChart({
  solution,
  display,
  phase,
}: FieldChartProps) {
  const [cursor, setCursor] = useState<Sample | null>(null);
  const { samples, zMin, zMax } = useMemo(() => {
    const [m1, , m3] = solution.media;
    const leftSpan = 1.25 * m1.wavelength;
    const rightSpan = 1.25 * m3.wavelength;
    const minimum = -leftSpan;
    const maximum = solution.thickness + rightSpan;
    const count = 720;
    const values: Sample[] = [];

    for (let index = 0; index <= count; index += 1) {
      const z = minimum + ((maximum - minimum) * index) / count;
      const phasors = fieldPhasorsAt(solution, z, display.field);
      values.push({
        z,
        incident: realAtPhase(phasors.incident, phase),
        reflected: realAtPhase(phasors.reflected, phase),
        transmitted: realAtPhase(phasors.transmitted, phase),
        total: realAtPhase(phasors.total, phase),
        envelope: abs(phasors.total),
      });
    }

    return { samples: values, zMin: minimum, zMax: maximum };
  }, [display.field, phase, solution]);

  const activeKeys = SERIES.filter((series) => display[series.key]).map(
    (series) => series.key,
  );
  const values = samples.flatMap((sample) => [
    ...activeKeys.map((key) => Math.abs(sample[key])),
    ...(display.envelope ? [sample.envelope] : []),
  ]);
  const maxValue = Math.max(...values, 1e-30);
  const yLimit = maxValue * 1.12;
  const unit = engineeringScale(maxValue, FIELD_UNITS[display.field].unit);
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = (z: number) =>
    MARGIN.left + ((z - zMin) / (zMax - zMin)) * plotWidth;
  const y = (value: number) =>
    MARGIN.top + ((yLimit - value) / (2 * yLimit)) * plotHeight;

  const updateCursor = (clientX: number, target: SVGSVGElement) => {
    const bounds = target.getBoundingClientRect();
    const svgX = ((clientX - bounds.left) / bounds.width) * WIDTH;
    const normalized = Math.min(
      1,
      Math.max(0, (svgX - MARGIN.left) / plotWidth),
    );
    const index = Math.round(normalized * (samples.length - 1));
    setCursor(samples[index]);
  };

  const yTicks = [-1, -0.5, 0, 0.5, 1];
  const xTicks = Array.from({ length: 7 }, (_, index) => index / 6);

  return (
    <section className="panel chart-panel">
      <div className="chart-header">
        <div>
          <p className="eyebrow">Rozkład chwilowy</p>
          <h2>
            Pole {FIELD_UNITS[display.field].symbol}(z, t)
          </h2>
        </div>
        <div className="legend">
          {SERIES.filter((series) => display[series.key]).map((series) => (
            <span key={series.key}>
              <i style={{ backgroundColor: series.color }} />
              {series.label}
            </span>
          ))}
          {display.envelope && (
            <span>
              <i className="envelope-key" />
              obwiednia
            </span>
          )}
        </div>
      </div>

      <div className="chart-wrap">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Wykres pola ${display.field} wzdłuż osi z`}
          onMouseMove={(event) => updateCursor(event.clientX, event.currentTarget)}
          onMouseLeave={() => setCursor(null)}
        >
          <defs>
            <clipPath id="plot-area">
              <rect
                x={MARGIN.left}
                y={MARGIN.top}
                width={plotWidth}
                height={plotHeight}
              />
            </clipPath>
          </defs>

          <g clipPath="url(#plot-area)">
            <rect
              x={x(zMin)}
              y={MARGIN.top}
              width={x(0) - x(zMin)}
              height={plotHeight}
              fill="#e0f2fe"
            />
            <rect
              x={x(0)}
              y={MARGIN.top}
              width={Math.max(1, x(solution.thickness) - x(0))}
              height={plotHeight}
              fill="#fef3c7"
            />
            <rect
              x={x(solution.thickness)}
              y={MARGIN.top}
              width={x(zMax) - x(solution.thickness)}
              height={plotHeight}
              fill="#dcfce7"
            />

            {yTicks.map((tick) => (
              <line
                key={tick}
                x1={MARGIN.left}
                x2={WIDTH - MARGIN.right}
                y1={y(tick * yLimit)}
                y2={y(tick * yLimit)}
                className={tick === 0 ? "axis-line" : "grid-line"}
              />
            ))}
            {xTicks.map((tick) => (
              <line
                key={tick}
                x1={MARGIN.left + tick * plotWidth}
                x2={MARGIN.left + tick * plotWidth}
                y1={MARGIN.top}
                y2={HEIGHT - MARGIN.bottom}
                className="grid-line"
              />
            ))}

            {display.envelope && (
              <>
                <path
                  d={samples
                    .map(
                      (sample, index) =>
                        `${index === 0 ? "M" : "L"} ${x(sample.z).toFixed(
                          2,
                        )} ${y(sample.envelope).toFixed(2)}`,
                    )
                    .join(" ")}
                  className="envelope-line"
                />
                <path
                  d={samples
                    .map(
                      (sample, index) =>
                        `${index === 0 ? "M" : "L"} ${x(sample.z).toFixed(
                          2,
                        )} ${y(-sample.envelope).toFixed(2)}`,
                    )
                    .join(" ")}
                  className="envelope-line"
                />
              </>
            )}

            {SERIES.filter((series) => display[series.key]).map((series) => (
              <path
                key={series.key}
                d={pathFrom(samples, series.key, x, y)}
                fill="none"
                stroke={series.color}
                strokeWidth={series.key === "total" ? 3.2 : 2}
                opacity={series.key === "total" ? 1 : 0.86}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <line
              x1={x(0)}
              x2={x(0)}
              y1={MARGIN.top}
              y2={HEIGHT - MARGIN.bottom}
              className="boundary-line"
            />
            <line
              x1={x(solution.thickness)}
              x2={x(solution.thickness)}
              y1={MARGIN.top}
              y2={HEIGHT - MARGIN.bottom}
              className="boundary-line"
            />

            {cursor && (
              <line
                x1={x(cursor.z)}
                x2={x(cursor.z)}
                y1={MARGIN.top}
                y2={HEIGHT - MARGIN.bottom}
                className="cursor-line"
              />
            )}
          </g>

          <text x={(x(zMin) + x(0)) / 2} y="27" className="region-label">
            ośrodek 1
          </text>
          <text
            x={(x(0) + x(solution.thickness)) / 2}
            y="27"
            className="region-label"
          >
            warstwa 2
          </text>
          <text
            x={(x(solution.thickness) + x(zMax)) / 2}
            y="27"
            className="region-label"
          >
            ośrodek 3
          </text>

          {yTicks.map((tick) => (
            <text
              key={tick}
              x={MARGIN.left - 12}
              y={y(tick * yLimit) + 5}
              textAnchor="end"
              className="tick-label"
            >
              {(tick * yLimit / unit.factor).toPrecision(3)}
            </text>
          ))}
          {xTicks.map((tick) => {
            const z = zMin + tick * (zMax - zMin);
            return (
              <text
                key={tick}
                x={MARGIN.left + tick * plotWidth}
                y={HEIGHT - MARGIN.bottom + 24}
                textAnchor="middle"
                className="tick-label"
              >
                {(z * 1000).toFixed(1)}
              </text>
            );
          })}

          <text
            x={MARGIN.left + plotWidth / 2}
            y={HEIGHT - 12}
            textAnchor="middle"
            className="axis-label"
          >
            położenie z [mm]
          </text>
          <text
            x="18"
            y={MARGIN.top + plotHeight / 2}
            textAnchor="middle"
            className="axis-label"
            transform={`rotate(-90 18 ${MARGIN.top + plotHeight / 2})`}
          >
            {display.field} [{unit.label}]
          </text>
        </svg>

        {cursor && (
          <div className="cursor-card">
            <strong>z = {(cursor.z * 1000).toFixed(2)} mm</strong>
            <span>
              pole całkowite: {(cursor.total / unit.factor).toPrecision(4)}{" "}
              {unit.label}
            </span>
            <span>
              amplituda: {(cursor.envelope / unit.factor).toPrecision(4)}{" "}
              {unit.label}
            </span>
          </div>
        )}
      </div>
      <p className="chart-note">
        W warstwie 2 „transmitowana” oznacza falę biegnącą w +z, a „odbita”
        falę wracającą w −z. Pole całkowite jest ich fizyczną sumą zespoloną.
      </p>
    </section>
  );
}
