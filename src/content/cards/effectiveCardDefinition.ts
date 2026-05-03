import type { CardDefinition, CardInstance, CardTier, EffectDefinition } from "../../model/card.js";
import { formatTicksAsSeconds } from "../../replay/time.js";

export const CARD_TIER_ORDER = ["BRONZE", "SILVER", "GOLD", "JADE", "CELESTIAL"] as const satisfies readonly CardTier[];

const TIER_SCALING = {
  BRONZE: { valueMultiplier: 1, cooldownMultiplier: 1 },
  SILVER: { valueMultiplier: 1.25, cooldownMultiplier: 0.95 },
  GOLD: { valueMultiplier: 1.5, cooldownMultiplier: 0.9 },
  JADE: { valueMultiplier: 1.85, cooldownMultiplier: 0.85 },
  CELESTIAL: { valueMultiplier: 2.25, cooldownMultiplier: 0.8 }
} as const satisfies Record<CardTier, { readonly valueMultiplier: number; readonly cooldownMultiplier: number }>;

export function getEffectiveCardDefinition(card: CardInstance, baseDefinition: CardDefinition): CardDefinition {
  const effectiveTier = card.tierOverride ?? baseDefinition.tier;
  if (effectiveTier === baseDefinition.tier) {
    return baseDefinition;
  }
  const scaling = TIER_SCALING[effectiveTier];
  return {
    ...baseDefinition,
    id: getEffectiveCardDefinitionId(card),
    name: `${baseDefinition.name} (${effectiveTier})`,
    tier: effectiveTier,
    cooldownTicks:
      baseDefinition.cooldownTicks === undefined
        ? undefined
        : roundCooldownTicks(baseDefinition.cooldownTicks * scaling.cooldownMultiplier),
    effects: baseDefinition.effects?.map((effect) => scaleEffect(effect, scaling.valueMultiplier))
  };
}

export function getEffectiveCardDefinitionId(card: CardInstance): string {
  return card.tierOverride ? `${card.definitionId}__${card.instanceId}__${card.tierOverride}` : card.definitionId;
}

export function createEffectiveCardDefinitionMap(input: {
  readonly cardInstances: readonly CardInstance[];
  readonly baseDefinitionsById: ReadonlyMap<string, CardDefinition>;
}): ReadonlyMap<string, CardDefinition> {
  const definitions = new Map(input.baseDefinitionsById);
  for (const card of input.cardInstances) {
    const baseDefinition = input.baseDefinitionsById.get(card.definitionId);
    if (!baseDefinition || !card.tierOverride) {
      continue;
    }
    const effectiveDefinition = getEffectiveCardDefinition(card, baseDefinition);
    definitions.set(effectiveDefinition.id, effectiveDefinition);
  }
  return definitions;
}

export function createEffectiveCardInstances(cards: readonly CardInstance[]): readonly CardInstance[] {
  return cards.map((card) =>
    card.tierOverride ? { ...card, definitionId: getEffectiveCardDefinitionId(card) } : card
  );
}

export function describeUpgradePreview(input: {
  readonly card: CardInstance;
  readonly baseDefinition: CardDefinition;
  readonly toTier: CardTier;
}): string {
  const before = getEffectiveCardDefinition(input.card, input.baseDefinition);
  const after = getEffectiveCardDefinition({ ...input.card, tierOverride: input.toTier }, input.baseDefinition);
  const beforeParts = getKeyStats(before);
  const afterParts = getKeyStats(after);
  return beforeParts
    .map((beforePart, index) => `${beforePart.label} ${beforePart.value} -> ${afterParts[index]?.value ?? "?"}`)
    .join(", ");
}

function scaleEffect(effect: EffectDefinition, multiplier: number): EffectDefinition {
  if (
    (effect["command"] === "DealDamage" || effect["command"] === "GainArmor" || effect["command"] === "ApplyBurn") &&
    typeof effect["amount"] === "number"
  ) {
    return { ...effect, amount: Math.ceil(effect["amount"] * multiplier) };
  }
  return effect;
}

function roundCooldownTicks(value: number): number {
  return Math.max(30, Math.round(value / 15) * 15);
}

function getKeyStats(card: CardDefinition): readonly { readonly label: string; readonly value: string }[] {
  const stats = [];
  for (const effect of card.effects ?? []) {
    if (effect["command"] === "DealDamage" && typeof effect["amount"] === "number") {
      stats.push({ label: "Damage", value: String(effect["amount"]) });
    }
    if (effect["command"] === "GainArmor" && typeof effect["amount"] === "number") {
      stats.push({ label: "Armor", value: String(effect["amount"]) });
    }
    if (effect["command"] === "ApplyBurn" && typeof effect["amount"] === "number") {
      stats.push({ label: "Burn", value: String(effect["amount"]) });
    }
  }
  if (card.cooldownTicks !== undefined) {
    stats.push({ label: "Cooldown", value: formatTicksAsSeconds(card.cooldownTicks) });
  }
  return stats;
}
