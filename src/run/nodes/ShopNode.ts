import type { CardDefinition } from "../../model/card.js";
import {
  filterKnownCards,
  getShopPoolForLevel,
  STARTER_SHOP_POOL
} from "../../content/cards/contentPools.js";
import { shuffleDeterministic } from "../deterministic.js";
import { RUN_SELL_PRICES } from "../economy.js";
import type { ShopChoice } from "../RunState.js";

export function createShopChoices(input: {
  readonly seed: string;
  readonly nodeIndex: number;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly level?: number;
  readonly starter?: boolean;
}): readonly ShopChoice[] {
  const level = input.level ?? 1;
  const cardIds = input.starter
    ? filterKnownCards(STARTER_SHOP_POOL, input.cardDefinitionsById)
    : shuffleDeterministic(
        filterKnownCards(getShopPoolForLevel(level), input.cardDefinitionsById),
        `${input.seed}:shop:${input.nodeIndex}:level:${level}`
      ).slice(0, 3);

  return cardIds.map((cardDefinitionId, index) => {
    const card = input.cardDefinitionsById.get(cardDefinitionId);
    const tierPrice = card ? RUN_SELL_PRICES[card.tier] : 1;
    return {
      id: `shop-${input.nodeIndex}-${index}`,
      type: "SHOP_CARD",
      cardDefinitionId,
      cost: input.starter && index === 0 ? 0 : tierPrice
    };
  });
}
