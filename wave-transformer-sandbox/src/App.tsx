import { useEffect, useMemo, useState } from "react";
import { Controls } from "./components/Controls";
import { EducationPanel } from "./components/EducationPanel";
import { FieldChart } from "./components/FieldChart";
import { ResultsPanel } from "./components/ResultsPanel";
import { solveSystem } from "./physics";
import type { AppState } from "./types";

const INITIAL_STATE: AppState = {
  simulation: {
    frequencyGHz: 10,
    incidentE: 1,
    media: [
      { epsilonR: 1, muR: 1 },
      { epsilonR: 2, muR: 1 },
      { epsilonR: 4, muR: 1 },
    ],
    thicknessMode: "quarter",
    customThicknessMm: 5,
  },
  display: {
    field: "E",
    incident: true,
    reflected: true,
    transmitted: true,
    total: true,
    envelope: true,
  },
  phase: 0,
  animate: false,
};

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const solution = useMemo(
    () => solveSystem(state.simulation),
    [state.simulation],
  );

  useEffect(() => {
    if (!state.animate) return;

    let animationFrame = 0;
    let previousTime = performance.now();
    const animate = (time: number) => {
      const elapsed = Math.min(50, time - previousTime);
      previousTime = time;
      setState((current) => ({
        ...current,
        phase: (current.phase + elapsed * 0.0024) % (2 * Math.PI),
      }));
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [state.animate]);

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Elektromagnetyzm · padanie prostopadłe</p>
          <h1>Wave Transformer Sandbox</h1>
          <p>
            Zobacz, jak bezstratna warstwa λ/4 lub λ/2 zmienia impedancję,
            odbicie i rozkład pól w układzie trzech ośrodków.
          </p>
        </div>
        <div className="direction-card" aria-label="Schemat ośrodków">
          <span>ośrodek 1</span>
          <i />
          <span>warstwa 2</span>
          <i />
          <span>ośrodek 3</span>
          <strong>k → +z</strong>
        </div>
      </header>

      <main className="workspace">
        <Controls state={state} setState={setState} />
        <div className="visual-column">
          <FieldChart
            solution={solution}
            display={state.display}
            phase={state.phase}
          />
          <ResultsPanel solution={solution} />
          <EducationPanel mode={state.simulation.thicknessMode} />
        </div>
      </main>

      <footer>
        Model: fala płaska, ośrodki jednorodne i bezstratne (σ = 0), padanie
        prostopadłe, amplitudy zespolone w stanie ustalonym.
      </footer>
    </div>
  );
}
