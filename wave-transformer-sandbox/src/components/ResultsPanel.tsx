import { abs, type Complex } from "../complex";
import type { WaveSolution } from "../physics";

interface ResultsPanelProps {
  solution: WaveSolution;
}

function format(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return "∞";
  return value.toLocaleString("pl-PL", {
    maximumSignificantDigits: digits,
  });
}

function formatComplex(value: Complex): string {
  const sign = value.im < 0 ? "−" : "+";
  return `${format(value.re, 5)} ${sign} j${format(Math.abs(value.im), 5)}`;
}

export function ResultsPanel({ solution }: ResultsPanelProps) {
  const gammaMagnitude = abs(solution.gamma);
  const matched = gammaMagnitude < 1e-3;
  const halfWave =
    Math.abs(solution.thickness / solution.media[1].wavelength - 0.5) <
    1e-4;

  return (
    <section className="panel results-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Wartości obliczone</p>
          <h2>Stan układu</h2>
        </div>
        <div className="status-list">
          {matched && <span className="status good">dopasowanie</span>}
          {halfWave && (
            <span className="status neutral">przezroczystość półfalowa</span>
          )}
        </div>
      </div>

      <div className="results-grid">
        {solution.media.map((medium, index) => (
          <article className="result-card" key={index}>
            <h3>Ośrodek {index + 1}</h3>
            <dl>
              <div>
                <dt>Zw{index + 1}</dt>
                <dd>{format(medium.impedance)} Ω</dd>
              </div>
              <div>
                <dt>λ{index + 1}</dt>
                <dd>{format(medium.wavelength * 1000)} mm</dd>
              </div>
              <div>
                <dt>β{index + 1}</dt>
                <dd>{format(medium.beta)} rad/m</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <dl className="summary-results">
        <div>
          <dt>Grubość d</dt>
          <dd>
            {format(solution.thickness * 1000, 6)} mm
            <small>
              {(solution.thickness / solution.media[1].wavelength).toFixed(4)}
              λ₂
            </small>
          </dd>
        </div>
        <div>
          <dt>Zin</dt>
          <dd>{formatComplex(solution.inputImpedance)} Ω</dd>
        </div>
        <div>
          <dt>Γ12</dt>
          <dd>{formatComplex(solution.gamma)}</dd>
        </div>
        <div>
          <dt>|Γ12|</dt>
          <dd>{format(gammaMagnitude, 6)}</dd>
        </div>
        <div>
          <dt>WFS</dt>
          <dd>{format(solution.swr, 6)}</dd>
        </div>
      </dl>
    </section>
  );
}
