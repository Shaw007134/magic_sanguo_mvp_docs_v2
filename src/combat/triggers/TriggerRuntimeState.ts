import type { CardDefinition } from "../../model/card.js";
import type { MutableCardRuntimeState, RuntimeCombatant } from "../types.js";
import type { PassiveTriggerDefinition } from "./TriggerDefinition.js";

export interface TriggerRuntimeState {
  readonly id: string;
  readonly ownerCombatant: RuntimeCombatant;
  readonly sourceCard: MutableCardRuntimeState;
  readonly sourceCardDefinition: CardDefinition;
  readonly trigger: PassiveTriggerDefinition;
  lastTriggeredTick?: number;
  triggersThisTick: number;
  currentTick?: number;
}
