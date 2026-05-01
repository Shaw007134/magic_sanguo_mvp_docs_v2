import type { RunState } from "../../run/RunState.js";

export interface RunStatusDisplayItem {
  readonly label: string;
  readonly value: string;
}

export function getRunStatusDisplayItems(state: Pick<RunState, "gold" | "level" | "exp" | "expToNextLevel" | "currentHp" | "maxHp">): readonly RunStatusDisplayItem[] {
  return [
    { label: "Gold", value: String(state.gold) },
    { label: "Level", value: String(state.level) },
    { label: "EXP", value: `${state.exp} / ${state.expToNextLevel}` },
    { label: "HP", value: `${state.currentHp} / ${state.maxHp}` }
  ];
}
