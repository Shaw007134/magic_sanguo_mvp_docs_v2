import type { CardDefinition } from "../../model/card.js";
import { formatTicksAsSeconds } from "../../replay/time.js";
import type { RunChoice } from "../../run/RunState.js";
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
      subtitle: "Shop card",
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
    return {
      title: choice.label,
      subtitle: "Event",
      meta: card ? [`Card: ${card.name}`] : [],
      summary: card ? getCardDisplayInfo(card).summary : undefined
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

  if (choice.type === "REWARD_UPGRADE" || choice.type === "LEVEL_UPGRADE") {
    return {
      title: choice.label,
      subtitle: "Upgrade reward",
      meta: [`Upgrade tier: ${choice.fromTier ?? "?"} -> ${choice.toTier ?? "?"}`],
      summary: "Tier upgrade affects run economy/display only in this MVP patch."
    };
  }

  return {
    title: choice.label,
    subtitle: "Reward",
    meta: []
  };
}
