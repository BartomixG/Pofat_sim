import {
  c,
  cAbs,
  cMul,
  complexCrossWithConjugate,
  cross,
  cScale,
  cVector,
  magnitude,
  realVectorAtPhase,
} from "./complex";
import type {
  ComplexVector,
  FieldSample,
  Vector3Value,
  Wall,
  WaveguideParams,
  WaveguideResults,
} from "./types";

export const C0 = 299_792_458;
export const EPSILON0 = 8.854_187_812_8e-12;
export const MU0 = 4 * Math.PI * 1e-7;

export const DEFAULT_PARAMS: WaveguideParams = {
  mode: "TE",
  m: 1,
  n: 0,
  frequency: 10e9,
  a: 22.86e-3,
  b: 10.16e-3,
  epsilonR: 1,
  muR: 1,
  sigma: 0,
  amplitude: 1,
  length: 0.08,
  samples: 15,
  timePhase: 0,
};

export function validateMode(params: WaveguideParams): string {
  if (params.mode === "TE" && params.m === 0 && params.n === 0) {
    return "Tryb TE00 nie istnieje: co najmniej jeden indeks musi być niezerowy.";
  }
  if (params.mode === "TM" && (params.m < 1 || params.n < 1)) {
    return "Tryb TM wymaga m >= 1 i n >= 1; TM10, TM01 i TM00 nie istnieją.";
  }
  if (params.a <= 0 || params.b <= 0 || params.frequency <= 0) {
    return "Wymiary falowodu i częstotliwość muszą być dodatnie.";
  }
  if (params.epsilonR <= 0 || params.muR <= 0) {
    return "Względne przenikalności muszą być dodatnie.";
  }
  return "";
}

export function calculateWaveguide(
  params: WaveguideParams,
  calculateBoundary = true,
): WaveguideResults {
  const validationMessage = validateMode(params);
  const epsilon = EPSILON0 * params.epsilonR;
  const mu = MU0 * params.muR;
  const velocity = 1 / Math.sqrt(mu * epsilon);
  const omega = 2 * Math.PI * params.frequency;
  const k = omega * Math.sqrt(mu * epsilon);
  const kx = (params.m * Math.PI) / params.a;
  const ky = (params.n * Math.PI) / params.b;
  const kc = Math.hypot(kx, ky);
  const fc = kc / (2 * Math.PI * Math.sqrt(mu * epsilon));
  const propagating = !validationMessage && params.frequency > fc;
  const beta = propagating ? Math.sqrt(Math.max(0, k * k - kc * kc)) : 0;
  const alpha =
    !validationMessage && !propagating
      ? Math.sqrt(Math.max(0, kc * kc - k * k))
      : 0;
  const lambda = k > 0 ? (2 * Math.PI) / k : Number.POSITIVE_INFINITY;
  const lambdaG =
    propagating && beta > 0 ? (2 * Math.PI) / beta : Number.POSITIVE_INFINITY;
  const phaseVelocity =
    propagating ? omega / beta : Number.POSITIVE_INFINITY;
  const groupVelocity =
    propagating ? (velocity * velocity) / phaseVelocity : 0;

  const base: WaveguideResults = {
    valid: validationMessage === "",
    validationMessage,
    propagating,
    omega,
    epsilon,
    mu,
    velocity,
    k,
    kc,
    fc,
    beta,
    alpha,
    lambda,
    lambdaG,
    phaseVelocity,
    groupVelocity,
    impedanceTE:
      propagating && beta > 0
        ? (omega * mu) / beta
        : Number.POSITIVE_INFINITY,
    impedanceTM:
      propagating && beta > 0 ? beta / (omega * epsilon) : 0,
    boundaryViolation: 0,
  };

  return {
    ...base,
    boundaryViolation:
      calculateBoundary && !validationMessage
        ? boundaryCheck(params, base)
        : 0,
  };
}

/**
 * Complex field amplitudes without exp(j*omega*t - j*beta*z).
 * Signs follow that convention. Below cutoff beta = -j*alpha, so
 * exp(-j*beta*z) becomes exp(-alpha*z).
 */
export function fieldPhasors(
  params: WaveguideParams,
  results: WaveguideResults,
  x: number,
  y: number,
): { E: ComplexVector; H: ComplexVector } {
  if (!results.valid || results.kc === 0) {
    return { E: cVector(), H: cVector() };
  }

  const kx = (params.m * Math.PI) / params.a;
  const ky = (params.n * Math.PI) / params.b;
  const kc2 = results.kc * results.kc;
  // Complex beta: real above cutoff, -j*alpha below cutoff.
  const betaComplex = results.propagating
    ? c(results.beta)
    : c(0, -results.alpha);

  if (params.mode === "TE") {
    const hz = params.amplitude * Math.cos(kx * x) * Math.cos(ky * y);
    const dHzDx =
      -params.amplitude * kx * Math.sin(kx * x) * Math.cos(ky * y);
    const dHzDy =
      -params.amplitude * ky * Math.cos(kx * x) * Math.sin(ky * y);
    const jOmegaMu = c(0, (results.omega * results.mu) / kc2);
    const minusJBeta = cMul(c(0, -1 / kc2), betaComplex);

    return {
      E: cVector(cScale(jOmegaMu, dHzDy), cScale(jOmegaMu, -dHzDx), c()),
      H: cVector(
        cScale(minusJBeta, dHzDx),
        cScale(minusJBeta, dHzDy),
        c(hz),
      ),
    };
  }

  const ez = params.amplitude * Math.sin(kx * x) * Math.sin(ky * y);
  const dEzDx =
    params.amplitude * kx * Math.cos(kx * x) * Math.sin(ky * y);
  const dEzDy =
    params.amplitude * ky * Math.sin(kx * x) * Math.cos(ky * y);
  const minusJBeta = cMul(c(0, -1 / kc2), betaComplex);
  const jOmegaEpsilon = c(0, (results.omega * results.epsilon) / kc2);

  return {
    E: cVector(
      cScale(minusJBeta, dEzDx),
      cScale(minusJBeta, dEzDy),
      c(ez),
    ),
    H: cVector(
      cScale(jOmegaEpsilon, -dEzDy),
      cScale(jOmegaEpsilon, dEzDx),
      c(),
    ),
  };
}

export function sampleFields(
  params: WaveguideParams,
  results: WaveguideResults,
  x: number,
  y: number,
  z: number,
  timePhase = params.timePhase,
): FieldSample {
  const phasors = fieldPhasors(params, results, x, y);
  const phase = timePhase - (results.propagating ? results.beta * z : 0);
  const attenuation = results.propagating ? 1 : Math.exp(-results.alpha * z);
  const E = realVectorAtPhase(phasors.E, phase, attenuation);
  const H = realVectorAtPhase(phasors.H, phase, attenuation);

  const jdPhasor = cVector(
    cMul(c(0, results.omega * results.epsilon), phasors.E.x),
    cMul(c(0, results.omega * results.epsilon), phasors.E.y),
    cMul(c(0, results.omega * results.epsilon), phasors.E.z),
  );
  const Jd = realVectorAtPhase(jdPhasor, phase, attenuation);
  const Jsigma = {
    x: params.sigma * E.x,
    y: params.sigma * E.y,
    z: params.sigma * E.z,
  };

  return {
    E,
    H,
    Jd,
    Jsigma,
    S: cross(E, H),
    Savg: {
      ...complexCrossWithConjugate(phasors.E, phasors.H),
    },
  };
}

export function surfaceCurrent(
  params: WaveguideParams,
  results: WaveguideResults,
  wall: Wall,
  first: number,
  z: number,
): Vector3Value {
  let x = 0;
  let y = 0;
  let normal: Vector3Value;

  switch (wall) {
    case "x0":
      x = 0;
      y = first;
      normal = { x: -1, y: 0, z: 0 };
      break;
    case "xa":
      x = params.a;
      y = first;
      normal = { x: 1, y: 0, z: 0 };
      break;
    case "y0":
      x = first;
      y = 0;
      normal = { x: 0, y: -1, z: 0 };
      break;
    case "yb":
      x = first;
      y = params.b;
      normal = { x: 0, y: 1, z: 0 };
      break;
  }

  return cross(normal, sampleFields(params, results, x, y, z).H);
}

export function boundaryCheck(
  params: WaveguideParams,
  results: WaveguideResults,
  samples = 41,
): number {
  let maxTangential = 0;
  let maxField = 0;

  for (let i = 0; i < samples; i += 1) {
    const t = i / (samples - 1);
    for (const [x, y, wall] of [
      [0, t * params.b, "x"],
      [params.a, t * params.b, "x"],
      [t * params.a, 0, "y"],
      [t * params.a, params.b, "y"],
    ] as const) {
      const E = fieldPhasors(params, results, x, y).E;
      const full = Math.hypot(cAbs(E.x), cAbs(E.y), cAbs(E.z));
      const tangential =
        wall === "x"
          ? Math.hypot(cAbs(E.y), cAbs(E.z))
          : Math.hypot(cAbs(E.x), cAbs(E.z));
      maxField = Math.max(maxField, full);
      maxTangential = Math.max(maxTangential, tangential);
    }
  }

  // Relative residual; exact analytical modes should be at floating-point noise.
  return maxField > 0 ? maxTangential / maxField : maxTangential;
}

export function fieldMagnitude(sample: FieldSample, key: "E" | "H"): number {
  return magnitude(sample[key]);
}
