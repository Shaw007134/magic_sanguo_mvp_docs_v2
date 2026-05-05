import type { CardDefinition } from "../../model/card.js";
import type { EnchantmentDefinition } from "../../model/enchantment.js";
import { getEnchantmentDefinitionsById } from "../../content/enchantments/enchantments.js";
import { createSeededRandom } from "../deterministic.js";
import type { EventChoice } from "../RunState.js";

export type EventTemplateTag = "starter" | "card" | "economy" | "healing" | "enchantment" | "bronze" | "intro";

export type EventTemplateChoice =
  | { readonly type: "CARD"; readonly poolIndex: number }
  | { readonly type: "GOLD" }
  | { readonly type: "HEAL" }
  | { readonly type: "ENCHANTMENT"; readonly enchantmentDefinitionId: string };

export interface EventTemplate {
  readonly id: string;
  readonly name: string;
  readonly minLevel: number;
  readonly maxLevel?: number;
  readonly weight: number;
  readonly tags: readonly EventTemplateTag[];
  readonly choices: readonly EventTemplateChoice[];
}

export const BASIC_EVENT_TEMPLATE: EventTemplate = {
  id: "supply-cache",
  name: "Supply Cache",
  minLevel: 1,
  weight: 100,
  tags: ["card", "economy", "healing"],
  choices: [
    { type: "CARD", poolIndex: 0 },
    { type: "CARD", poolIndex: 1 },
    { type: "GOLD" },
    { type: "HEAL" }
  ]
};

export const STARTER_EVENT_TEMPLATE: EventTemplate = {
  ...BASIC_EVENT_TEMPLATE,
  id: "starter-supply-cache",
  name: "Starter Supply Cache",
  tags: ["starter", "card", "economy", "healing"]
};

export const BRONZE_ENCHANTMENT_INTRO_TEMPLATE: EventTemplate = {
  id: "bronze-enchantment-intro",
  name: "Bronze Enchantment Intro",
  minLevel: 4,
  weight: 35,
  tags: ["enchantment", "bronze", "intro"],
  choices: [
    { type: "ENCHANTMENT", enchantmentDefinitionId: "bronze-iron-edge" },
    { type: "ENCHANTMENT", enchantmentDefinitionId: "bronze-flame-spark" },
    { type: "ENCHANTMENT", enchantmentDefinitionId: "bronze-vital-thread" }
  ]
};

export const EVENT_TEMPLATES = [
  BASIC_EVENT_TEMPLATE,
  BRONZE_ENCHANTMENT_INTRO_TEMPLATE
] as const satisfies readonly EventTemplate[];

export function getEventPoolForLevel(input: {
  readonly level: number;
  readonly starter?: boolean;
  readonly includeEnchantmentEvents?: boolean;
}): readonly EventTemplate[] {
  if (input.starter) {
    return [STARTER_EVENT_TEMPLATE];
  }
  return EVENT_TEMPLATES.filter((template) => {
    if (template.minLevel > input.level) return false;
    if (template.maxLevel !== undefined && template.maxLevel < input.level) return false;
    if (template.tags.includes("enchantment") && !input.includeEnchantmentEvents) return false;
    return true;
  });
}

export function selectEventTemplate(input: {
  readonly seed: string;
  readonly nodeIndex: number;
  readonly level: number;
  readonly starter?: boolean;
}): EventTemplate {
  if (input.starter) {
    return STARTER_EVENT_TEMPLATE;
  }
  if (shouldForceBronzeEnchantmentIntro(input)) {
    return BRONZE_ENCHANTMENT_INTRO_TEMPLATE;
  }
  const pool = getEventPoolForLevel({
    level: input.level,
    includeEnchantmentEvents: input.level >= 7
  });
  return pickWeighted(pool.length > 0 ? pool : [BASIC_EVENT_TEMPLATE], `${input.seed}:event-template:${input.nodeIndex}:level:${input.level}`);
}

export function materializeEventChoices(input: {
  readonly template: EventTemplate;
  readonly nodeIndex: number;
  readonly cardIds: readonly string[];
  readonly gold: number;
  readonly heal: number;
  readonly cardDefinitionsById?: ReadonlyMap<string, CardDefinition>;
  readonly enchantmentDefinitionsById?: ReadonlyMap<string, EnchantmentDefinition>;
}): readonly EventChoice[] {
  const enchantmentsById = input.enchantmentDefinitionsById ?? getEnchantmentDefinitionsById();
  const choices = input.template.choices.map((choice, index): EventChoice => {
    if (choice.type === "CARD") {
      const cardId = input.cardIds[choice.poolIndex] ?? (choice.poolIndex === 0 ? "rusty-blade" : "wooden-shield");
      return {
        id: `event-${input.nodeIndex}-card-${choice.poolIndex}`,
        type: "EVENT_CARD",
        eventTemplateId: input.template.id,
        label: `Take ${getCardName(cardId, input.cardDefinitionsById)}`,
        cardDefinitionId: cardId
      };
    }
    if (choice.type === "GOLD") {
      return {
        id: `event-${input.nodeIndex}-gold`,
        type: "EVENT_GOLD",
        eventTemplateId: input.template.id,
        label: `Take ${input.gold} gold`,
        gold: input.gold
      };
    }
    if (choice.type === "HEAL") {
      return {
        id: `event-${input.nodeIndex}-heal`,
        type: "EVENT_HEAL",
        eventTemplateId: input.template.id,
        label: `Rest for ${input.heal} HP`,
        heal: input.heal
      };
    }
    const enchantment = enchantmentsById.get(choice.enchantmentDefinitionId);
    const label = enchantment ? `Study ${enchantment.name}` : `Study ${choice.enchantmentDefinitionId}`;
    return {
      id: `event-${input.nodeIndex}-enchantment-${index}`,
      type: "EVENT_ENCHANTMENT",
      eventTemplateId: input.template.id,
      label,
      enchantmentDefinitionId: choice.enchantmentDefinitionId,
      targetRule: enchantment?.targetRule,
      description: enchantment?.description
    };
  });
  return choices.slice(0, 3);
}

function shouldForceBronzeEnchantmentIntro(input: {
  readonly nodeIndex: number;
  readonly level: number;
}): boolean {
  return input.level >= BRONZE_ENCHANTMENT_INTRO_TEMPLATE.minLevel && getNonStarterEventOrdinal(input.nodeIndex) === 3;
}

function getNonStarterEventOrdinal(nodeIndex: number): number {
  if (nodeIndex < 13) return 0;
  const eventSpacing = nodeIndex - 13;
  if (eventSpacing % 6 !== 0) return 0;
  return Math.floor(eventSpacing / 6) + 1;
}

function pickWeighted(templates: readonly EventTemplate[], seed: string): EventTemplate {
  const totalWeight = templates.reduce((sum, template) => sum + template.weight, 0);
  const roll = createSeededRandom(seed)() * totalWeight;
  let cursor = 0;
  for (const template of templates) {
    cursor += template.weight;
    if (roll < cursor) {
      return template;
    }
  }
  return templates[templates.length - 1] ?? BASIC_EVENT_TEMPLATE;
}

function getCardName(cardId: string, cardDefinitionsById?: ReadonlyMap<string, CardDefinition>): string {
  return cardDefinitionsById?.get(cardId)?.name ?? cardId;
}
