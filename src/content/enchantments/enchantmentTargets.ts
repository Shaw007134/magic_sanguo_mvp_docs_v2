import type { CardDefinition } from "../../model/card.js";
import type { EnchantmentDefinition, EnchantmentTargetRule } from "../../model/enchantment.js";

export function isValidEnchantmentTarget(
  definition: CardDefinition,
  targetRule: EnchantmentTargetRule
): boolean {
  const categories = new Set(definition.categories ?? []);
  switch (targetRule) {
    case "ANY_CARD":
      return true;
    case "ANY_ACTIVE_CARD":
      return definition.type === "ACTIVE";
    case "WEAPON_CARD":
      return categories.has("WEAPON");
    case "ARMOR_CARD":
      return categories.has("ARMOR");
    case "FIRE_CARD":
      return categories.has("FIRE");
    case "POISON_CARD":
      return categories.has("POISON");
    case "COOLDOWN_CARD":
      return categories.has("COOLDOWN");
    case "CONTROL_CARD":
      return categories.has("CONTROL");
    case "TERMINAL_CARD":
      return categories.has("TERMINAL");
    default:
      return false;
  }
}

export function isEligibleForEnchantment(
  definition: CardDefinition,
  enchantment: EnchantmentDefinition
): boolean {
  if (!isValidEnchantmentTarget(definition, enchantment.targetRule)) {
    return false;
  }
  if (enchantment.tier !== "BRONZE") {
    return false;
  }
  switch (enchantment.type) {
    case "IRON":
      return definition.type === "ACTIVE" && hasAnyEffect(definition, ["DealDamage", "HealHP"]);
    case "FLAME":
      return definition.type === "ACTIVE" && hasAnyEffect(definition, ["ApplyBurn"]);
    case "VITAL":
      return definition.type === "ACTIVE" && hasAnyEffect(definition, ["HealHP"]);
    default:
      return false;
  }
}

function hasAnyEffect(definition: CardDefinition, commands: readonly string[]): boolean {
  return (definition.effects ?? []).some((effect) => commands.includes(String(effect["command"])));
}
