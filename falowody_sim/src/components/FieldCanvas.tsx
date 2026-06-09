import { useEffect, useRef } from "react";
import { magnitude } from "../physics/complex";
import {
  fieldPhasors,
  sampleFields,
  surfaceCurrent,
} from "../physics/waveguide";
import type {
  LayerVisibility,
  Plane,
  ScalarField,
  Vector3Value,
  WaveguideParams,
  WaveguideResults,
} from "../physics/types";

interface Props {
  plane: Plane;
  params: WaveguideParams;
  results: WaveguideResults;
  layers: LayerVisibility;
  scalar: ScalarField;
  slice: { x: number; y: number; z: number };
  active?: boolean;
  onActivate?: () => void;
}

const COLORS = {
  E: "#32d5ff",
  H: "#ff5d8f",
  Jd: "#f6c85f",
  Jsigma: "#b48cff",
  S: "#72e69b",
  Js: "#ff9f43",
};

function scalarValue(
  field: ScalarField,
  params: WaveguideParams,
  results: WaveguideResults,
  x: number,
  y: number,
  z: number,
) {
  const sample = sampleFields(params, results, x, y, z);
  if (field === "E") return magnitude(sample.E);
  if (field === "H") return magnitude(sample.H);
  if (field === "Sz") return sample.S.z;

  const phasors = fieldPhasors(params, results, x, y);
  const phase =
    params.timePhase - (results.propagating ? results.beta * z : 0);
  const attenuation = results.propagating
    ? 1
    : Math.exp(-results.alpha * z);
  const component = field === "Ez" ? phasors.E.z : phasors.H.z;
  return (
    attenuation *
    (component.re * Math.cos(phase) - component.im * Math.sin(phase))
  );
}

function heatColor(value: number, maxAbs: number, signed: boolean) {
  if (maxAbs === 0) return "rgba(18, 28, 43, .95)";
  const t = Math.max(-1, Math.min(1, value / maxAbs));
  if (signed) {
    const alpha = 0.18 + 0.68 * Math.abs(t);
    return t >= 0
      ? `rgba(33, 200, 255, ${alpha})`
      : `rgba(255, 75, 126, ${alpha})`;
  }
  const light = 10 + 48 * Math.max(0, t);
  return `hsl(${205 - 35 * t} 88% ${light}%)`;
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
  maxLength: number,
  referenceMagnitude: number,
  outOfPlane = 0,
) {
  const projected = Math.hypot(dx, dy);
  const fullMagnitude = Math.hypot(projected, outOfPlane);
  if (
    referenceMagnitude <= 0 ||
    fullMagnitude < referenceMagnitude * 0.025
  ) {
    return;
  }
  if (projected < referenceMagnitude * 0.025 && Math.abs(outOfPlane) > 0) {
    const radius = Math.max(2.8, Math.min(4.2, maxLength * 0.22));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
    if (outOfPlane > 0) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.38, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x - radius * 0.62, y - radius * 0.62);
      ctx.lineTo(x + radius * 0.62, y + radius * 0.62);
      ctx.moveTo(x + radius * 0.62, y - radius * 0.62);
      ctx.lineTo(x - radius * 0.62, y + radius * 0.62);
      ctx.stroke();
    }
    return;
  }
  if (projected <= 0) return;

  const ux = dx / projected;
  const uy = dy / projected;
  const normalized = Math.min(1, fullMagnitude / referenceMagnitude);
  const length = maxLength * (0.28 + 0.72 * normalized);
  const ex = x + ux * length;
  const ey = y + uy * length;
  const headLength = Math.min(4.2, Math.max(2.8, length * 0.32));
  const headWidth = headLength * 0.58;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.45;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(
    ex - ux * headLength - uy * headWidth,
    ey - uy * headLength + ux * headWidth,
  );
  ctx.lineTo(
    ex - ux * headLength + uy * headWidth,
    ey - uy * headLength - ux * headWidth,
  );
  ctx.closePath();
  ctx.fill();
}

function projectVector(plane: Plane, vector: Vector3Value) {
  if (plane === "xy") return [vector.x, -vector.y, vector.z] as const;
  if (plane === "xz") return [vector.z, -vector.x, vector.y] as const;
  return [vector.z, -vector.y, vector.x] as const;
}

export function FieldCanvas({
  plane,
  params,
  results,
  layers,
  scalar,
  slice,
  active,
  onActivate,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);

    const width = rect.width;
    const height = rect.height;
    const margin = { left: 42, right: 16, top: 32, bottom: 34 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0d1624";
    ctx.fillRect(0, 0, width, height);

    const nU = Math.max(10, Math.min(params.samples, 201));
    const nV = Math.max(
      8,
      Math.min(
        161,
        Math.round(
          nU *
            (plane === "xy"
              ? Math.min(1, params.b / params.a)
              : 0.7),
        ),
      ),
    );
    const points: {
      x: number;
      y: number;
      z: number;
      value: number;
      u: number;
      v: number;
    }[] = [];

    for (let j = 0; j < nV; j += 1) {
      for (let i = 0; i < nU; i += 1) {
        const u = i / (nU - 1);
        const v = j / (nV - 1);
        const x =
          plane === "xy" ? u * params.a : plane === "xz" ? v * params.a : slice.x;
        const y =
          plane === "xy" ? (1 - v) * params.b : plane === "yz" ? (1 - v) * params.b : slice.y;
        const z = plane === "xy" ? slice.z : u * params.length;
        points.push({
          x,
          y,
          z,
          value: results.valid
            ? scalarValue(scalar, params, results, x, y, z)
            : 0,
          u,
          v,
        });
      }
    }

    const maxAbs = Math.max(...points.map((point) => Math.abs(point.value)), 0);
    const signed = scalar === "Ez" || scalar === "Hz" || scalar === "Sz";
    const cellW = plotW / (nU - 1);
    const cellH = plotH / (nV - 1);
    for (const point of points) {
      ctx.fillStyle = heatColor(point.value, maxAbs, signed);
      ctx.fillRect(
        margin.left + point.u * plotW - cellW / 2,
        margin.top + point.v * plotH - cellH / 2,
        cellW + 1,
        cellH + 1,
      );
    }

    const transverseOrderU =
      plane === "xy" ? params.m : plane === "xz" ? 0 : 0;
    const transverseOrderV =
      plane === "xy" ? params.n : plane === "xz" ? params.m : params.n;
    const vectorCountU =
      plane === "xy"
        ? Math.max(7, Math.min(13, 2 * transverseOrderU + 5))
        : 9;
    const vectorCountV = Math.max(
      5,
      Math.min(11, 2 * transverseOrderV + 5),
    );
    const vectorPoints = [];
    for (let j = 0; j < vectorCountV; j += 1) {
      for (let i = 0; i < vectorCountU; i += 1) {
        const u = (i + 0.5) / vectorCountU;
        const v = (j + 0.5) / vectorCountV;
        const x =
          plane === "xy" ? u * params.a : plane === "xz" ? v * params.a : slice.x;
        const y =
          plane === "xy" ? (1 - v) * params.b : plane === "yz" ? (1 - v) * params.b : slice.y;
        const z = plane === "xy" ? slice.z : u * params.length;
        vectorPoints.push({ x, y, z, u, v });
      }
    }
    const maxArrowLength = Math.max(
      6,
      Math.min(
        18,
        0.38 * Math.min(plotW / vectorCountU, plotH / vectorCountV),
      ),
    );
    const vectorLayers = [
      ["E", layers.E],
      ["H", layers.H],
      ["Jd", layers.Jd],
      ["Jsigma", layers.Jsigma && params.sigma > 0],
      ["S", layers.S],
    ] as const;

    for (const [key, enabled] of vectorLayers) {
      if (!enabled || !results.valid) continue;
      const values = vectorPoints.map((point) => ({
        point,
        vector: sampleFields(
          params,
          results,
          point.x,
          point.y,
          point.z,
        )[key],
      }));
      const layerMax = Math.max(
        ...values.map(({ vector }) => magnitude(vector)),
        0,
      );
      if (layerMax === 0) continue;
      for (const { point, vector } of values) {
        const [du, dv, out] = projectVector(plane, vector);
        drawArrow(
          ctx,
          margin.left + point.u * plotW,
          margin.top + point.v * plotH,
          du,
          dv,
          COLORS[key],
          maxArrowLength,
          layerMax,
          out,
        );
      }
    }

    if (layers.Js && results.valid) {
      const wallSamples = 13;
      const drawJs = (
        wall: "x0" | "xa" | "y0" | "yb",
        first: number,
        z: number,
        u: number,
        v: number,
      ) => {
        const vector = surfaceCurrent(params, results, wall, first, z);
        const [du, dv, out] = projectVector(plane, vector);
        const amp = Math.max(magnitude(vector), 1e-30);
        drawArrow(
          ctx,
          margin.left + u * plotW,
          margin.top + v * plotH,
          du,
          dv,
          COLORS.Js,
          10,
          amp,
          out,
        );
      };

      for (let i = 0; i < wallSamples; i += 1) {
        const t = i / (wallSamples - 1);
        if (plane === "xy") {
          drawJs("x0", t * params.b, slice.z, 0, 1 - t);
          drawJs("xa", t * params.b, slice.z, 1, 1 - t);
          drawJs("y0", t * params.a, slice.z, t, 1);
          drawJs("yb", t * params.a, slice.z, t, 0);
        } else if (plane === "xz") {
          const z = t * params.length;
          drawJs("y0", 0.5 * params.a, z, t, 1);
          drawJs("yb", 0.5 * params.a, z, t, 0);
        } else {
          const z = t * params.length;
          drawJs("x0", 0.5 * params.b, z, t, 1);
          drawJs("xa", 0.5 * params.b, z, t, 0);
        }
      }
    }

    ctx.strokeStyle = active ? "#46d5ff" : "#718096";
    ctx.lineWidth = active ? 2 : 1;
    ctx.strokeRect(margin.left, margin.top, plotW, plotH);

    if (plane !== "xy" && results.propagating && Number.isFinite(results.lambdaG)) {
      const markers = [
        [0.5, "λg/2"],
        [1, "λg"],
        [1.5, "3λg/2"],
      ] as const;
      ctx.font = "11px system-ui";
      ctx.textAlign = "center";
      for (const [factor, label] of markers) {
        const z = factor * results.lambdaG;
        if (z > params.length) continue;
        const px = margin.left + (z / params.length) * plotW;
        ctx.strokeStyle = "rgba(255,255,255,.45)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(px, margin.top);
        ctx.lineTo(px, margin.top + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#d6deeb";
        ctx.fillText(label, px, height - 11);
      }
    }

    ctx.fillStyle = "#edf4ff";
    ctx.font = "600 13px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`${plane.toUpperCase()} · mapa ${scalar}`, 14, 20);
    ctx.font = "11px system-ui";
    ctx.fillStyle = "#91a0b5";
    const axes =
      plane === "xy" ? ["x", "y"] : plane === "xz" ? ["z", "x"] : ["z", "y"];
    ctx.textAlign = "center";
    ctx.fillText(axes[0], margin.left + plotW / 2, height - 8);
    ctx.save();
    ctx.translate(12, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(axes[1], 0, 0);
    ctx.restore();
  }, [active, layers, params, plane, results, scalar, slice]);

  return (
    <button
      className={`canvas-card ${active ? "active" : ""}`}
      onClick={onActivate}
      aria-label={`Wybierz przekrój ${plane}`}
    >
      <canvas ref={canvasRef} />
    </button>
  );
}
