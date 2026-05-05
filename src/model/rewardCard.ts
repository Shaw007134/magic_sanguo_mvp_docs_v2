import type { CardTier } from "./card.js";

export const REWARD_CARD_TYPES = ["GOLD_ONLY", "SELL_TRIGGER_ENHANCEMENT"] as const;
export const REWARD_CARD_ENHANCEMENT_TYPES = [
  "INCREASE_LEFTMOST_DAMAGE",
  "INCREASE_LEFTMOST_BURN",
  "INCREASE_LEFTMOST_POISON",
  "REDUCE_LEFTMOST_COOLDOWN_PERCENT"
] as const;
export const REWARD_CARD_TARGET_RULES = ["LEFTMOST_FORMATION_ACTIVE_CARD"] as const;

export type RewardCardType = (typeof REWARD_CARD_TYPES)[number];
export type RewardCardEnhancementType = (typeof REWARD_CARD_ENHANCEMENT_TYPES)[number];
export type RewardCardTargetRule = (typeof REWARD_CARD_TARGET_RULES)[number];

export interface RewardCardDefinition {
  readonly id: string;
  readonly name: string;
  readonly tier: CardTier;
  readonly rewardCardType: RewardCardType;
  readonly sellGold: number;
  readonly enhancementType?: RewardCardEnhancementType;
  readonly targetRule?: RewardCardTargetRule;
  readonly amount?: number;
  readonly percent?: number;
  readonly description: string;
  readonly tags: readonly string[];
}

export interface RewardCardInstance {
  readonly instanceId: string;
  readonly definitionId: string;
}
