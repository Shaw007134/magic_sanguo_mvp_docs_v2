import type { CardDefinition, EffectDefinition, TriggerDefinition } from "../../model/card.js";
import type { CardInstance } from "../../model/card.js";
import {
  BRONZE_FLAME_BURN_BONUS,
  BRONZE_IRON_ARMOR_BONUS,
  BRONZE_VITAL_HEAL_BONUS
} from "../../content/cards/effectiveCardDefinition.js";
import { getEnchantmentDefinitionsById } from "../../content/enchantments/enchantments.js";
import { getRewardCardDefinitionsById } from "../../content/rewards/rewardCards.js";
import { formatTicksAsSeconds } from "../../replay/time.js";

export interface CardDisplayInfo {
  readonly name: string;
  readonly typeLabel: "Active" | "Passive" | "Other";
  readonly tier: string;
  readonly size: number;
  readonly cooldown?: number;
  readonly summary: string;
}

export function getCardDisplayInfo(card: CardDefinition): CardDisplayInfo {
  return {
    name: card.name,
    typeLabel: card.type === "ACTIVE" ? "Active" : card.type === "PASSIVE" ? "Passive" : "Other",
    tier: formatTier(card.tier),
    size: card.size,
    cooldown: card.cooldownTicks,
    summary: getCardSummary(card)
  };
}

export function getCardSummary(card: CardDefinition): string {
  if (card.type === "PASSIVE") {
    return (card.triggers ?? []).map(formatTrigger).join(" · ") || "Passive";
  }

  return formatActiveEffects(card.effects ?? []);
}

export function getCardEnhancementSummaries(card: CardInstance): readonly string[] {
  const rewardCardsById = getRewardCardDefinitionsById();
  return (card.enhancements ?? []).map((enhancement) => {
    const sourceName = rewardCardsById.get(enhancement.sourceRewardCardDefinitionId)?.name ?? enhancement.sourceRewardCardDefinitionId;
    switch (enhancement.type) {
      case "INCREASE_DAMAGE":
        return `+${enhancement.amount ?? 0} damage from ${sourceName}`;
      case "INCREASE_BURN":
        return `+${enhancement.amount ?? 0} Burn from ${sourceName}`;
      case "INCREASE_POISON":
        return `+${enhancement.amount ?? 0} Poison from ${sourceName}`;
      case "REDUCE_COOLDOWN_PERCENT":
        return `cooldown -${formatPercent(enhancement.percent ?? 0)} from ${sourceName}`;
      default:
        return `enhanced by ${sourceName}`;
    }
  });
}

export function getCardEnchantmentSummary(card: CardInstance): string | undefined {
  if (!card.enchantment) {
    return undefined;
  }
  const enchantment = getEnchantmentDefinitionsById().get(card.enchantment.enchantmentDefinitionId);
  if (!enchantment) {
    return "Enchanted";
  }
  return `Enchanted: ${enchantment.name} (${formatTier(enchantment.tier)} ${formatEnchantmentType(enchantment.type)})${formatEnchantmentEffect(enchantment.type)}`;
}

function formatEnchantmentType(value: string): string {
  return value[0] + value.slice(1).toLowerCase();
}

function formatEnchantmentEffect(value: string): string {
  switch (value) {
    case "IRON":
      return ` · +${BRONZE_IRON_ARMOR_BONUS} Armor`;
    case "FLAME":
      return ` · +${BRONZE_FLAME_BURN_BONUS} Burn`;
    case "VITAL":
      return ` · +${BRONZE_VITAL_HEAL_BONUS} Heal`;
    default:
      return "";
  }
}

function formatTrigger(trigger: TriggerDefinition): string {
  const hook = formatTriggerHook(trigger);
  const effects = Array.isArray(trigger["effects"])
    ? trigger["effects"].map(formatEffect).join(" + ")
    : "Effect";
  const limit = formatTriggerLimit(trigger);
  return `${hook}: ${effects}${limit ? `. ${limit}` : ""}.`;
}

function formatTriggerHook(trigger: TriggerDefinition): string {
  const hook = trigger["hook"];
  const conditions = isRecord(trigger["conditions"]) ? trigger["conditions"] : {};
  if (hook === "OnStatusApplied" && conditions["status"] === "Burn" && conditions["appliedByOwner"] === true) {
    return "When you apply Burn";
  }
  if (hook === "OnStatusApplied" && conditions["status"] === "Burn") {
    return "When Burn is applied";
  }
  if (hook === "OnStatusApplied" && conditions["status"] === "Poison" && conditions["appliedByOwner"] === true) {
    return "When you apply Poison";
  }
  if (hook === "OnStatusApplied" && conditions["status"] === "Poison") {
    return "When Poison is applied";
  }
  if (hook === "OnStatusTicked" && conditions["status"] === "Burn" && conditions["appliedByOwner"] === true) {
    return "When your Burn deals damage";
  }
  if (hook === "OnStatusTicked" && conditions["status"] === "Burn") {
    return "When Burn deals damage";
  }
  if (hook === "OnStatusTicked" && conditions["status"] === "Poison" && conditions["appliedByOwner"] === true) {
    return "When your Poison deals damage";
  }
  if (hook === "OnStatusTicked" && conditions["status"] === "Poison") {
    return "When Poison deals damage";
  }
  if (hook === "OnHealReceived" && conditions["appliedByOwner"] === true) {
    return "When you heal";
  }
  if (hook === "OnHealReceived") {
    return "When healing happens";
  }
  switch (hook) {
    case "OnCardActivated":
      return "When a card activates";
    case "OnDamageDealt":
      return "When damage is dealt";
    case "OnDamageTaken":
      return "When damage is taken";
    case "OnBurnTick":
      return "When Burn deals damage";
    case "OnStatusTicked":
      return "When status damage happens";
    case "OnHealReceived":
      return "When healing happens";
    case "OnCooldownModified":
      return "When cooldown changes";
    case "OnCombatStart":
      return "At combat start";
    case "OnCombatEnd":
      return "At combat end";
    case "OnStatusApplied":
      return "When a status is applied";
    default:
      return "When triggered";
  }
}

function formatTriggerLimit(trigger: TriggerDefinition): string | undefined {
  if (trigger["hook"] !== "OnStatusTicked" && trigger["hook"] !== "OnHealReceived") {
    return undefined;
  }
  return typeof trigger["internalCooldownTicks"] === "number"
    ? `Limited to every ${formatTickDuration(trigger["internalCooldownTicks"])}`
    : undefined;
}

function formatEffect(effect: EffectDefinition): string {
  switch (effect["command"]) {
    case "DealDamage":
      return formatDealDamageEffect(effect);
    case "GainArmor":
      return typeof effect["amount"] === "number" ? `Armor: ${effect["amount"]}` : "Armor";
    case "ApplyBurn":
      return formatStatusEffect("Burn", [effect]);
    case "ApplyPoison":
      return formatStatusEffect("Poison", [effect]);
    case "HealHP":
      return typeof effect["amount"] === "number" ? `Heal: ${effect["amount"]} HP` : "Heal";
    case "ApplyHaste":
      return formatControlEffect("Haste", effect);
    case "ApplySlow":
      return formatControlEffect("Slow", effect);
    case "ApplyFreeze":
      return formatControlEffect("Freeze", effect);
    case "ModifyCooldown":
      return typeof effect["amountTicks"] === "number"
        ? formatCooldownEffect(effect)
        : "Cooldown";
    default:
      return "Effect";
  }
}

function formatActiveEffects(effects: readonly EffectDefinition[]): string {
  const visibleEffects: string[] = [];
  const burnEffects: EffectDefinition[] = [];
  const poisonEffects: EffectDefinition[] = [];
  for (const effect of effects) {
    if (effect["command"] === "ApplyBurn") {
      burnEffects.push(effect);
      continue;
    }
    if (effect["command"] === "ApplyPoison") {
      poisonEffects.push(effect);
      continue;
    }
    visibleEffects.push(formatEffect(effect));
  }
  if (burnEffects.length > 0) {
    visibleEffects.push(formatStatusEffect("Burn", burnEffects));
  }
  if (poisonEffects.length > 0) {
    visibleEffects.push(formatStatusEffect("Poison", poisonEffects));
  }
  return visibleEffects.join(" · ") || "No effect";
}

function formatStatusEffect(kind: "Burn" | "Poison", effects: readonly EffectDefinition[]): string {
  const parts = effects.map((effect) => {
    const amount = typeof effect["amount"] === "number" ? effect["amount"] : undefined;
    const duration = typeof effect["durationTicks"] === "number" ? formatTickDuration(effect["durationTicks"]) : undefined;
    if (amount !== undefined && duration) {
      return `${amount} per second for ${duration}`;
    }
    if (amount !== undefined) {
      return `${amount} per second`;
    }
    return duration ? `for ${duration}` : "";
  }).filter((part) => part.length > 0);
  const value = parts.length > 0 ? parts.join(" + ") : kind;
  return kind === "Burn"
    ? `${kind}: ${value} (decays by 1/sec)`
    : `${kind}: ${value}`;
}

function formatCooldownEffect(effect: EffectDefinition): string {
  const amountTicks = effect["amountTicks"];
  if (typeof amountTicks !== "number") {
    return "Cooldown";
  }
  const target = formatControlTarget(effect["target"]);
  if (amountTicks < 0) {
    return `Ready ${target} ${formatTickDuration(Math.abs(amountTicks))} sooner`;
  }
  if (amountTicks > 0) {
    return `Delay ${target} by ${formatTickDuration(amountTicks)}`;
  }
  return "Cooldown unchanged";
}

function formatControlEffect(kind: "Haste" | "Slow" | "Freeze", effect: EffectDefinition): string {
  const target = formatControlTarget(effect["target"]);
  const duration = typeof effect["durationTicks"] === "number" ? ` for ${formatTickDuration(effect["durationTicks"])}` : "";
  if (kind === "Freeze") {
    return `Freeze ${target}${duration}`;
  }
  if (kind === "Haste") {
    return `Haste ${target} (50% faster tick speed)${duration}`;
  }
  return `Slow ${target}${duration}`;
}

function formatControlTarget(value: unknown): string {
  switch (value) {
    case "SELF":
      return "this card";
    case "ADJACENT_ALLY":
      return "adjacent active allies";
    case "OWNER_ALL_CARDS":
      return "all your active cards";
    case "OPPOSITE_ENEMY_CARD":
      return "the opposite enemy active card";
    case "ENEMY_LEFTMOST_ACTIVE":
      return "the leftmost enemy active card";
    default:
      return "cards";
  }
}

function formatDealDamageEffect(effect: EffectDefinition): string {
  const parts: string[] = [];
  const amount = typeof effect["amount"] === "number" ? effect["amount"] : undefined;
  const scaling = isRecord(effect["scaling"]) ? formatScaling(effect["scaling"]) : undefined;
  const damageLabel = formatDamageLabel(effect["damageType"]);
  if (amount !== undefined && amount > 0 && scaling) {
    parts.push(`${damageLabel}: ${amount} plus ${scaling}`);
  } else if (scaling) {
    parts.push(`${damageLabel}: ${scaling}`);
  } else {
    parts.push(amount !== undefined ? `${damageLabel}: ${amount}` : damageLabel);
  }

  if (isRecord(effect["conditionalMultiplier"])) {
    const threshold = effect["conditionalMultiplier"]["targetHpBelowPercent"];
    const multiplier = effect["conditionalMultiplier"]["multiplier"];
    if (typeof threshold === "number" && typeof multiplier === "number") {
      parts.push(`if enemy is below ${formatPercent(threshold)} HP, ${formatMultiplier(multiplier)} damage`);
    }
  }

  if (typeof effect["critChancePercent"] === "number" && typeof effect["critMultiplier"] === "number") {
    parts.push(`${formatPercent(effect["critChancePercent"])} chance to crit for ${formatMultiplier(effect["critMultiplier"])}`);
  }

  return parts.join(" · ");
}

function formatDamageLabel(value: unknown): string {
  if (value === "PHYSICAL") {
    return "Physical damage";
  }
  if (value === "FIRE") {
    return "Fire damage";
  }
  if (value === "POISON") {
    return "Poison damage";
  }
  return "Damage";
}

function formatScaling(scaling: Readonly<Record<string, unknown>>): string | undefined {
  const percent = scaling["percent"];
  if (typeof percent !== "number") {
    return undefined;
  }
  switch (scaling["source"]) {
    case "OWNER_ARMOR_PERCENT":
      return `${formatPercent(percent)} of your Armor`;
    case "OWNER_MAX_HP_PERCENT":
      return `${formatPercent(percent)} of your max HP`;
    case "TARGET_MISSING_HP_PERCENT":
      return `${formatPercent(percent)} of enemy missing HP`;
    default:
      return undefined;
  }
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1).replace(/\.0$/, "")}%`;
}

function formatMultiplier(value: number): string {
  return Number.isInteger(value) ? `${value}x` : `${value.toFixed(2).replace(/0$/, "").replace(/\.$/, "")}x`;
}

function formatTickDuration(value: number): string {
  const formatted = formatTicksAsSeconds(value);
  return formatted.replace(/\.00s$/, "s").replace(/(\.\d)0s$/, "$1s");
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}

function formatTier(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}
