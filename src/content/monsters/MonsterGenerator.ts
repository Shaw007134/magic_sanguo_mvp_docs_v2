import type { CardDefinition, CardInstance } from "../../model/card.js";
import type { FormationSnapshot, FormationSlotSnapshot } from "../../model/formation.js";
import { getActiveCardDefinitionsById } from "../cards/activeCards.js";
import type { MonsterTemplate, MonsterTemplateCardChoice } from "./MonsterTemplate.js";
import { getMonsterTemplateById } from "./monsterTemplates.js";

export interface MonsterGenerationInput {
  readonly template: MonsterTemplate;
  readonly seed: string;
  readonly day: number;
  readonly cardDefinitionsById?: ReadonlyMap<string, CardDefinition>;
}

export interface MonsterGenerationResult {
  readonly formation: FormationSnapshot;
  readonly cardInstances: readonly CardInstance[];
}

export class MonsterGenerator {
  generate(input: MonsterGenerationInput): MonsterGenerationResult {
    return generateMonsterFormation(input);
  }

  generateByTemplateId(input: {
    readonly templateId: string;
    readonly seed: string;
    readonly day: number;
    readonly cardDefinitionsById?: ReadonlyMap<string, CardDefinition>;
  }): MonsterGenerationResult {
    const template = getMonsterTemplateById(input.templateId);
    if (!template) {
      throw new Error(`Unknown monster template: ${input.templateId}`);
    }

    return this.generate({
      template,
      seed: input.seed,
      day: input.day,
      cardDefinitionsById: input.cardDefinitionsById
    });
  }
}

export function generateMonsterFormation(input: MonsterGenerationInput): MonsterGenerationResult {
  const cardDefinitionsById = input.cardDefinitionsById ?? getActiveCardDefinitionsById();
  const slots = createEmptySlots(input.template.slotCount);
  const cardInstances: CardInstance[] = [];
  const instanceCounts = new Map<string, number>();
  const rng = createSeededRandom(`${input.seed}:${input.template.id}:${input.day}`);

  for (const choice of input.template.requiredCards) {
    placeCardOrThrow(choice, input.template, slots, cardInstances, instanceCounts, cardDefinitionsById);
  }

  if (!input.template.fixed) {
    for (const choice of shuffleChoices(input.template.optionalCards, rng)) {
      placeCardIfPossible(choice, input.template, slots, cardInstances, instanceCounts, cardDefinitionsById);
    }
  }

  return {
    formation: {
      id: createFormationId(input.template, input.seed, input.day),
      kind: input.template.difficulty === "BOSS" ? "BOSS" : "MONSTER",
      displayName: input.template.name,
      level: input.day,
      maxHp: input.template.maxHp,
      startingArmor: input.template.startingArmor,
      slots,
      skills: [],
      relics: [],
      aiProfile: {
        id: input.template.id
      }
    },
    cardInstances
  };
}

function createFormationId(template: MonsterTemplate, seed: string, day: number): string {
  if (template.fixed) {
    return `monster:${template.id}:${day}`;
  }
  return `monster:${template.id}:${day}:${hashString(seed).toString(36)}`;
}

function createEmptySlots(slotCount: number): FormationSlotSnapshot[] {
  return Array.from({ length: slotCount }, (_, index) => ({ slotIndex: index + 1 }));
}

function placeCardOrThrow(
  choice: MonsterTemplateCardChoice,
  template: MonsterTemplate,
  slots: FormationSlotSnapshot[],
  cardInstances: CardInstance[],
  instanceCounts: Map<string, number>,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): void {
  if (!placeCardIfPossible(choice, template, slots, cardInstances, instanceCounts, cardDefinitionsById)) {
    throw new Error(`Monster template ${template.id} cannot place required card ${choice.cardId}.`);
  }
}

function placeCardIfPossible(
  choice: MonsterTemplateCardChoice,
  template: MonsterTemplate,
  slots: FormationSlotSnapshot[],
  cardInstances: CardInstance[],
  instanceCounts: Map<string, number>,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): boolean {
  const card = cardDefinitionsById.get(choice.cardId);
  if (!card) {
    throw new Error(`Monster template ${template.id} references unknown card ${choice.cardId}.`);
  }

  const slotIndex = choice.slot ?? findFirstFittingSlot(card, slots);
  if (slotIndex === undefined || !canPlaceCard(card, slotIndex, slots)) {
    return false;
  }

  const count = (instanceCounts.get(choice.cardId) ?? 0) + 1;
  instanceCounts.set(choice.cardId, count);
  const instanceId = `${template.id}:${choice.cardId}:${count}`;

  slots[slotIndex - 1] = {
    ...slots[slotIndex - 1],
    cardInstanceId: instanceId
  };
  if (card.size === 2) {
    slots[slotIndex] = {
      ...slots[slotIndex],
      locked: true
    };
  }
  cardInstances.push({
    instanceId,
    definitionId: choice.cardId
  });

  return true;
}

function findFirstFittingSlot(card: CardDefinition, slots: readonly FormationSlotSnapshot[]): number | undefined {
  for (const slot of slots) {
    if (canPlaceCard(card, slot.slotIndex, slots)) {
      return slot.slotIndex;
    }
  }
  return undefined;
}

function canPlaceCard(card: CardDefinition, slotIndex: number, slots: readonly FormationSlotSnapshot[]): boolean {
  const slot = slots[slotIndex - 1];
  if (!slot || slot.cardInstanceId || slot.locked) {
    return false;
  }

  if (card.size === 1) {
    return true;
  }

  const nextSlot = slots[slotIndex];
  return nextSlot !== undefined && !nextSlot.cardInstanceId && !nextSlot.locked;
}

function shuffleChoices(
  choices: readonly MonsterTemplateCardChoice[],
  rng: () => number
): readonly MonsterTemplateCardChoice[] {
  const shuffled = [...choices];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createSeededRandom(seed: string): () => number {
  let state = hashString(seed);
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
