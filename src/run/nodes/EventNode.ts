import type { CardDefinition } from "../../model/card.js";
import {
  filterKnownCards,
  getShopPoolForLevel,
  STARTER_EVENT_POOL
} from "../../content/cards/contentPools.js";
import { shuffleDeterministic } from "../deterministic.js";
import type { EventChoice } from "../RunState.js";

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

  const choices: EventChoice[] = [
    {
      id: `event-${input.nodeIndex}-card-0`,
      type: "EVENT_CARD",
      label: `Take ${getCardName(cardIds[0] ?? "rusty-blade", input.cardDefinitionsById)}`,
      cardDefinitionId: cardIds[0] ?? "rusty-blade"
    },
    {
      id: `event-${input.nodeIndex}-card-1`,
      type: "EVENT_CARD",
      label: `Take ${getCardName(cardIds[1] ?? "wooden-shield", input.cardDefinitionsById)}`,
      cardDefinitionId: cardIds[1] ?? "wooden-shield"
    },
    {
      id: `event-${input.nodeIndex}-gold`,
      type: "EVENT_GOLD",
      label: `Take ${gold} gold`,
      gold
    },
    {
      id: `event-${input.nodeIndex}-heal`,
      type: "EVENT_HEAL",
      label: `Rest for ${heal} HP`,
      heal
    }
  ];
  return choices.slice(0, 3);
}

function getCardName(cardId: string, cardDefinitionsById?: ReadonlyMap<string, CardDefinition>): string {
  return cardDefinitionsById?.get(cardId)?.name ?? cardId;
}
