import type { CardDefinition } from "../../model/card.js";
import {
  filterKnownCards,
  getShopPoolForLevel,
  STARTER_EVENT_POOL
} from "../../content/cards/contentPools.js";
import { shuffleDeterministic } from "../deterministic.js";
import type { EventChoice } from "../RunState.js";
import { materializeEventChoices, selectEventTemplate } from "./EventGenerator.js";

export function createEventChoices(input: {
  readonly seed: string;
  readonly nodeIndex: number;
  readonly cardDefinitionsById?: ReadonlyMap<string, CardDefinition>;
  readonly level?: number;
  readonly starter?: boolean;
}): readonly EventChoice[] {
  const level = input.level ?? 1;
  const cardPool = input.starter ? STARTER_EVENT_POOL : getShopPoolForLevel(level);
  const availableCardChoices = input.cardDefinitionsById
    ? filterKnownCards(cardPool, input.cardDefinitionsById)
    : cardPool;
  const cardIds = input.starter
    ? availableCardChoices
    : shuffleDeterministic(availableCardChoices, `${input.seed}:event:${input.nodeIndex}:level:${level}`);
  const gold = level >= 8 ? 7 : level >= 5 ? 5 : 3;
  const heal = level >= 8 ? 14 : level >= 5 ? 10 : 8;
  const template = selectEventTemplate({
    seed: input.seed,
    nodeIndex: input.nodeIndex,
    level,
    starter: input.starter
  });

  return materializeEventChoices({
    template,
    nodeIndex: input.nodeIndex,
    cardIds,
    gold,
    heal,
    cardDefinitionsById: input.cardDefinitionsById
  });
}
