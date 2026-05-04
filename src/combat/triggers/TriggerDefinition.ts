import type { EffectDefinition } from "../../model/card.js";

export type TriggerHook =
  | "OnCombatStart"
  | "OnCardActivated"
  | "OnDamageDealt"
  | "OnDamageTaken"
  | "OnStatusApplied"
  | "OnStatusTicked"
  | "OnBurnTick"
  | "OnHealReceived"
  | "OnCooldownModified"
  | "OnCombatEnd";

export interface TriggerConditionDefinition {
  readonly status?: "Burn" | "Poison";
  readonly appliedByOwner?: boolean;
  readonly sourceHasTag?: string;
  readonly cardIsAdjacent?: boolean;
  readonly targetHasStatus?: "Burn" | "Poison";
  readonly ownerHasStatus?: "Burn" | "Poison";
  readonly healedAmountAtLeast?: number;
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
