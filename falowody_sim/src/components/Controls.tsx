import type {
  LayerVisibility,
  Plane,
  ScalarField,
  WaveguideParams,
} from "../physics/types";

interface Props {
  params: WaveguideParams;
  layers: LayerVisibility;
  plane: Plane;
  scalar: ScalarField;
  slice: { x: number; y: number; z: number };
  animate: boolean;
  onParams: (next: WaveguideParams) => void;
  onLayers: (next: LayerVisibility) => void;
  onPlane: (plane: Plane) => void;
  onScalar: (field: ScalarField) => void;
  onSlice: (slice: { x: number; y: number; z: number }) => void;
  onAnimate: (animate: boolean) => void;
}

const NumberInput = ({
  label,
  title,
  value,
  step,
  min,
  max,
  unit,
  scale = 1,
  onChange,
}: {
  label: string;
  title: string;
  value: number;
  step: number;
  min?: number;
  max?: number;
  unit?: string;
  scale?: number;
  onChange: (value: number) => void;
}) => (
  <label className="control" title={title}>
    <span>{label}</span>
    <div className="input-unit">
      <input
        type="number"
        value={Number((value / scale).toPrecision(7))}
        step={step}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value) * scale)}
      />
      {unit && <small>{unit}</small>}
    </div>
  </label>
);

export function Controls({
  params,
  layers,
  plane,
  scalar,
  slice,
  animate,
  onParams,
  onLayers,
  onPlane,
  onScalar,
  onSlice,
  onAnimate,
}: Props) {
  const patch = (partial: Partial<WaveguideParams>) =>
    onParams({ ...params, ...partial });

  return (
    <aside className="controls panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Sterowanie</p>
          <h2>Parametry modelu</h2>
        </div>
        <span className="model-pill">PEC</span>
      </div>

      <section>
        <h3>Mod</h3>
        <div className="segmented">
          {(["TE", "TM"] as const).map((mode) => (
            <button
              className={params.mode === mode ? "active" : ""}
              key={mode}
              onClick={() => patch({ mode })}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="two-columns">
          <NumberInput
            label="m"
            title="Indeks zmienności pola w kierunku x."
            value={params.m}
            step={1}
            min={0}
            max={3}
            onChange={(m) => patch({ m: Math.round(m) })}
          />
          <NumberInput
            label="n"
            title="Indeks zmienności pola w kierunku y."
            value={params.n}
            step={1}
            min={0}
            max={3}
            onChange={(n) => patch({ n: Math.round(n) })}
          />
        </div>
      </section>

      <section>
        <h3>Geometria i ośrodek</h3>
        <NumberInput
          label="Szerokość a"
          title="Wymiar falowodu w osi x."
          value={params.a}
          scale={1e-3}
          step={0.1}
          min={0.1}
          unit="mm"
          onChange={(a) => patch({ a })}
        />
        <NumberInput
          label="Wysokość b"
          title="Wymiar falowodu w osi y."
          value={params.b}
          scale={1e-3}
          step={0.1}
          min={0.1}
          unit="mm"
          onChange={(b) => patch({ b })}
        />
        <NumberInput
          label="Długość L"
          title="Wizualizowany odcinek wzdłuż osi z."
          value={params.length}
          scale={1e-3}
          step={1}
          min={1}
          unit="mm"
          onChange={(length) => patch({ length })}
        />
        <div className="two-columns">
          <NumberInput
            label="εr"
            title="Względna przenikalność elektryczna wypełnienia."
            value={params.epsilonR}
            step={0.1}
            min={0.01}
            onChange={(epsilonR) => patch({ epsilonR })}
          />
          <NumberInput
            label="μr"
            title="Względna przenikalność magnetyczna wypełnienia."
            value={params.muR}
            step={0.1}
            min={0.01}
            onChange={(muR) => patch({ muR })}
          />
        </div>
        <NumberInput
          label="Przewodność σ"
          title="Przewodność objętościowa wypełnienia; nie jest to prąd powierzchniowy ścianek."
          value={params.sigma}
          step={0.001}
          min={0}
          unit="S/m"
          onChange={(sigma) => patch({ sigma })}
        />
      </section>

      <section>
        <h3>Wzbudzenie</h3>
        <NumberInput
          label="Częstotliwość f"
          title="Częstotliwość pracy generatora."
          value={params.frequency}
          scale={1e9}
          step={0.1}
          min={0.01}
          unit="GHz"
          onChange={(frequency) => patch({ frequency })}
        />
        <NumberInput
          label={params.mode === "TE" ? "Amplituda H₀" : "Amplituda E₀"}
          title="Amplituda bazowej składowej wzdłużnej: Hz dla TE lub Ez dla TM."
          value={params.amplitude}
          step={0.1}
          min={0}
          unit={params.mode === "TE" ? "A/m" : "V/m"}
          onChange={(amplitude) => patch({ amplitude })}
        />
        <label className="range-control">
          <span>Faza czasu: {(params.timePhase / Math.PI).toFixed(2)}π</span>
          <input
            type="range"
            min={0}
            max={2 * Math.PI}
            step={0.02}
            value={params.timePhase}
            onChange={(event) => patch({ timePhase: Number(event.target.value) })}
          />
        </label>
        <button
          className={`animation-button ${animate ? "active" : ""}`}
          onClick={() => onAnimate(!animate)}
        >
          <span>{animate ? "Ⅱ" : "▶"}</span>
          {animate ? "Zatrzymaj animację" : "Uruchom animację"}
        </button>
        <NumberInput
          label="Próbki siatki"
          title="Gęstość siatki wizualizacji. Wyższa wartość zwiększa koszt renderowania."
          value={params.samples}
          step={1}
          min={7}
          max={31}
          onChange={(samples) =>
            patch({ samples: Math.max(7, Math.min(31, Math.round(samples))) })
          }
        />
      </section>

      <section>
        <h3>Warstwy</h3>
        <div className="layer-grid">
          {(Object.keys(layers) as (keyof LayerVisibility)[]).map((key) => (
            <label className={`layer-toggle layer-${key}`} key={key}>
              <input
                type="checkbox"
                checked={layers[key]}
                disabled={key === "Jsigma" && params.sigma === 0}
                onChange={() => onLayers({ ...layers, [key]: !layers[key] })}
              />
              <span>{key === "Jsigma" ? "Jσ" : key}</span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3>Przekrój i mapa</h3>
        <div className="segmented compact">
          {(["xy", "xz", "yz"] as const).map((item) => (
            <button
              className={plane === item ? "active" : ""}
              key={item}
              onClick={() => onPlane(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="control">
          <span>Mapa koloru</span>
          <select
            value={scalar}
            onChange={(event) => onScalar(event.target.value as ScalarField)}
          >
            <option value="E">|E|</option>
            <option value="H">|H|</option>
            <option value="Ez">Ez</option>
            <option value="Hz">Hz</option>
            <option value="Sz">Sz chwilowe</option>
          </select>
        </label>
        {plane === "xy" && (
          <label className="range-control">
            <span>z = {(slice.z * 1e3).toFixed(1)} mm</span>
            <input
              type="range"
              min={0}
              max={params.length}
              step={params.length / 100}
              value={slice.z}
              onChange={(event) =>
                onSlice({ ...slice, z: Number(event.target.value) })
              }
            />
          </label>
        )}
        {plane === "xz" && (
          <label className="range-control">
            <span>y = {(slice.y * 1e3).toFixed(1)} mm</span>
            <input
              type="range"
              min={0}
              max={params.b}
              step={params.b / 100}
              value={slice.y}
              onChange={(event) =>
                onSlice({ ...slice, y: Number(event.target.value) })
              }
            />
          </label>
        )}
        {plane === "yz" && (
          <label className="range-control">
            <span>x = {(slice.x * 1e3).toFixed(1)} mm</span>
            <input
              type="range"
              min={0}
              max={params.a}
              step={params.a / 100}
              value={slice.x}
              onChange={(event) =>
                onSlice({ ...slice, x: Number(event.target.value) })
              }
            />
          </label>
        )}
      </section>
    </aside>
  );
}
