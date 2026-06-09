export type ModeType = "TE" | "TM";
export type Plane = "xy" | "xz" | "yz";
export type ScalarField = "E" | "H" | "Ez" | "Hz" | "Sz";

export interface WaveguideParams {
  mode: ModeType;
  m: number;
  n: number;
  frequency: number;
  a: number;
  b: number;
  epsilonR: number;
  muR: number;
  sigma: number;
  amplitude: number;
  length: number;
  samples: number;
  timePhase: number;
}

export interface LayerVisibility {
  E: boolean;
  H: boolean;
  Js: boolean;
  Jd: boolean;
  Jsigma: boolean;
  S: boolean;
}

export interface Complex {
  re: number;
  im: number;
}

export interface ComplexVector {
  x: Complex;
  y: Complex;
  z: Complex;
}

export interface Vector3Value {
  x: number;
  y: number;
  z: number;
}

export interface WaveguideResults {
  valid: boolean;
  validationMessage: string;
  propagating: boolean;
  omega: number;
  epsilon: number;
  mu: number;
  velocity: number;
  k: number;
  kc: number;
  fc: number;
  beta: number;
  alpha: number;
  lambda: number;
  lambdaG: number;
  phaseVelocity: number;
  groupVelocity: number;
  impedanceTE: number;
  impedanceTM: number;
  boundaryViolation: number;
}

export interface FieldSample {
  E: Vector3Value;
  H: Vector3Value;
  Jd: Vector3Value;
  Jsigma: Vector3Value;
  S: Vector3Value;
  Savg: Vector3Value;
}

export type Wall = "x0" | "xa" | "y0" | "yb";
