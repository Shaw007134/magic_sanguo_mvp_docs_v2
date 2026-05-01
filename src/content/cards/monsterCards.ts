import monsterCardsJson from "../../../data/cards/monster_cards.json" with { type: "json" };
import type { CardDefinition } from "../../model/card.js";

export const MONSTER_CARD_DEFINITIONS = monsterCardsJson as readonly CardDefinition[];

export function getMonsterCardDefinitionsById(): ReadonlyMap<string, CardDefinition> {
  return new Map(MONSTER_CARD_DEFINITIONS.map((card) => [card.id, card]));
}
