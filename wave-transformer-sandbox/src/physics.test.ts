import { describe, expect, it } from "vitest";
import {
  matchedQuarterWaveEpsilonR,
  solveSystem,
  type SimulationInput,
} from "./physics";

const baseInput: SimulationInput = {
  frequencyGHz: 10,
  incidentE: 1,
  media: [
    { epsilonR: 1, muR: 1 },
    { epsilonR: 2, muR: 1 },
    { epsilonR: 4, muR: 1 },
  ],
  thicknessMode: "quarter",
  customThicknessMm: 5,
};

describe("lossless three-medium transformer", () => {
  it("matches a quarter-wave layer when Z2 = sqrt(Z1 Z3)", () => {
    const epsilonR2 = matchedQuarterWaveEpsilonR(
      baseInput.media[0],
      1,
      baseInput.media[2],
    );
    const solution = solveSystem({
      ...baseInput,
      media: [
        baseInput.media[0],
        { epsilonR: epsilonR2, muR: 1 },
        baseInput.media[2],
      ],
    });

    expect(epsilonR2).toBeCloseTo(2, 12);
    expect(Math.hypot(solution.gamma.re, solution.gamma.im)).toBeLessThan(
      1e-10,
    );
  });

  it("makes a half-wave layer impedance-transparent", () => {
    const solution = solveSystem({
      ...baseInput,
      media: [
        baseInput.media[0],
        { epsilonR: 7.3, muR: 1.4 },
        baseInput.media[2],
      ],
      thicknessMode: "half",
    });

    expect(solution.inputImpedance.re).toBeCloseTo(
      solution.media[2].impedance,
      9,
    );
    expect(solution.inputImpedance.im).toBeCloseTo(0, 9);
  });
});
