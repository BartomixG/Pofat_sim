import type { Dispatch, SetStateAction } from "react";
import { matchedQuarterWaveEpsilonR } from "../physics";
import type { AppState } from "../types";

interface ControlsProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
}

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <span className="input-with-unit">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            if (Number.isFinite(parsed)) onChange(parsed);
          }}
        />
        {unit && <small>{unit}</small>}
      </span>
    </label>
  );
}

export function Controls({ state, setState }: ControlsProps) {
  const updateSimulation = (
    patch: Partial<AppState["simulation"]>,
  ): void => {
    setState((current) => ({
      ...current,
      simulation: { ...current.simulation, ...patch },
    }));
  };

  const updateMedium = (
    index: 0 | 1 | 2,
    key: "epsilonR" | "muR",
    value: number,
  ): void => {
    setState((current) => {
      const media = current.simulation.media.map((medium) => ({
        ...medium,
      })) as AppState["simulation"]["media"];
      media[index][key] = Math.max(0.01, value);
      return {
        ...current,
        simulation: { ...current.simulation, media },
      };
    });
  };

  const applyQuarterWaveMatch = (): void => {
    setState((current) => {
      const [m1, m2, m3] = current.simulation.media;
      const epsilonR = matchedQuarterWaveEpsilonR(m1, m2.muR, m3);
      const media = [
        { ...m1 },
        { ...m2, epsilonR: Number(epsilonR.toPrecision(8)) },
        { ...m3 },
      ] as AppState["simulation"]["media"];

      return {
        ...current,
        simulation: {
          ...current.simulation,
          media,
          thicknessMode: "quarter",
        },
      };
    });
  };

  return (
    <aside className="panel controls-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Parametry wejściowe</p>
          <h2>Eksperyment</h2>
        </div>
        <button
          className="match-button"
          type="button"
          onClick={applyQuarterWaveMatch}
          title="Dobiera εr2 przy zachowaniu μr2"
        >
          Dopasuj λ/4
        </button>
      </div>

      <div className="control-section control-grid">
        <NumberField
          label="Częstotliwość f"
          value={state.simulation.frequencyGHz}
          min={0.1}
          max={300}
          step={0.1}
          unit="GHz"
          onChange={(frequencyGHz) =>
            updateSimulation({
              frequencyGHz: Math.max(0.1, frequencyGHz),
            })
          }
        />
        <NumberField
          label="Amplituda E₀"
          value={state.simulation.incidentE}
          min={0.001}
          max={1e6}
          step={0.1}
          unit="V/m"
          onChange={(incidentE) =>
            updateSimulation({ incidentE: Math.max(0.001, incidentE) })
          }
        />
      </div>

      <div className="control-section">
        <h3>Właściwości ośrodków</h3>
        <div className="media-table">
          <div className="media-row media-header">
            <span>Ośrodek</span>
            <span>εr</span>
            <span>μr</span>
          </div>
          {state.simulation.media.map((medium, index) => (
            <div className="media-row" key={index}>
              <strong>{index + 1}</strong>
              <input
                aria-label={`epsilon r ośrodka ${index + 1}`}
                type="number"
                min="0.01"
                step="0.1"
                value={medium.epsilonR}
                onChange={(event) =>
                  updateMedium(
                    index as 0 | 1 | 2,
                    "epsilonR",
                    Number(event.target.value),
                  )
                }
              />
              <input
                aria-label={`mu r ośrodka ${index + 1}`}
                type="number"
                min="0.01"
                step="0.1"
                value={medium.muR}
                onChange={(event) =>
                  updateMedium(
                    index as 0 | 1 | 2,
                    "muR",
                    Number(event.target.value),
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>

      <fieldset className="control-section">
        <legend>Grubość warstwy 2</legend>
        <label className="choice-row">
          <input
            type="radio"
            name="thickness"
            checked={state.simulation.thicknessMode === "quarter"}
            onChange={() => updateSimulation({ thicknessMode: "quarter" })}
          />
          λ₂ / 4
        </label>
        <label className="choice-row">
          <input
            type="radio"
            name="thickness"
            checked={state.simulation.thicknessMode === "half"}
            onChange={() => updateSimulation({ thicknessMode: "half" })}
          />
          λ₂ / 2
        </label>
        <label className="choice-row custom-thickness">
          <input
            type="radio"
            name="thickness"
            checked={state.simulation.thicknessMode === "custom"}
            onChange={() => updateSimulation({ thicknessMode: "custom" })}
          />
          własna:
          <input
            aria-label="Własna grubość warstwy w milimetrach"
            type="number"
            min="0.001"
            step="0.1"
            value={state.simulation.customThicknessMm}
            onFocus={() => updateSimulation({ thicknessMode: "custom" })}
            onChange={(event) =>
              updateSimulation({
                customThicknessMm: Math.max(
                  0.001,
                  Number(event.target.value),
                ),
              })
            }
          />
          mm
        </label>
      </fieldset>

      <div className="control-section">
        <h3>Wielkość pola</h3>
        <div className="segmented">
          {(["E", "H", "D", "B"] as const).map((field) => (
            <button
              type="button"
              className={state.display.field === field ? "active" : ""}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  display: { ...current.display, field },
                }))
              }
              key={field}
            >
              {field}
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <div className="time-heading">
          <h3>Czas i faza</h3>
          <label className="switch-label">
            <input
              type="checkbox"
              checked={state.animate}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  animate: event.target.checked,
                }))
              }
            />
            animacja
          </label>
        </div>
        <input
          className="phase-slider"
          aria-label="Faza czasu"
          type="range"
          min="0"
          max={2 * Math.PI}
          step="0.01"
          value={state.phase}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              phase: Number(event.target.value),
            }))
          }
        />
        <div className="phase-readout">
          <span>0</span>
          <strong>{((state.phase * 180) / Math.PI).toFixed(0)}°</strong>
          <span>360°</span>
        </div>
      </div>

      <div className="control-section">
        <h3>Warstwy wykresu</h3>
        <div className="checkbox-grid">
          {(
            [
              ["incident", "fala padająca"],
              ["reflected", "fala odbita"],
              ["transmitted", "fala transmitowana"],
              ["total", "pole całkowite"],
              ["envelope", "obwiednia amplitudy"],
            ] as const
          ).map(([key, label]) => (
            <label className="choice-row" key={key}>
              <input
                type="checkbox"
                checked={state.display[key]}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    display: {
                      ...current.display,
                      [key]: event.target.checked,
                    },
                  }))
                }
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
