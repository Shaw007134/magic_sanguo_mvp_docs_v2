import type { CardRuntimeState } from "../model/card.js";
import type { FormationSnapshot } from "../model/formation.js";
import type { CardControlStatus } from "./status/ControlStatus.js";
import type { StatusEffect } from "./status/StatusEffect.js";

export type CombatSide = "PLAYER" | "ENEMY";
export type MutableCardRuntimeState = {
  -readonly [Key in keyof CardRuntimeState]: CardRuntimeState[Key];
} & {
  controlStatuses?: CardControlStatus[];
};

export interface RuntimeCombatant {
  readonly side: CombatSide;
  readonly formation: FormationSnapshot;
  hp: number;
  armor: number;
  cards: MutableCardRuntimeState[];
  statuses: StatusEffect[];
}
