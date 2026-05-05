import enchantmentsJson from "../../../data/enchantments/enchantments.json" with { type: "json" };
import type { EnchantmentDefinition } from "../../model/enchantment.js";

export const ENCHANTMENT_DEFINITIONS = enchantmentsJson as readonly EnchantmentDefinition[];

export function getEnchantmentDefinitionsById(): ReadonlyMap<string, EnchantmentDefinition> {
  return new Map(ENCHANTMENT_DEFINITIONS.map((enchantment) => [enchantment.id, enchantment]));
}

export function getEnchantmentDefinition(enchantmentDefinitionId: string): EnchantmentDefinition | undefined {
  return getEnchantmentDefinitionsById().get(enchantmentDefinitionId);
}
