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

function createValidPassiveCard(overrides: Partial<CardDefinition> = {}): CardDefinition {
  return {
    id: "venom-leech",
    name: "Venom Leech",
    tier: "BRONZE",
    type: "PASSIVE",
    size: 1,
    tags: ["poison"],
    triggers: [
      {
        hook: "OnStatusTicked",
        conditions: { status: "Poison", appliedByOwner: true },
        internalCooldownTicks: 60,
        maxTriggersPerTick: 1,
        effects: [{ command: "HealHP", amount: 1 }]
      }
    ],
    description: "Reaction test card.",
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

  it("validates content categories separately from mechanical type", () => {
    const result = validateCardDefinition(
      createValidActiveCard({
        type: "ACTIVE",
        categories: ["WEAPON", "FIRE", "STARTER"]
      })
    );

    expect(result.valid).toBe(true);
  });

  it("rejects invalid content categories", () => {
    const result = validateCardDefinition(
      createValidActiveCard({
        categories: ["SPELL" as never]
      })
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.path).toBe("categories[0]");
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

  it("validates ApplyHaste, ApplySlow, and ApplyFreeze fields", () => {
    const result = validateCardDefinition(
      createValidActiveCard({
        effects: [
          { command: "ApplyHaste", target: "SELF", percent: 50, durationTicks: 60 },
          { command: "ApplyHaste", target: "ADJACENT_ALLY", percent: 25, durationTicks: 180 },
          { command: "ApplyHaste", target: "OWNER_ALL_CARDS", percent: 20, durationTicks: 180 },
          { command: "ApplySlow", target: "SELF", percent: 25, durationTicks: 60 },
          { command: "ApplySlow", target: "OPPOSITE_ENEMY_CARD", percent: 30, durationTicks: 180 },
          { command: "ApplySlow", target: "ENEMY_LEFTMOST_ACTIVE", percent: 25, durationTicks: 240 },
          { command: "ApplyFreeze", target: "OPPOSITE_ENEMY_CARD", durationTicks: 60 },
          { command: "ApplyFreeze", target: "ENEMY_LEFTMOST_ACTIVE", durationTicks: 60 }
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

  it("rejects malformed ApplyHaste, ApplySlow, and ApplyFreeze effects", () => {
    const result = validateCardDefinition(
      createValidActiveCard({
        effects: [
          { command: "ApplyHaste", target: "OPPOSITE_ENEMY_CARD", percent: 50, durationTicks: 60 },
          { command: "ApplyHaste", target: "SELF", durationTicks: 60 },
          { command: "ApplySlow", target: "ADJACENT_ALLY", percent: 25, durationTicks: 60 },
          { command: "ApplySlow", target: "SELF", percent: 25 },
          { command: "ApplyFreeze", target: "SELF", durationTicks: 60 },
          { command: "ApplyFreeze", target: "OPPOSITE_ENEMY_CARD", durationTicks: "soon" }
        ]
      })
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      path: "effects[0].target",
      message: "ApplyHaste target is invalid."
    });
    expect(result.errors).toContainEqual({
      path: "effects[1].percent",
      message: "ApplyHaste percent must be a number."
    });
    expect(result.errors).toContainEqual({
      path: "effects[2].target",
      message: "ApplySlow target is invalid."
    });
    expect(result.errors).toContainEqual({
      path: "effects[3].durationTicks",
      message: "ApplySlow durationTicks must be a number."
    });
    expect(result.errors).toContainEqual({
      path: "effects[4].target",
      message: "ApplyFreeze target is invalid."
    });
    expect(result.errors).toContainEqual({
      path: "effects[5].durationTicks",
      message: "ApplyFreeze durationTicks must be a number."
    });
  });

  it("validates OnStatusTicked and OnHealReceived reaction triggers", () => {
    const result = validateCardDefinition(
      createValidPassiveCard({
        triggers: [
          {
            hook: "OnStatusTicked",
            conditions: { status: "Burn", appliedByOwner: true, targetHasStatus: "Poison", sourceHasTag: "fire" },
            internalCooldownTicks: 60,
            maxTriggersPerTick: 1,
            effects: [{ command: "DealDamage", amount: 1, damageType: "FIRE" }]
          },
          {
            hook: "OnHealReceived",
            conditions: { appliedByOwner: true, healedAmountAtLeast: 1, targetHasStatus: "Burn" },
            internalCooldownTicks: 120,
            maxTriggersPerTick: 1,
            effects: [{ command: "GainArmor", amount: 2 }]
          }
        ]
      })
    );

    expect(result.valid).toBe(true);
  });

  it("rejects malformed reaction triggers", () => {
    const result = validateCardDefinition(
      createValidPassiveCard({
        triggers: [
          {
            hook: "OnStatusTicked",
            conditions: { status: "Chill" },
            maxTriggersPerTick: 1,
            effects: [{ command: "HealHP" }]
          },
          {
            hook: "OnHealReceived",
            conditions: { healedAmountAtLeast: "some" },
            internalCooldownTicks: 120,
            maxTriggersPerTick: 0,
            effects: [{ command: "GainArmor", amount: 2 }]
          }
        ] as CardDefinition["triggers"]
      })
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      path: "triggers[0].internalCooldownTicks",
      message: "OnStatusTicked internalCooldownTicks must be a positive number."
    });
    expect(result.errors).toContainEqual({
      path: "triggers[0].conditions.status",
      message: "Trigger status must be Burn or Poison."
    });
    expect(result.errors).toContainEqual({
      path: "triggers[0].effects[0].amount",
      message: "HealHP amount must be a number."
    });
    expect(result.errors).toContainEqual({
      path: "triggers[1].maxTriggersPerTick",
      message: "maxTriggersPerTick must be a positive number when present."
    });
    expect(result.errors).toContainEqual({
      path: "triggers[1].conditions.healedAmountAtLeast",
      message: "healedAmountAtLeast must be a number."
    });
  });
});
