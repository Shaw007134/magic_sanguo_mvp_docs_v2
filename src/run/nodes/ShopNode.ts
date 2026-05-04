import type { CardDefinition } from "../../model/card.js";
import { shuffleDeterministic } from "../deterministic.js";
import { RUN_SELL_PRICES } from "../economy.js";
import type { ShopChoice } from "../RunState.js";

const STARTER_SHOP_CARDS = ["rusty-blade", "wooden-shield", "oil-flask"] as const;

export function createShopChoices(input: {
  readonly seed: string;
  readonly nodeIndex: number;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly starter?: boolean;
}): readonly ShopChoice[] {
  const cardIds = input.starter
    ? STARTER_SHOP_CARDS.filter((cardId) => input.cardDefinitionsById.has(cardId))
    : shuffleDeterministic([...input.cardDefinitionsById.keys()], `${input.seed}:shop:${input.nodeIndex}`).slice(0, 3);

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
