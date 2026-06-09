import { describe, expect, it } from "vitest";
import {
  C0,
  DEFAULT_PARAMS,
  calculateWaveguide,
  validateMode,
} from "./waveguide";

describe("rectangular waveguide physics", () => {
  it("calculates TE10 cutoff for WR-90", () => {
    const result = calculateWaveguide(DEFAULT_PARAMS);
    const expected = C0 / (2 * DEFAULT_PARAMS.a);
    // The supplied exact c0 and rounded epsilon0/mu0 constants differ by
    // about 2.7e-10 relatively. The implementation follows v=1/sqrt(mu*eps).
    expect(Math.abs(result.fc - expected) / expected).toBeLessThan(1e-8);
    expect(result.fc / 1e9).toBeCloseTo(6.557, 2);
  });

  it("detects a mode below cutoff", () => {
    const result = calculateWaveguide({
      ...DEFAULT_PARAMS,
      frequency: 5e9,
    });
    expect(result.propagating).toBe(false);
    expect(result.alpha).toBeGreaterThan(0);
  });

  it("keeps propagation constants finite immediately around cutoff", () => {
    const cutoff = calculateWaveguide(DEFAULT_PARAMS).fc;
    const above = calculateWaveguide({
      ...DEFAULT_PARAMS,
      frequency: cutoff * (1 + 1e-12),
    });
    const below = calculateWaveguide({
      ...DEFAULT_PARAMS,
      frequency: cutoff * (1 - 1e-12),
    });

    expect(above.beta).toBeGreaterThan(0);
    expect(Number.isFinite(above.beta)).toBe(true);
    expect(below.alpha).toBeGreaterThan(0);
    expect(Number.isFinite(below.alpha)).toBe(true);
  });

  it("rejects TE00", () => {
    expect(
      validateMode({ ...DEFAULT_PARAMS, mode: "TE", m: 0, n: 0 }),
    ).toContain("TE00");
  });

  it.each([
    [1, 0],
    [0, 1],
    [0, 0],
  ])("rejects invalid TM%d%d", (m, n) => {
    expect(
      validateMode({ ...DEFAULT_PARAMS, mode: "TM", m, n }),
    ).toContain("m >= 1");
  });

  it("satisfies PEC tangential E boundary condition", () => {
    const result = calculateWaveguide(DEFAULT_PARAMS);
    expect(result.boundaryViolation).toBeLessThan(1e-12);
  });
});
