import { describe, expect, it } from "vitest";

import type { CardDefinition } from "../../src/model/card.js";
import { validateCardDefinition } from "../../src/validation/cardValidation.js";

function createValidActiveCard(overrides: Partial<CardDefinition> = {}): CardDefinition {
  return {
    id: "flame-spear",
    name: "Flame Spear",
    tier: "BRONZE",
    type: "ACTIVE",
    size: 1,
    tags: ["fire"],
    cooldownTicks: 60,
    effects: [{}],
    description: "Deals direct damage.",
    ...overrides
  };
}

describe("validateCardDefinition", () => {
  it("allows a valid CardDefinition", () => {
    const result = validateCardDefinition(createValidActiveCard());

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects an active card without cooldown", () => {
    const result = validateCardDefinition(createValidActiveCard({ cooldownTicks: undefined }));

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      path: "cooldownTicks",
      message: "Active cards must have cooldownTicks greater than 0."
    });
  });

  it("rejects an invalid tier", () => {
    const result = validateCardDefinition(
      createValidActiveCard({ tier: "WOOD" as CardDefinition["tier"] })
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.path).toBe("tier");
  });

  it("accepts supported DealDamage damageType values", () => {
    const result = validateCardDefinition(
      createValidActiveCard({
        effects: [
          { command: "DealDamage", amount: 1 },
          { command: "DealDamage", amount: 1, damageType: "DIRECT" },
          { command: "DealDamage", amount: 1, damageType: "PHYSICAL" },
          { command: "DealDamage", amount: 1, damageType: "FIRE" },
          { command: "DealDamage", amount: 1, damageType: "POISON" }
        ]
      })
    );

    expect(result.valid).toBe(true);
  });

  it("rejects unknown DealDamage damageType values", () => {
    const result = validateCardDefinition(
      createValidActiveCard({
        effects: [{ command: "DealDamage", amount: 1, damageType: "ICE" }]
      })
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      path: "effects[0].damageType",
      message: "DealDamage damageType must be DIRECT, PHYSICAL, FIRE, or POISON."
    });
  });

  it("validates ApplyPoison and HealHP amount fields", () => {
    const result = validateCardDefinition(
      createValidActiveCard({
        effects: [
          { command: "ApplyPoison", amount: 1 },
          { command: "ApplyPoison", amount: 1, durationTicks: 120 },
          { command: "HealHP", amount: 5 }
        ]
      })
    );

    expect(result.valid).toBe(true);
  });

  it("rejects malformed ApplyPoison and HealHP effects", () => {
    const result = validateCardDefinition(
      createValidActiveCard({
        effects: [
          { command: "ApplyPoison" },
          { command: "ApplyPoison", amount: 1, durationTicks: "soon" },
          { command: "HealHP" }
        ]
      })
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      path: "effects[0].amount",
      message: "ApplyPoison amount must be a number."
    });
    expect(result.errors).toContainEqual({
      path: "effects[1].durationTicks",
      message: "ApplyPoison durationTicks must be a number when present."
    });
    expect(result.errors).toContainEqual({
      path: "effects[2].amount",
      message: "HealHP amount must be a number."
    });
  });
});
