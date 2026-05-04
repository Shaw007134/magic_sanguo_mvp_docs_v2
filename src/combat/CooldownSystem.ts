import type { CardRuntimeState } from "../model/card.js";
import type { CardDefinition } from "../model/card.js";
import type { ModifierSystem } from "./modifiers/ModifierSystem.js";
import type { MutableCardRuntimeState } from "./types.js";
import type { RuntimeCombatant } from "./types.js";
import type { CardControlStatus } from "./status/ControlStatus.js";

export interface CooldownRecoveryContext {
  readonly tick?: number;
  readonly sourceCardDefinition?: CardDefinition;
  readonly sourceCombatant?: RuntimeCombatant;
  readonly combatants?: readonly RuntimeCombatant[];
  readonly modifierSystem?: ModifierSystem;
}

export function recoverCooldown<TCard extends CardRuntimeState>(card: TCard, context: CooldownRecoveryContext = {}): TCard {
  const modifiedRecoveryRate = context.modifierSystem
    ? context.modifierSystem.applyCooldownRecoveryModifiers(card.cooldownRecoveryRate, {
        tick: context.tick ?? 0,
        sourceCard: card,
        sourceCardDefinition: context.sourceCardDefinition,
        sourceCombatant: context.sourceCombatant,
        combatants: context.combatants ?? []
      })
    : card.cooldownRecoveryRate;
  const recoveryRate = applyControlStatusRecoveryModifiers(modifiedRecoveryRate, card, context.tick ?? 0);

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

export function isFrozen(card: CardRuntimeState, tick: number): boolean {
  return getActiveControlStatuses(card, tick).some((status) => status.kind === "FREEZE");
}

function applyControlStatusRecoveryModifiers<TCard extends CardRuntimeState>(
  baseRecoveryRate: number,
  card: TCard,
  tick: number
): number {
  const activeStatuses = getActiveControlStatuses(card, tick);
  if (activeStatuses.some((status) => status.kind === "FREEZE")) {
    return 0;
  }
  const hastePercent = Math.min(100, sumPercent(activeStatuses, "HASTE"));
  const slowPercent = Math.min(75, sumPercent(activeStatuses, "SLOW"));
  const multiplier = Math.max(0.25, Math.min(2, 1 + hastePercent / 100 - slowPercent / 100));
  return baseRecoveryRate * multiplier;
}

function getActiveControlStatuses<TCard extends CardRuntimeState>(
  card: TCard,
  tick: number
): readonly CardControlStatus[] {
  const statuses = (card as TCard & { readonly controlStatuses?: readonly CardControlStatus[] }).controlStatuses ?? [];
  return statuses.filter((status) => tick <= status.expiresAtTick);
}

function sumPercent(
  statuses: readonly CardControlStatus[],
  kind: CardControlStatus["kind"]
): number {
  return statuses
    .filter((status) => status.kind === kind)
    .reduce((total, status) => total + Math.max(0, status.percent ?? 0), 0);
}
