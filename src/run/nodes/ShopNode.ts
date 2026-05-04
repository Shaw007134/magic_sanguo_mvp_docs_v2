import type { CardDefinition } from "../../model/card.js";
import {
  filterKnownCards,
  getShopPoolForLevel,
  isHighQualityShopCard,
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
    : selectShopCardIds({
        seed: input.seed,
        nodeIndex: input.nodeIndex,
        level,
        cardDefinitionsById: input.cardDefinitionsById
      });

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

function selectShopCardIds(input: {
  readonly seed: string;
  readonly nodeIndex: number;
  readonly level: number;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
}): readonly string[] {
  const pool = filterKnownCards(getShopPoolForLevel(input.level), input.cardDefinitionsById);
  const shuffled = shuffleDeterministic(
    pool,
    `${input.seed}:shop:${input.nodeIndex}:level:${input.level}`
  );
  const selected = shuffled.slice(0, 3);
  if (input.level < 8 || selected.some(isHighQualityShopCard)) {
    return selected;
  }

  const anchor = shuffled.find((cardId) => isHighQualityShopCard(cardId) && !selected.includes(cardId));
  if (!anchor) {
    return selected;
  }
  return [selected[0], selected[1], anchor].filter((cardId): cardId is string => cardId !== undefined);
}
