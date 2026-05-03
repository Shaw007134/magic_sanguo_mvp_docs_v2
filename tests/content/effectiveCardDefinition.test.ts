import { describe, expect, it } from "vitest";

import {
  describeUpgradePreview,
  getEffectiveCardDefinition,
  hasMeaningfulUpgrade
} from "../../src/content/cards/effectiveCardDefinition.js";
import { getMonsterCardDefinitionsById } from "../../src/content/cards/monsterCards.js";

const cardDefinitionsById = getMonsterCardDefinitionsById();

describe("effective card definitions", () => {
  it("Rusty Blade SILVER -> GOLD changes at least one stat", () => {
    const baseDefinition = cardDefinitionsById.get("rusty-blade");
    if (!baseDefinition) {
      throw new Error("Missing rusty-blade.");
    }
    const silver = getEffectiveCardDefinition(
      { instanceId: "rusty", definitionId: "rusty-blade", tierOverride: "SILVER" },
      baseDefinition
    );
    const gold = getEffectiveCardDefinition(
      { instanceId: "rusty", definitionId: "rusty-blade", tierOverride: "GOLD" },
      baseDefinition
    );

    expect(silver.effects?.[0]?.["amount"]).toBe(3);
    expect(gold.effects?.[0]?.["amount"]).toBe(4);
  });

  it("upgrade preview omits unchanged cooldown and keeps changed stats", () => {
    const baseDefinition = cardDefinitionsById.get("rusty-blade");
    if (!baseDefinition) {
      throw new Error("Missing rusty-blade.");
    }
    const preview = describeUpgradePreview({
      card: { instanceId: "rusty", definitionId: "rusty-blade", tierOverride: "SILVER" },
      baseDefinition,
      toTier: "GOLD"
    });

    expect(preview).toBe("Damage 3 -> 4");
    expect(preview).not.toContain("Cooldown");
  });

  it("meaningful upgrade helper rejects no-op tier comparisons", () => {
    const baseDefinition = cardDefinitionsById.get("rusty-blade");
    if (!baseDefinition) {
      throw new Error("Missing rusty-blade.");
    }

    expect(
      hasMeaningfulUpgrade({
        card: { instanceId: "rusty", definitionId: "rusty-blade", tierOverride: "SILVER" },
        baseDefinition,
        toTier: "GOLD"
      })
    ).toBe(true);
    expect(
      hasMeaningfulUpgrade({
        card: { instanceId: "rusty", definitionId: "rusty-blade", tierOverride: "SILVER" },
        baseDefinition,
        toTier: "SILVER"
      })
    ).toBe(false);
  });
});
