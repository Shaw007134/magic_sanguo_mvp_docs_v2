import rewardCardsJson from "../../../data/rewards/reward_cards.json" with { type: "json" };
import type { RewardCardDefinition } from "../../model/rewardCard.js";

export const REWARD_CARD_DEFINITIONS = rewardCardsJson as readonly RewardCardDefinition[];

export function getRewardCardDefinitionsById(): ReadonlyMap<string, RewardCardDefinition> {
  return new Map(REWARD_CARD_DEFINITIONS.map((rewardCard) => [rewardCard.id, rewardCard]));
}

export function getRewardCardDefinition(rewardCardDefinitionId: string): RewardCardDefinition | undefined {
  return getRewardCardDefinitionsById().get(rewardCardDefinitionId);
}
