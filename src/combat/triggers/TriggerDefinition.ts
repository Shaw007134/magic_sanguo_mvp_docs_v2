import type { EffectDefinition } from "../../model/card.js";

export type TriggerHook =
  | "OnCombatStart"
  | "OnCardActivated"
  | "OnDamageDealt"
  | "OnDamageTaken"
  | "OnStatusApplied"
  | "OnBurnTick"
  | "OnCooldownModified"
  | "OnCombatEnd";

export interface TriggerConditionDefinition {
  readonly status?: "Burn";
  readonly appliedByOwner?: boolean;
  readonly sourceHasTag?: string;
  readonly cardIsAdjacent?: boolean;
  readonly ownerHpBelowPercent?: number;
  readonly targetHpBelowPercent?: number;
}

export interface PassiveTriggerDefinition {
  readonly hook: TriggerHook;
  readonly conditions?: TriggerConditionDefinition;
  readonly internalCooldownTicks?: number;
  readonly maxTriggersPerTick?: number;
  readonly effects?: readonly EffectDefinition[];
}
