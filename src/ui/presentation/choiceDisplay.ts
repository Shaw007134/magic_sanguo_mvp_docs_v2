import type { CardDefinition } from "../../model/card.js";
import { formatTicksAsSeconds } from "../../replay/time.js";
import type { RunChoice } from "../../run/RunState.js";
import { getRewardCardDefinitionsById } from "../../content/rewards/rewardCards.js";
import { getEnchantmentDefinitionsById } from "../../content/enchantments/enchantments.js";
import { formatEnhancementEffect } from "./rewardCardDisplay.js";
import { getSkillDefinitionsById } from "../../run/skills/skillDefinitions.js";
import { getCardDisplayInfo } from "./cardDisplay.js";

export interface ChoiceDisplayInfo {
  readonly title: string;
  readonly subtitle?: string;
  readonly meta: readonly string[];
  readonly summary?: string;
}

export function getChoiceDisplayInfo(
  choice: RunChoice,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): ChoiceDisplayInfo {
  if (choice.type === "SHOP_CARD") {
    const card = cardDefinitionsById.get(choice.cardDefinitionId);
    if (!card) {
      return {
        title: choice.cardDefinitionId,
        subtitle: "Shop card",
        meta: [`Price: ${choice.cost}`]
      };
    }
    const display = getCardDisplayInfo(card);
    return {
      title: display.name,
      subtitle: "Buy Card",
      meta: [
        display.typeLabel,
        display.tier,
        `Size ${display.size}`,
        ...(display.cooldown !== undefined ? [`Cooldown ${formatTicksAsSeconds(display.cooldown)}`] : []),
        `Price: ${choice.cost}`
      ],
      summary: display.summary
    };
  }

  if (choice.type === "EVENT_CARD") {
    const card = choice.cardDefinitionId ? cardDefinitionsById.get(choice.cardDefinitionId) : undefined;
    if (card) {
      const display = getCardDisplayInfo(card);
      return {
        title: display.name,
        subtitle: "Event card",
        meta: [
          display.typeLabel,
          display.tier,
          `Size ${display.size}`,
          ...(display.cooldown !== undefined ? [`Cooldown ${formatTicksAsSeconds(display.cooldown)}`] : [])
        ],
        summary: display.summary
      };
    }
    return {
      title: choice.label,
      subtitle: "Event",
      meta: []
    };
  }

  if (choice.type === "EVENT_GOLD") {
    return {
      title: choice.label,
      subtitle: "Event",
      meta: [`Gold: ${choice.gold ?? 0}`]
    };
  }

  if (choice.type === "EVENT_HEAL") {
    return {
      title: choice.label,
      subtitle: "Event",
      meta: [`Heal: ${choice.heal ?? 0} HP`]
    };
  }

  if (choice.type === "EVENT_ENCHANTMENT") {
    const enchantment = choice.enchantmentDefinitionId
      ? getEnchantmentDefinitionsById().get(choice.enchantmentDefinitionId)
      : undefined;
    return {
      title: enchantment?.name ?? choice.label,
      subtitle: "Enchantment study",
      meta: enchantment ? [enchantment.tier, enchantment.type, formatTargetRule(enchantment.targetRule)] : [],
      summary: choice.description ?? enchantment?.description
    };
  }

  if (choice.type === "REWARD_CARD" || choice.type === "LEVEL_CARD") {
    const card = choice.cardDefinitionId ? cardDefinitionsById.get(choice.cardDefinitionId) : undefined;
    if (!card) {
      return {
        title: choice.label,
        subtitle: "Card reward",
        meta: []
      };
    }
    const display = getCardDisplayInfo(card);
    return {
      title: choice.label,
      subtitle: "Card reward",
      meta: [
        display.name,
        display.typeLabel,
        display.tier,
        `Size ${display.size}`,
        ...(display.cooldown !== undefined ? [`Cooldown ${formatTicksAsSeconds(display.cooldown)}`] : [])
      ],
      summary: display.summary
    };
  }

  if (choice.type === "REWARD_GOLD" || choice.type === "LEVEL_GOLD") {
    return {
      title: choice.label,
      subtitle: "Gold reward",
      meta: [`Gold: ${choice.gold ?? 0}`]
    };
  }

  if (choice.type === "REWARD_LOOT_CARD") {
    const rewardCard = choice.rewardCardDefinitionId
      ? getRewardCardDefinitionsById().get(choice.rewardCardDefinitionId)
      : undefined;
    if (!rewardCard) {
      return {
        title: choice.label,
        subtitle: "Loot reward",
        meta: []
      };
    }
    return {
      title: rewardCard.name,
      subtitle: "Loot reward",
      meta: [
        `${rewardCard.tier.charAt(0)}${rewardCard.tier.slice(1).toLowerCase()}`,
        `Sell: ${rewardCard.sellGold} gold`
      ],
      summary: rewardCard.rewardCardType === "GOLD_ONLY"
        ? `Sell: gain ${rewardCard.sellGold} gold.`
        : formatEnhancementEffect(rewardCard)
    };
  }

  if (choice.type === "REWARD_SKILL" || choice.type === "LEVEL_SKILL") {
    const skill = choice.skillDefinitionId ? getSkillDefinitionsById().get(choice.skillDefinitionId) : undefined;
    return {
      title: skill ? choice.label : choice.label,
      subtitle: "Learn Skill",
      meta: skill ? [skill.name, skill.tier] : [],
      summary: skill?.description
    };
  }

  if (choice.type === "REWARD_UPGRADE" || choice.type === "LEVEL_UPGRADE") {
    return {
      title: choice.label,
      subtitle: "Upgrade reward",
      meta: [`Upgrade tier: ${choice.fromTier ?? "?"} -> ${choice.toTier ?? "?"}`],
      summary: choice.preview
    };
  }

  return {
    title: choice.label,
    subtitle: "Reward",
    meta: []
  };
}

function formatTargetRule(targetRule: string): string {
  return targetRule
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}
