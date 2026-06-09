import type { WaveguideParams, WaveguideResults } from "../physics/types";

const format = (value: number, unit = "", digits = 4) => {
  if (!Number.isFinite(value)) return `— ${unit}`.trim();
  if (value === 0) return `0 ${unit}`.trim();
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(3)} G${unit}`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(3)} M${unit}`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(3)} k${unit}`;
  if (abs < 1e-3) return `${value.toExponential(3)} ${unit}`.trim();
  return `${value.toPrecision(digits)} ${unit}`.trim();
};

export function ResultsPanel({
  params,
  results,
}: {
  params: WaveguideParams;
  results: WaveguideResults;
}) {
  const rows = [
    ["fc", format(results.fc, "Hz")],
    ["ω", format(results.omega, "rad/s")],
    ["k", format(results.k, "rad/m")],
    ["kc", format(results.kc, "rad/m")],
    ["βg", results.propagating ? format(results.beta, "rad/m") : `−j ${format(results.alpha, "1/m")}`],
    ["λ", format(results.lambda, "m")],
    ["λg", format(results.lambdaG, "m")],
    ["vp", format(results.phaseVelocity, "m/s")],
    ["vg", format(results.groupVelocity, "m/s")],
    ["ZTE", format(results.impedanceTE, "Ω")],
    ["ZTM", format(results.impedanceTM, "Ω")],
  ];

  return (
    <aside className="results panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Obliczenia</p>
          <h2>
            {params.mode}
            <sub>{params.m}{params.n}</sub>
          </h2>
        </div>
        <span className={`status-dot ${results.propagating ? "ok" : "warning"}`}>
          {results.propagating ? "propagacja" : "odcięcie"}
        </span>
      </div>

      {!results.valid ? (
        <div className="alert error">{results.validationMessage}</div>
      ) : !results.propagating ? (
        <div className="alert warning">
          Tryb poniżej częstotliwości odcięcia — brak propagacji fali bieżącej
          wzdłuż z. Pokazano pole zanikające z α = {format(results.alpha, "1/m")}.
        </div>
      ) : (
        <div className="alert success">
          f / fc = {(params.frequency / results.fc).toFixed(3)}. Stała β jest
          rzeczywista.
        </div>
      )}

      <dl className="result-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="boundary-card">
        <div>
          <span>Boundary check</span>
          <strong>E<sub>t</sub> = 0 na PEC</strong>
        </div>
        <output
          className={results.boundaryViolation < 1e-10 ? "pass" : "fail"}
        >
          {results.boundaryViolation.toExponential(2)}
        </output>
      </div>

      <div className="legend">
        <span><i className="dot-e" /> E</span>
        <span><i className="dot-h" /> H</span>
        <span><i className="dot-js" /> Js = n × H</span>
        <span><i className="dot-jd" /> Jd</span>
        <span><i className="dot-s" /> S</span>
      </div>

      <p className="model-note">
        Model dydaktyczny: jednorodne wypełnienie, idealne ścianki PEC i
        monochromatyczny mod własny. Straty σ wpływają na Jσ, ale nie są
        sprzężone zwrotnie z zespoloną stałą propagacji.
      </p>
    </aside>
  );
}
