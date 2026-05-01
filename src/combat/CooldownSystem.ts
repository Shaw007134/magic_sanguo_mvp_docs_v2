import type { CardRuntimeState } from "../model/card.js";
import type { CardDefinition } from "../model/card.js";
import type { ModifierSystem } from "./modifiers/ModifierSystem.js";
import type { MutableCardRuntimeState } from "./types.js";
import type { RuntimeCombatant } from "./types.js";

export interface CooldownRecoveryContext {
  readonly tick?: number;
  readonly sourceCardDefinition?: CardDefinition;
  readonly sourceCombatant?: RuntimeCombatant;
  readonly combatants?: readonly RuntimeCombatant[];
  readonly modifierSystem?: ModifierSystem;
}

export function recoverCooldown<TCard extends CardRuntimeState>(card: TCard, context: CooldownRecoveryContext = {}): TCard {
  const recoveryRate = context.modifierSystem
    ? context.modifierSystem.applyCooldownRecoveryModifiers(card.cooldownRecoveryRate, {
        tick: context.tick ?? 0,
        sourceCard: card,
        sourceCardDefinition: context.sourceCardDefinition,
        sourceCombatant: context.sourceCombatant,
        combatants: context.combatants ?? []
      })
    : card.cooldownRecoveryRate;

  return {
    ...card,
    cooldownRemainingTicks: card.cooldownRemainingTicks - recoveryRate
  };
}

export function resetCooldown(card: MutableCardRuntimeState): MutableCardRuntimeState {
  return {
    ...card,
    cooldownRemainingTicks: card.cooldownMaxTicks,
    activationCount: card.activationCount + 1
  };
}

export function isReady(card: CardRuntimeState): boolean {
  return card.cooldownRemainingTicks <= 0;
}
