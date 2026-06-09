import { useEffect, useMemo, useState } from "react";
import { Controls } from "./components/Controls";
import { FieldCanvas } from "./components/FieldCanvas";
import { ResultsPanel } from "./components/ResultsPanel";
import { Theory } from "./components/Theory";
import { Waveguide3D } from "./components/Waveguide3D";
import {
  DEFAULT_PARAMS,
  calculateWaveguide,
} from "./physics/waveguide";
import type {
  LayerVisibility,
  Plane,
  ScalarField,
  WaveguideParams,
} from "./physics/types";

const DEFAULT_LAYERS: LayerVisibility = {
  E: true,
  H: true,
  Js: true,
  Jd: false,
  Jsigma: false,
  S: false,
};

export default function App() {
  const [params, setParams] = useState<WaveguideParams>(DEFAULT_PARAMS);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [plane, setPlane] = useState<Plane>("xy");
  const [scalar, setScalar] = useState<ScalarField>("E");
  const [slice, setSlice] = useState({
    x: DEFAULT_PARAMS.a / 2,
    y: DEFAULT_PARAMS.b / 2,
    z: 0,
  });
  const [animate, setAnimate] = useState(false);
  const results = useMemo(() => calculateWaveguide(params), [params]);

  useEffect(() => {
    setSlice((current) => ({
      x: Math.min(current.x, params.a),
      y: Math.min(current.y, params.b),
      z: Math.min(current.z, params.length),
    }));
  }, [params.a, params.b, params.length]);

  useEffect(() => {
    if (!animate) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      setParams((current) => ({
        ...current,
        timePhase: (current.timePhase + delta * Math.PI) % (2 * Math.PI),
      }));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">Ψ</span>
          <div>
            <p>POFAT · elektromagnetyzm</p>
            <h1>Falowód prostokątny</h1>
          </div>
        </div>
        <div className="header-note">
          <span>Model dydaktyczny</span>
          <strong>TE/TM · ściany PEC · exp(jωt − jβz)</strong>
        </div>
      </header>

      <main className="workspace">
        <Controls
          params={params}
          layers={layers}
          plane={plane}
          scalar={scalar}
          slice={slice}
          animate={animate}
          onParams={setParams}
          onLayers={setLayers}
          onPlane={setPlane}
          onScalar={setScalar}
          onSlice={setSlice}
          onAnimate={setAnimate}
        />

        <section className="visualization">
          <div className="visual-heading">
            <div>
              <p className="eyebrow">Pole w czasie</p>
              <h2>
                {params.mode}
                <sub>{params.m}{params.n}</sub>
                <span> · faza {(params.timePhase / Math.PI).toFixed(2)}π</span>
              </h2>
            </div>
            <p>
              Kolor pokazuje {scalar}. Strzałki każdej wielkości są
              normalizowane osobno; ich długości nie porównują jednostek.
            </p>
          </div>

          <div className="view-grid">
            <div className="canvas-stack">
              {(["xy", "xz", "yz"] as const).map((item) => (
                <FieldCanvas
                  key={item}
                  plane={item}
                  params={params}
                  results={results}
                  layers={layers}
                  scalar={scalar}
                  slice={slice}
                  active={plane === item}
                  onActivate={() => setPlane(item)}
                />
              ))}
            </div>
            <Waveguide3D params={params} results={results} layers={layers} />
          </div>

          <div className="visual-footnote">
            <span>⊙ wektor z płaszczyzny · ⊗ wektor do płaszczyzny</span>
            <span>Js występuje wyłącznie na czterech ściankach PEC</span>
          </div>
        </section>

        <ResultsPanel params={params} results={results} />
      </main>

      <Theory />

      <footer>
        <span>Symulator falowodu prostokątnego · model monochromatyczny</span>
        <span>c₀ = 299 792 458 m/s</span>
      </footer>
    </div>
  );
}
