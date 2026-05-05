import type { CardDefinition, CardInstance, CardTier, EffectDefinition } from "../../model/card.js";
import { formatTicksAsSeconds } from "../../replay/time.js";

export const CARD_TIER_ORDER = ["BRONZE", "SILVER", "GOLD", "JADE", "CELESTIAL"] as const satisfies readonly CardTier[];
export const REWARD_ENHANCEMENT_MIN_COOLDOWN_TICKS = 30;
export const REWARD_ENHANCEMENT_COOLDOWN_REDUCTION_CAP_PERCENT = 40;

const TIER_SCALING = {
  BRONZE: { valueMultiplier: 1, cooldownMultiplier: 1 },
  SILVER: { valueMultiplier: 1.25, cooldownMultiplier: 0.95 },
  GOLD: { valueMultiplier: 1.5, cooldownMultiplier: 0.9 },
  JADE: { valueMultiplier: 1.85, cooldownMultiplier: 0.85 },
  CELESTIAL: { valueMultiplier: 2.25, cooldownMultiplier: 0.8 }
} as const satisfies Record<CardTier, { readonly valueMultiplier: number; readonly cooldownMultiplier: number }>;

export function getEffectiveCardDefinition(card: CardInstance, baseDefinition: CardDefinition): CardDefinition {
  const effectiveTier = card.tierOverride ?? baseDefinition.tier;
  const hasEnhancements = (card.enhancements?.length ?? 0) > 0;
  if (effectiveTier === baseDefinition.tier && !hasEnhancements) {
    return baseDefinition;
  }
  const scaling = TIER_SCALING[effectiveTier];
  const tierScaledDefinition = {
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
  return applyCardInstanceEnhancements(tierScaledDefinition, card);
}

export function getEffectiveCardDefinitionId(card: CardInstance): string {
  const hasEnhancements = (card.enhancements?.length ?? 0) > 0;
  return card.tierOverride || hasEnhancements
    ? `${card.definitionId}__${card.instanceId}__${card.tierOverride ?? "BASE"}__enh${card.enhancements?.length ?? 0}`
    : card.definitionId;
}

export function createEffectiveCardDefinitionMap(input: {
  readonly cardInstances: readonly CardInstance[];
  readonly baseDefinitionsById: ReadonlyMap<string, CardDefinition>;
}): ReadonlyMap<string, CardDefinition> {
  const definitions = new Map(input.baseDefinitionsById);
  for (const card of input.cardInstances) {
    const baseDefinition = input.baseDefinitionsById.get(card.definitionId);
    if (!baseDefinition || (!card.tierOverride && (card.enhancements?.length ?? 0) === 0)) {
      continue;
    }
    const effectiveDefinition = getEffectiveCardDefinition(card, baseDefinition);
    definitions.set(effectiveDefinition.id, effectiveDefinition);
  }
  return definitions;
}

export function createEffectiveCardInstances(cards: readonly CardInstance[]): readonly CardInstance[] {
  return cards.map((card) =>
    card.tierOverride || (card.enhancements?.length ?? 0) > 0 ? { ...card, definitionId: getEffectiveCardDefinitionId(card) } : card
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
    (effect["command"] === "DealDamage" ||
      effect["command"] === "GainArmor" ||
      effect["command"] === "ApplyBurn" ||
      effect["command"] === "ApplyPoison" ||
      effect["command"] === "HealHP") &&
    typeof effect["amount"] === "number"
  ) {
    return { ...effect, amount: scaleAmount(effect["amount"], baseTier, effectiveTier) };
  }
  return effect;
}

function applyCardInstanceEnhancements(card: CardDefinition, instance: CardInstance): CardDefinition {
  const enhancements = instance.enhancements ?? [];
  if (enhancements.length === 0 || card.type !== "ACTIVE") {
    return card;
  }
  const damageIncrease = enhancements
    .filter((enhancement) => enhancement.type === "INCREASE_DAMAGE")
    .reduce((total, enhancement) => total + (enhancement.amount ?? 0), 0);
  const burnIncrease = enhancements
    .filter((enhancement) => enhancement.type === "INCREASE_BURN")
    .reduce((total, enhancement) => total + (enhancement.amount ?? 0), 0);
  const poisonIncrease = enhancements
    .filter((enhancement) => enhancement.type === "INCREASE_POISON")
    .reduce((total, enhancement) => total + (enhancement.amount ?? 0), 0);
  const cooldownReductionPercent = Math.min(
    REWARD_ENHANCEMENT_COOLDOWN_REDUCTION_CAP_PERCENT,
    enhancements
      .filter((enhancement) => enhancement.type === "REDUCE_COOLDOWN_PERCENT")
      .reduce((total, enhancement) => total + (enhancement.percent ?? 0), 0)
  );

  return {
    ...card,
    cooldownTicks:
      card.cooldownTicks === undefined || cooldownReductionPercent <= 0
        ? card.cooldownTicks
        : roundCooldownTicks(card.cooldownTicks * (1 - cooldownReductionPercent / 100)),
    effects: card.effects?.map((effect) => {
      if (effect["command"] === "DealDamage" && typeof effect["amount"] === "number" && damageIncrease > 0) {
        return { ...effect, amount: effect["amount"] + damageIncrease };
      }
      if (effect["command"] === "ApplyBurn" && typeof effect["amount"] === "number" && burnIncrease > 0) {
        return { ...effect, amount: effect["amount"] + burnIncrease };
      }
      if (effect["command"] === "ApplyPoison" && typeof effect["amount"] === "number" && poisonIncrease > 0) {
        return { ...effect, amount: effect["amount"] + poisonIncrease };
      }
      return effect;
    })
  };
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
  return Math.max(REWARD_ENHANCEMENT_MIN_COOLDOWN_TICKS, Math.round(value / 15) * 15);
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
    if (effect["command"] === "ApplyPoison" && typeof effect["amount"] === "number") {
      stats.push({ label: "Poison", value: String(effect["amount"]) });
    }
    if (effect["command"] === "HealHP" && typeof effect["amount"] === "number") {
      stats.push({ label: "Heal", value: String(effect["amount"]) });
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
      if (effect["command"] === "ApplyPoison" && typeof effect["amount"] === "number") {
        stats.push({ label: "Poison", value: String(effect["amount"]) });
      }
      if (effect["command"] === "HealHP" && typeof effect["amount"] === "number") {
        stats.push({ label: "Heal", value: String(effect["amount"]) });
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
