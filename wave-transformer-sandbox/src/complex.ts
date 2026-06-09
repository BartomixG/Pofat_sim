export interface Complex {
  re: number;
  im: number;
}

export const complex = (re: number, im = 0): Complex => ({ re, im });

export const add = (a: Complex, b: Complex): Complex =>
  complex(a.re + b.re, a.im + b.im);

export const sub = (a: Complex, b: Complex): Complex =>
  complex(a.re - b.re, a.im - b.im);

export const mul = (a: Complex, b: Complex): Complex =>
  complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);

export const scale = (a: Complex, factor: number): Complex =>
  complex(a.re * factor, a.im * factor);

export const div = (a: Complex, b: Complex): Complex => {
  const denominator = b.re * b.re + b.im * b.im;
  return complex(
    (a.re * b.re + a.im * b.im) / denominator,
    (a.im * b.re - a.re * b.im) / denominator,
  );
};

export const abs = (value: Complex): number =>
  Math.hypot(value.re, value.im);

export const expj = (angle: number): Complex =>
  complex(Math.cos(angle), Math.sin(angle));

export const realAtPhase = (phasor: Complex, phase: number): number =>
  mul(phasor, expj(phase)).re;
