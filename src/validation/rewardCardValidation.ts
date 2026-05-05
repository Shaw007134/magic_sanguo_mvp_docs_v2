import { CARD_TIERS } from "../model/card.js";
import {
  REWARD_CARD_ENHANCEMENT_TYPES,
  REWARD_CARD_TARGET_RULES,
  REWARD_CARD_TYPES,
  type RewardCardDefinition
} from "../model/rewardCard.js";
import { createValidationResult, type ValidationIssue, type ValidationResult } from "./validationResult.js";

export function validateRewardCardDefinition(rewardCard: RewardCardDefinition): ValidationResult {
  const errors: ValidationIssue[] = [];

  if (rewardCard.id.trim().length === 0) {
    errors.push({ path: "id", message: "Reward card id must be non-empty." });
  }
  if (rewardCard.name.trim().length === 0) {
    errors.push({ path: "name", message: "Reward card name must be non-empty." });
  }
  if (!CARD_TIERS.includes(rewardCard.tier)) {
    errors.push({ path: "tier", message: `Reward card tier must be one of: ${CARD_TIERS.join(", ")}.` });
  }
  if (!REWARD_CARD_TYPES.includes(rewardCard.rewardCardType)) {
    errors.push({ path: "rewardCardType", message: `Reward card type must be one of: ${REWARD_CARD_TYPES.join(", ")}.` });
  }
  if (!Number.isInteger(rewardCard.sellGold) || rewardCard.sellGold < 0) {
    errors.push({ path: "sellGold", message: "sellGold must be a non-negative integer." });
  }
  if (rewardCard.description.trim().length === 0) {
    errors.push({ path: "description", message: "Reward card description must be non-empty." });
  }
  if (!Array.isArray(rewardCard.tags) || rewardCard.tags.length === 0 || rewardCard.tags.some((tag) => tag.trim().length === 0)) {
    errors.push({ path: "tags", message: "Reward card tags must be non-empty strings." });
  }

  if (rewardCard.rewardCardType === "GOLD_ONLY") {
    if (rewardCard.enhancementType !== undefined || rewardCard.targetRule !== undefined || rewardCard.amount !== undefined || rewardCard.percent !== undefined) {
      errors.push({ path: "enhancementType", message: "GOLD_ONLY reward cards must not define enhancement fields." });
    }
  }

  if (rewardCard.rewardCardType === "SELL_TRIGGER_ENHANCEMENT") {
    if (!rewardCard.enhancementType || !REWARD_CARD_ENHANCEMENT_TYPES.includes(rewardCard.enhancementType)) {
      errors.push({ path: "enhancementType", message: "Enhancement reward card enhancementType is invalid." });
    }
    if (!rewardCard.targetRule || !REWARD_CARD_TARGET_RULES.includes(rewardCard.targetRule)) {
      errors.push({ path: "targetRule", message: "Enhancement reward card targetRule is invalid." });
    }
    const usesPercent = rewardCard.enhancementType === "REDUCE_LEFTMOST_COOLDOWN_PERCENT";
    if (usesPercent) {
      if (typeof rewardCard.percent !== "number" || rewardCard.percent <= 0 || rewardCard.percent > 10) {
        errors.push({ path: "percent", message: "Cooldown enhancement percent must be > 0 and <= 10." });
      }
      if (rewardCard.amount !== undefined) {
        errors.push({ path: "amount", message: "Cooldown enhancement reward cards must not define amount." });
      }
    } else {
      if (!Number.isInteger(rewardCard.amount) || (rewardCard.amount ?? 0) <= 0 || (rewardCard.amount ?? 0) > 3) {
        errors.push({ path: "amount", message: "Flat enhancement amount must be an integer from 1 to 3." });
      }
      if (rewardCard.percent !== undefined) {
        errors.push({ path: "percent", message: "Flat enhancement reward cards must not define percent." });
      }
    }
  }

  return createValidationResult(errors);
}
