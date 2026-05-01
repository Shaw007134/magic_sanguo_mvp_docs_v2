import type { RunState } from "../../run/RunState.js";
import { getRunStatusDisplayItems } from "../presentation/runStatusDisplay.js";

export interface RunStatusBarProps {
  readonly state: RunState;
}

export function RunStatusBar({ state }: RunStatusBarProps) {
  return (
    <dl className="run-status-bar" aria-label="Run status">
      {getRunStatusDisplayItems(state).map((item) => (
        <div className="run-status-item" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
