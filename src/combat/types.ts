import type { CardRuntimeState } from "../model/card.js";
import type { FormationSnapshot } from "../model/formation.js";

export type CombatSide = "PLAYER" | "ENEMY";
export type MutableCardRuntimeState = {
  -readonly [Key in keyof CardRuntimeState]: CardRuntimeState[Key];
};

export interface RuntimeCombatant {
  readonly side: CombatSide;
  readonly formation: FormationSnapshot;
  hp: number;
  armor: number;
  cards: MutableCardRuntimeState[];
}
