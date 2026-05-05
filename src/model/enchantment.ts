export const ENCHANTMENT_TYPES = [
  "IRON",
  "VITAL",
  "FLAME",
  "VENOM",
  "SWIFT",
  "BINDING",
  "FROST",
  "OBSIDIAN"
] as const;

export const ENCHANTMENT_TIERS = ["BRONZE", "SILVER", "GOLD", "JADE", "CELESTIAL"] as const;
export const ENCHANTMENT_RARITIES = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"] as const;
export const ENCHANTMENT_TARGET_RULES = [
  "ANY_CARD",
  "ANY_ACTIVE_CARD",
  "WEAPON_CARD",
  "ARMOR_CARD",
  "FIRE_CARD",
  "POISON_CARD",
  "COOLDOWN_CARD",
  "CONTROL_CARD",
  "TERMINAL_CARD"
] as const;

export type EnchantmentType = (typeof ENCHANTMENT_TYPES)[number];
export type EnchantmentTier = (typeof ENCHANTMENT_TIERS)[number];
export type EnchantmentRarity = (typeof ENCHANTMENT_RARITIES)[number];
export type EnchantmentTargetRule = (typeof ENCHANTMENT_TARGET_RULES)[number];

export interface EnchantmentDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: EnchantmentType;
  readonly tier: EnchantmentTier;
  readonly rarity: EnchantmentRarity;
  readonly minLevel: number;
  readonly targetRule: EnchantmentTargetRule;
  readonly description: string;
}

export interface EnchantmentChoice {
  readonly id: string;
  readonly enchantmentDefinitionId: string;
  readonly targetRule: EnchantmentTargetRule;
  readonly label: string;
  readonly description: string;
}
