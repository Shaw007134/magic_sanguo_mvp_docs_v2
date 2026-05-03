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
    tier: card.tier,
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
  const hook = typeof trigger["hook"] === "string" ? trigger["hook"] : "Trigger";
  const effects = Array.isArray(trigger["effects"])
    ? trigger["effects"].map(formatEffect).join(" + ")
    : "Effect";
  return `Trigger: ${hook} -> ${effects}`;
}

function formatEffect(effect: EffectDefinition): string {
  switch (effect["command"]) {
    case "DealDamage":
      return typeof effect["amount"] === "number" ? `Damage: ${effect["amount"]}` : "Damage";
    case "GainArmor":
      return typeof effect["amount"] === "number" ? `Armor: ${effect["amount"]}` : "Armor";
    case "ApplyBurn":
      if (typeof effect["amount"] === "number" && typeof effect["durationTicks"] === "number") {
        return `Burn: ${effect["amount"]} damage/sec for ${formatTickDuration(effect["durationTicks"])}`;
      }
      return "Burn";
    case "ModifyCooldown":
      return typeof effect["amountTicks"] === "number"
        ? `Cooldown: ${formatSignedTickDuration(effect["amountTicks"])}`
        : "Cooldown";
    default:
      return "Effect";
  }
}

function formatSignedTickDuration(value: number): string {
  return `${value > 0 ? "+" : ""}${formatTickDuration(value)}`;
}

function formatTickDuration(value: number): string {
  const formatted = formatTicksAsSeconds(value);
  return formatted.replace(/\.00s$/, "s").replace(/(\.\d)0s$/, "$1s");
}
