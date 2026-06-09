import type { FieldKind, SimulationInput } from "./physics";

export interface DisplayOptions {
  field: FieldKind;
  incident: boolean;
  reflected: boolean;
  transmitted: boolean;
  total: boolean;
  envelope: boolean;
}

export interface AppState {
  simulation: SimulationInput;
  display: DisplayOptions;
  phase: number;
  animate: boolean;
}
