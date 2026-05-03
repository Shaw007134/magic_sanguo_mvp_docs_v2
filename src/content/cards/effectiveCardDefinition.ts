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
    name: baseDefinition.name,
    tier: effectiveTier,
    cooldownTicks:
      baseDefinition.cooldownTicks === undefined
        ? undefined
        : roundCooldownTicks(baseDefinition.cooldownTicks * scaling.cooldownMultiplier),
    effects: baseDefinition.effects?.map((effect) => scaleEffect(effect, baseDefinition.tier, effectiveTier)),
    triggers: baseDefinition.triggers?.map((trigger) => scaleTrigger(trigger, baseDefinition.tier, effectiveTier))
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
  return getUpgradeStatChanges(before, after)
    .map((change) => `${change.label} ${change.before} -> ${change.after}`)
    .join(", ");
}

export function getUpgradeStatChanges(
  beforeDefinition: CardDefinition,
  afterDefinition: CardDefinition
): readonly { readonly label: string; readonly before: string; readonly after: string }[] {
  const beforeParts = getKeyStats(beforeDefinition);
  const afterParts = getKeyStats(afterDefinition);
  return beforeParts.flatMap((beforePart, index) => {
    const afterPart = afterParts[index];
    if (!afterPart || beforePart.value === afterPart.value) {
      return [];
    }
    return [{ label: beforePart.label, before: beforePart.value, after: afterPart.value }];
  });
}

export function hasMeaningfulUpgrade(input: {
  readonly card: CardInstance;
  readonly baseDefinition: CardDefinition;
  readonly toTier: CardTier;
}): boolean {
  const before = getEffectiveCardDefinition(input.card, input.baseDefinition);
  const after = getEffectiveCardDefinition({ ...input.card, tierOverride: input.toTier }, input.baseDefinition);
  return getUpgradeStatChanges(before, after).length > 0;
}

function scaleEffect(effect: EffectDefinition, baseTier: CardTier, effectiveTier: CardTier): EffectDefinition {
  if (
    (effect["command"] === "DealDamage" || effect["command"] === "GainArmor" || effect["command"] === "ApplyBurn") &&
    typeof effect["amount"] === "number"
  ) {
    return { ...effect, amount: scaleAmount(effect["amount"], baseTier, effectiveTier) };
  }
  return effect;
}

function scaleTrigger(trigger: Readonly<Record<string, unknown>>, baseTier: CardTier, effectiveTier: CardTier) {
  if (!Array.isArray(trigger["effects"])) {
    return trigger;
  }
  return {
    ...trigger,
    effects: trigger["effects"].map((effect) =>
      isRecord(effect) ? scaleEffect(effect, baseTier, effectiveTier) : effect
    )
  };
}

function scaleAmount(baseAmount: number, baseTier: CardTier, effectiveTier: CardTier): number {
  if (effectiveTier === baseTier) {
    return baseAmount;
  }
  const baseIndex = CARD_TIER_ORDER.indexOf(baseTier);
  const targetIndex = CARD_TIER_ORDER.indexOf(effectiveTier);
  if (baseIndex < 0 || targetIndex <= baseIndex) {
    return baseAmount;
  }
  let value = baseAmount;
  for (let index = baseIndex + 1; index <= targetIndex; index += 1) {
    const tier = CARD_TIER_ORDER[index];
    const scaled = Math.ceil(baseAmount * TIER_SCALING[tier].valueMultiplier);
    value = Math.max(scaled, value + 1);
  }
  return value;
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
  for (const trigger of card.triggers ?? []) {
    if (!Array.isArray(trigger["effects"])) {
      continue;
    }
    for (const effect of trigger["effects"]) {
      if (!isRecord(effect)) {
        continue;
      }
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
  }
  if (card.cooldownTicks !== undefined) {
    stats.push({ label: "Cooldown", value: formatTicksAsSeconds(card.cooldownTicks) });
  }
  return stats;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}
