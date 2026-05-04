import classBladeTempoJson from "../../../data/cards/class_iron_warlord/blade_tempo.json" with { type: "json" };
import classCommandArmorJson from "../../../data/cards/class_iron_warlord/command_armor.json" with { type: "json" };
import classSiegeFireJson from "../../../data/cards/class_iron_warlord/siege_fire.json" with { type: "json" };
import generalBasicKitJson from "../../../data/cards/general/basic_kit.json" with { type: "json" };
import generalBladeArmorJson from "../../../data/cards/general/blade_armor.json" with { type: "json" };
import generalFireSupportJson from "../../../data/cards/general/fire_support.json" with { type: "json" };
import monsterCardsJson from "../../../data/cards/monster_cards.json" with { type: "json" };
import type { CardDefinition } from "../../model/card.js";

export const GENERAL_CARD_DEFINITIONS = [
  ...generalBasicKitJson,
  ...generalBladeArmorJson,
  ...generalFireSupportJson
] as readonly CardDefinition[];

export const IRON_WARLORD_CARD_DEFINITIONS = [
  ...classBladeTempoJson,
  ...classCommandArmorJson,
  ...classSiegeFireJson
] as readonly CardDefinition[];

export const LEGACY_MVP_CARD_DEFINITIONS = monsterCardsJson as readonly CardDefinition[];

export const ACTIVE_CARD_DEFINITIONS = dedupeById([
  ...LEGACY_MVP_CARD_DEFINITIONS,
  ...GENERAL_CARD_DEFINITIONS,
  ...IRON_WARLORD_CARD_DEFINITIONS
]);

export function getActiveCardDefinitionsById(): ReadonlyMap<string, CardDefinition> {
  return new Map(ACTIVE_CARD_DEFINITIONS.map((card) => [card.id, card]));
}

function dedupeById(cards: readonly CardDefinition[]): readonly CardDefinition[] {
  const byId = new Map<string, CardDefinition>();
  for (const card of cards) {
    byId.set(card.id, card);
  }
  return [...byId.values()];
}
