import type { CardRuntimeState } from "../model/card.js";

export function recoverCooldown(card: CardRuntimeState): CardRuntimeState {
  return {
    ...card,
    cooldownRemainingTicks: card.cooldownRemainingTicks - card.cooldownRecoveryRate
  };
}

export function resetCooldown(card: CardRuntimeState): CardRuntimeState {
  return {
    ...card,
    cooldownRemainingTicks: card.cooldownMaxTicks,
    activationCount: card.activationCount + 1
  };
}

export function isReady(card: CardRuntimeState): boolean {
  return card.cooldownRemainingTicks <= 0;
}
