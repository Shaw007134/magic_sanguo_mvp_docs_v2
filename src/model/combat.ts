import type { CardRuntimeState } from "./card.js";
import type { FormationSnapshot } from "./formation.js";

export interface CombatantState {
  readonly id: string;
  readonly snapshot: FormationSnapshot;
  readonly hp: number;
  readonly maxHp: number;
  readonly armor: number;
  readonly cards: readonly CardRuntimeState[];
}

export interface CombatState {
  readonly tick: number;
  readonly player: CombatantState;
  readonly enemy: CombatantState;
  readonly maxCombatTicks: number;
}
