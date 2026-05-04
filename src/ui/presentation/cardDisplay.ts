import type { CardDefinition, EffectDefinition, TriggerDefinition } from "../../model/card.js";
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

  return (card.effects ?? []).map(formatEffect).join(" · ") || "No effect";
}

function formatTrigger(trigger: TriggerDefinition): string {
  const hook = formatTriggerHook(trigger);
  const effects = Array.isArray(trigger["effects"])
    ? trigger["effects"].map(formatEffect).join(" + ")
    : "Effect";
  return `${hook}: ${effects}.`;
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
  switch (hook) {
    case "OnCardActivated":
      return "When a card activates";
    case "OnDamageDealt":
      return "When damage is dealt";
    case "OnDamageTaken":
      return "When damage is taken";
    case "OnBurnTick":
      return "When Burn deals damage";
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

function formatEffect(effect: EffectDefinition): string {
  switch (effect["command"]) {
    case "DealDamage":
      return formatDealDamageEffect(effect);
    case "GainArmor":
      return typeof effect["amount"] === "number" ? `Armor: ${effect["amount"]}` : "Armor";
    case "ApplyBurn":
      if (typeof effect["amount"] === "number" && typeof effect["durationTicks"] === "number") {
        return `Burn: ${effect["amount"]} damage/sec for ${formatTickDuration(effect["durationTicks"])}`;
      }
      return "Burn";
    case "ApplyPoison":
      if (typeof effect["amount"] === "number" && typeof effect["durationTicks"] === "number") {
        return `Poison: ${effect["amount"]} damage/sec for ${formatTickDuration(effect["durationTicks"])}`;
      }
      return typeof effect["amount"] === "number" ? `Poison: ${effect["amount"]} damage/sec` : "Poison";
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
        ? `Cooldown: ${formatSignedTickDuration(effect["amountTicks"])}`
        : "Cooldown";
    default:
      return "Effect";
  }
}

function formatControlEffect(kind: "Haste" | "Slow" | "Freeze", effect: EffectDefinition): string {
  const target = formatControlTarget(effect["target"]);
  const duration = typeof effect["durationTicks"] === "number" ? ` for ${formatTickDuration(effect["durationTicks"])}` : "";
  if (kind === "Freeze") {
    return `Freeze ${target}${duration}`;
  }
  const percent = typeof effect["percent"] === "number" ? `${effect["percent"]}%` : "";
  return `${kind} ${target}${percent ? ` by ${percent}` : ""}${duration}`;
}

function formatControlTarget(value: unknown): string {
  switch (value) {
    case "SELF":
      return "this card";
    case "ADJACENT_ALLY":
      return "adjacent allies";
    case "OWNER_ALL_CARDS":
      return "all your cards";
    case "OPPOSITE_ENEMY_CARD":
      return "the opposite enemy card";
    case "ENEMY_LEFTMOST_ACTIVE":
      return "the leftmost enemy card";
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

function formatSignedTickDuration(value: number): string {
  return `${value > 0 ? "+" : ""}${formatTickDuration(value)}`;
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
