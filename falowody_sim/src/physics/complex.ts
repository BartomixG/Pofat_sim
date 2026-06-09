import type { Complex, ComplexVector, Vector3Value } from "./types";

export const c = (re = 0, im = 0): Complex => ({ re, im });
export const cAdd = (a: Complex, b: Complex): Complex =>
  c(a.re + b.re, a.im + b.im);
export const cMul = (a: Complex, b: Complex): Complex =>
  c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
export const cScale = (a: Complex, scalar: number): Complex =>
  c(a.re * scalar, a.im * scalar);
export const cConj = (a: Complex): Complex => c(a.re, -a.im);
export const cAbs = (a: Complex): number => Math.hypot(a.re, a.im);

export const cVector = (
  x: Complex = c(),
  y: Complex = c(),
  z: Complex = c(),
): ComplexVector => ({ x, y, z });

export const cVectorScale = (
  vector: ComplexVector,
  scalar: Complex,
): ComplexVector =>
  cVector(
    cMul(vector.x, scalar),
    cMul(vector.y, scalar),
    cMul(vector.z, scalar),
  );

export const realAtPhase = (
  value: Complex,
  phase: number,
  attenuation = 1,
): number =>
  attenuation * (value.re * Math.cos(phase) - value.im * Math.sin(phase));

export const realVectorAtPhase = (
  value: ComplexVector,
  phase: number,
  attenuation = 1,
): Vector3Value => ({
  x: realAtPhase(value.x, phase, attenuation),
  y: realAtPhase(value.y, phase, attenuation),
  z: realAtPhase(value.z, phase, attenuation),
});

export const cross = (
  a: Vector3Value,
  b: Vector3Value,
): Vector3Value => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

export const complexCrossWithConjugate = (
  a: ComplexVector,
  b: ComplexVector,
): Vector3Value => {
  const component = (
    a1: Complex,
    b1: Complex,
    a2: Complex,
    b2: Complex,
  ) => cAdd(cMul(a1, cConj(b1)), cScale(cMul(a2, cConj(b2)), -1));

  return {
    x: 0.5 * component(a.y, b.z, a.z, b.y).re,
    y: 0.5 * component(a.z, b.x, a.x, b.z).re,
    z: 0.5 * component(a.x, b.y, a.y, b.x).re,
  };
};

export const magnitude = (vector: Vector3Value): number =>
  Math.hypot(vector.x, vector.y, vector.z);
