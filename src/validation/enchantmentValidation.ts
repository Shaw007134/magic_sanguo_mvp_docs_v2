import {
  ENCHANTMENT_RARITIES,
  ENCHANTMENT_TARGET_RULES,
  ENCHANTMENT_TIERS,
  ENCHANTMENT_TYPES,
  type EnchantmentDefinition
} from "../model/enchantment.js";
import { createValidationResult, type ValidationIssue, type ValidationResult } from "./validationResult.js";

export function validateEnchantmentDefinition(enchantment: EnchantmentDefinition): ValidationResult {
  const errors: ValidationIssue[] = [];

  if (enchantment.id.trim().length === 0) {
    errors.push({ path: "id", message: "Enchantment id must be non-empty." });
  }
  if (enchantment.name.trim().length === 0) {
    errors.push({ path: "name", message: "Enchantment name must be non-empty." });
  }
  if (!ENCHANTMENT_TYPES.includes(enchantment.type)) {
    errors.push({ path: "type", message: `Enchantment type must be one of: ${ENCHANTMENT_TYPES.join(", ")}.` });
  }
  if (!ENCHANTMENT_TIERS.includes(enchantment.tier)) {
    errors.push({ path: "tier", message: `Enchantment tier must be one of: ${ENCHANTMENT_TIERS.join(", ")}.` });
  }
  if (!ENCHANTMENT_RARITIES.includes(enchantment.rarity)) {
    errors.push({ path: "rarity", message: `Enchantment rarity must be one of: ${ENCHANTMENT_RARITIES.join(", ")}.` });
  }
  if (!Number.isInteger(enchantment.minLevel) || enchantment.minLevel < 1) {
    errors.push({ path: "minLevel", message: "Enchantment minLevel must be a positive integer." });
  }
  if (!ENCHANTMENT_TARGET_RULES.includes(enchantment.targetRule)) {
    errors.push({ path: "targetRule", message: `Enchantment targetRule must be one of: ${ENCHANTMENT_TARGET_RULES.join(", ")}.` });
  }
  if (enchantment.description.trim().length === 0) {
    errors.push({ path: "description", message: "Enchantment description must be non-empty." });
  }

  return createValidationResult(errors);
}
