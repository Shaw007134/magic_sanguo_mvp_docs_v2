import type { CardDefinition, CardInstance } from "../../model/card.js";
import type { RewardCardDefinition } from "../../model/rewardCard.js";
import type { RunFormationSlot } from "../../run/RunState.js";

export interface RewardCardDisplayInfo {
  readonly title: string;
  readonly meta: readonly string[];
  readonly summary: string;
  readonly targetLine?: string;
  readonly valid: boolean;
  readonly invalidReason?: string;
}

export function getRewardCardDisplayInfo(input: {
  readonly rewardCard: RewardCardDefinition;
  readonly formationSlots: readonly RunFormationSlot[];
  readonly ownedCards: readonly CardInstance[];
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
}): RewardCardDisplayInfo {
  const { rewardCard } = input;
  if (rewardCard.rewardCardType === "GOLD_ONLY") {
    return {
      title: rewardCard.name,
      meta: [formatTier(rewardCard.tier), "Loot", `Sell: ${rewardCard.sellGold} gold`],
      summary: `Sell: gain ${rewardCard.sellGold} gold.`,
      valid: true
    };
  }

  const target = findLeftmostActiveTarget(input);
  const requirement = getRequirementLine(rewardCard);
  if (!target) {
    return {
      title: rewardCard.name,
      meta: [formatTier(rewardCard.tier), "Loot", `Sell: ${rewardCard.sellGold} gold`],
      summary: `${formatEnhancementEffect(rewardCard)} ${requirement}`,
      targetLine: "Current target: none. Place an active card in formation before selling.",
      valid: false,
      invalidReason: "No active card is placed in formation."
    };
  }
  const valid = isRewardCardTargetValid(rewardCard, target.definition);
  return {
    title: rewardCard.name,
    meta: [formatTier(rewardCard.tier), "Loot", `Sell: ${rewardCard.sellGold} gold`],
    summary: `${formatEnhancementEffect(rewardCard)} ${requirement}`,
    targetLine: valid
      ? `Current target: ${target.definition.name}.`
      : `Current target: ${target.definition.name} is invalid. ${getInvalidTargetInstruction(rewardCard)}`,
    valid,
    invalidReason: valid ? undefined : getInvalidTargetReason(rewardCard, target.definition)
  };
}

export function formatEnhancementEffect(rewardCard: RewardCardDefinition): string {
  switch (rewardCard.enhancementType) {
    case "INCREASE_LEFTMOST_DAMAGE":
      return `Sell: gain ${rewardCard.sellGold} gold and give the leftmost active card +${rewardCard.amount ?? 0} direct damage.`;
    case "INCREASE_LEFTMOST_BURN":
      return `Sell: gain ${rewardCard.sellGold} gold and give the leftmost active Burn card +${rewardCard.amount ?? 0} Burn.`;
    case "INCREASE_LEFTMOST_POISON":
      return `Sell: gain ${rewardCard.sellGold} gold and give the leftmost active Poison card +${rewardCard.amount ?? 0} Poison.`;
    case "REDUCE_LEFTMOST_COOLDOWN_PERCENT":
      return `Sell: gain ${rewardCard.sellGold} gold and reduce the leftmost active card's cooldown by ${rewardCard.percent ?? 0}%.`;
    default:
      return `Sell: gain ${rewardCard.sellGold} gold.`;
  }
}

function getRequirementLine(rewardCard: RewardCardDefinition): string {
  switch (rewardCard.enhancementType) {
    case "INCREASE_LEFTMOST_BURN":
      return "Only works if that card already applies Burn.";
    case "INCREASE_LEFTMOST_POISON":
      return "Only works if that card already applies Poison.";
    case "INCREASE_LEFTMOST_DAMAGE":
      return "Only works if that card already deals direct damage.";
    case "REDUCE_LEFTMOST_COOLDOWN_PERCENT":
      return "Cooldown reduction is capped at 40% total and cannot go below 0.5 seconds.";
    default:
      return "";
  }
}

function findLeftmostActiveTarget(input: {
  readonly formationSlots: readonly RunFormationSlot[];
  readonly ownedCards: readonly CardInstance[];
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
}): { readonly card: CardInstance; readonly definition: CardDefinition } | undefined {
  const cardsById = new Map(input.ownedCards.map((card) => [card.instanceId, card]));
  for (const slot of [...input.formationSlots].sort((left, right) => left.slotIndex - right.slotIndex)) {
    if (!slot.cardInstanceId) {
      continue;
    }
    const card = cardsById.get(slot.cardInstanceId);
    const definition = card ? input.cardDefinitionsById.get(card.definitionId) : undefined;
    if (card && definition?.type === "ACTIVE") {
      return { card, definition };
    }
  }
  return undefined;
}

function isRewardCardTargetValid(rewardCard: RewardCardDefinition, target: CardDefinition): boolean {
  switch (rewardCard.enhancementType) {
    case "INCREASE_LEFTMOST_DAMAGE":
      return target.effects?.some((effect) => effect["command"] === "DealDamage" && typeof effect["amount"] === "number") === true;
    case "INCREASE_LEFTMOST_BURN":
      return target.effects?.some((effect) => effect["command"] === "ApplyBurn" && typeof effect["amount"] === "number") === true;
    case "INCREASE_LEFTMOST_POISON":
      return target.effects?.some((effect) => effect["command"] === "ApplyPoison" && typeof effect["amount"] === "number") === true;
    case "REDUCE_LEFTMOST_COOLDOWN_PERCENT":
      return target.cooldownTicks !== undefined;
    default:
      return true;
  }
}

function getInvalidTargetReason(rewardCard: RewardCardDefinition, target: CardDefinition): string {
  switch (rewardCard.enhancementType) {
    case "INCREASE_LEFTMOST_DAMAGE":
      return `${target.name} does not deal direct damage.`;
    case "INCREASE_LEFTMOST_BURN":
      return `${target.name} does not apply Burn.`;
    case "INCREASE_LEFTMOST_POISON":
      return `${target.name} does not apply Poison.`;
    case "REDUCE_LEFTMOST_COOLDOWN_PERCENT":
      return `${target.name} has no cooldown.`;
    default:
      return `${target.name} is not a valid target.`;
  }
}

function getInvalidTargetInstruction(rewardCard: RewardCardDefinition): string {
  switch (rewardCard.enhancementType) {
    case "INCREASE_LEFTMOST_BURN":
      return "Move a Burn card to the leftmost active slot before selling.";
    case "INCREASE_LEFTMOST_POISON":
      return "Move a Poison card to the leftmost active slot before selling.";
    case "INCREASE_LEFTMOST_DAMAGE":
      return "Move a damage card to the leftmost active slot before selling.";
    case "REDUCE_LEFTMOST_COOLDOWN_PERCENT":
      return "Move an active card with a cooldown to the leftmost active slot before selling.";
    default:
      return "Move a valid card to the leftmost active slot before selling.";
  }
}

function formatTier(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}
