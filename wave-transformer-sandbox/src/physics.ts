import {
  abs,
  add,
  complex,
  div,
  expj,
  mul,
  scale,
  sub,
  type Complex,
} from "./complex";

export const EPSILON_0 = 8.8541878128e-12;
export const MU_0 = 1.25663706212e-6;

export type ThicknessMode = "quarter" | "half" | "custom";
export type FieldKind = "E" | "H" | "D" | "B";

export interface MediumInput {
  epsilonR: number;
  muR: number;
}

export interface SimulationInput {
  frequencyGHz: number;
  incidentE: number;
  media: [MediumInput, MediumInput, MediumInput];
  thicknessMode: ThicknessMode;
  customThicknessMm: number;
}

export interface MediumProperties extends MediumInput {
  epsilon: number;
  mu: number;
  velocity: number;
  wavelength: number;
  beta: number;
  impedance: number;
}

export interface WaveSolution {
  input: SimulationInput;
  media: [MediumProperties, MediumProperties, MediumProperties];
  frequency: number;
  thickness: number;
  inputImpedance: Complex;
  gamma: Complex;
  amplitudes: {
    incident: Complex;
    reflected: Complex;
    layerForward: Complex;
    layerBackward: Complex;
    transmitted: Complex;
  };
  swr: number;
}

export interface FieldPhasors {
  incident: Complex;
  reflected: Complex;
  transmitted: Complex;
  total: Complex;
}

function mediumProperties(
  input: MediumInput,
  frequency: number,
): MediumProperties {
  const epsilon = EPSILON_0 * input.epsilonR;
  const mu = MU_0 * input.muR;
  const velocity = 1 / Math.sqrt(mu * epsilon);
  const wavelength = velocity / frequency;

  return {
    ...input,
    epsilon,
    mu,
    velocity,
    wavelength,
    beta: (2 * Math.PI) / wavelength,
    impedance: Math.sqrt(mu / epsilon),
  };
}

export function solveSystem(input: SimulationInput): WaveSolution {
  const frequency = input.frequencyGHz * 1e9;
  const media = input.media.map((medium) =>
    mediumProperties(medium, frequency),
  ) as [MediumProperties, MediumProperties, MediumProperties];
  const [m1, m2, m3] = media;

  const thickness =
    input.thicknessMode === "quarter"
      ? m2.wavelength / 4
      : input.thicknessMode === "half"
        ? m2.wavelength / 2
        : input.customThicknessMm / 1000;

  const tangent = Math.tan(m2.beta * thickness);

  // Impedancja wejściowa bezstratnej linii o impedancji Zw2,
  // długości d i obciążeniu Zw3.
  const inputImpedance = scale(
    div(
      complex(m3.impedance, m2.impedance * tangent),
      complex(m2.impedance, m3.impedance * tangent),
    ),
    m2.impedance,
  );

  const gamma = div(
    sub(inputImpedance, complex(m1.impedance)),
    add(inputImpedance, complex(m1.impedance)),
  );

  const incident = complex(input.incidentE);
  const reflected = mul(gamma, incident);

  // Warunki ciągłości E i H przy z=0 rozdzielają pole w warstwie
  // na falę biegnącą w +z (C) oraz falę wracającą w -z (D).
  const electricAtZero = add(incident, reflected);
  const magneticAtZero = scale(
    sub(incident, reflected),
    1 / m1.impedance,
  );
  const layerForward = scale(
    add(electricAtZero, scale(magneticAtZero, m2.impedance)),
    0.5,
  );
  const layerBackward = scale(
    sub(electricAtZero, scale(magneticAtZero, m2.impedance)),
    0.5,
  );

  const transmitted = add(
    mul(layerForward, expj(-m2.beta * thickness)),
    mul(layerBackward, expj(m2.beta * thickness)),
  );

  const gammaMagnitude = abs(gamma);
  const swr =
    gammaMagnitude >= 1 - 1e-10
      ? Number.POSITIVE_INFINITY
      : (1 + gammaMagnitude) / (1 - gammaMagnitude);

  return {
    input,
    media,
    frequency,
    thickness,
    inputImpedance,
    gamma,
    amplitudes: {
      incident,
      reflected,
      layerForward,
      layerBackward,
      transmitted,
    },
    swr,
  };
}

function convertElectricPhasor(
  electric: Complex,
  direction: 1 | -1,
  kind: FieldKind,
  medium: MediumProperties,
): Complex {
  if (kind === "E") return electric;

  const magnetic = scale(electric, direction / medium.impedance);
  if (kind === "H") return magnetic;
  if (kind === "D") return scale(electric, medium.epsilon);
  return scale(magnetic, medium.mu);
}

export function fieldPhasorsAt(
  solution: WaveSolution,
  z: number,
  kind: FieldKind,
): FieldPhasors {
  const [m1, m2, m3] = solution.media;
  const { thickness, amplitudes } = solution;
  let incident = complex(0);
  let reflected = complex(0);
  let transmitted = complex(0);

  if (z < 0) {
    incident = convertElectricPhasor(
      mul(amplitudes.incident, expj(-m1.beta * z)),
      1,
      kind,
      m1,
    );
    reflected = convertElectricPhasor(
      mul(amplitudes.reflected, expj(m1.beta * z)),
      -1,
      kind,
      m1,
    );
  } else if (z <= thickness) {
    transmitted = convertElectricPhasor(
      mul(amplitudes.layerForward, expj(-m2.beta * z)),
      1,
      kind,
      m2,
    );
    reflected = convertElectricPhasor(
      mul(amplitudes.layerBackward, expj(m2.beta * z)),
      -1,
      kind,
      m2,
    );
  } else {
    transmitted = convertElectricPhasor(
      mul(
        amplitudes.transmitted,
        expj(-m3.beta * (z - thickness)),
      ),
      1,
      kind,
      m3,
    );
  }

  return {
    incident,
    reflected,
    transmitted,
    total: add(add(incident, reflected), transmitted),
  };
}

export function matchedQuarterWaveEpsilonR(
  media1: MediumInput,
  layerMuR: number,
  media3: MediumInput,
): number {
  // Z2 = sqrt(Z1*Z3), przy wybranym mu_r2 rozwiązujemy epsilon_r2.
  return (
    layerMuR *
    Math.sqrt(
      (media1.epsilonR * media3.epsilonR) /
        (media1.muR * media3.muR),
    )
  );
}
