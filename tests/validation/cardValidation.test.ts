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
});
