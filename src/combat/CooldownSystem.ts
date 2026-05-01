import type { CardRuntimeState } from "../model/card.js";
import type { MutableCardRuntimeState } from "./types.js";

export function recoverCooldown<TCard extends CardRuntimeState>(card: TCard): TCard {
  return {
    ...card,
    cooldownRemainingTicks: card.cooldownRemainingTicks - card.cooldownRecoveryRate
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
