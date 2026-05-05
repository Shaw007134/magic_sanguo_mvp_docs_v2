import { describe, expect, it } from "vitest";

import type { EnchantmentDefinition } from "../../src/model/enchantment.js";
import { validateEnchantmentDefinition } from "../../src/validation/enchantmentValidation.js";

function createValidEnchantment(overrides: Partial<EnchantmentDefinition> = {}): EnchantmentDefinition {
  return {
    id: "bronze-iron-edge",
    name: "Iron Edge",
    type: "IRON",
    tier: "BRONZE",
    rarity: "COMMON",
    minLevel: 4,
    targetRule: "WEAPON_CARD",
    description: "A planned weapon enchantment.",
    ...overrides
  };
}

describe("validateEnchantmentDefinition", () => {
  it("allows a valid enchantment definition", () => {
    expect(validateEnchantmentDefinition(createValidEnchantment())).toEqual({ valid: true, errors: [] });
  });

  it("rejects invalid type, tier, and targetRule values", () => {
    const result = validateEnchantmentDefinition(
      createValidEnchantment({
        type: "STONE" as never,
        tier: "WOOD" as never,
        targetRule: "LEFTMOST_CARD" as never
      })
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "type" }),
      expect.objectContaining({ path: "tier" }),
      expect.objectContaining({ path: "targetRule" })
    ]));
  });
});
