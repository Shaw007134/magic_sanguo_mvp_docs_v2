import { describe, expect, it } from "vitest";

import {
  BRONZE_FLAME_BURN_BONUS,
  BRONZE_IRON_ARMOR_BONUS,
  BRONZE_VITAL_HEAL_BONUS,
  describeUpgradePreview,
  getEffectiveCardDefinition,
  hasMeaningfulUpgrade
} from "../../src/content/cards/effectiveCardDefinition.js";
import { getActiveCardDefinitionsById } from "../../src/content/cards/activeCards.js";
import { getMonsterCardDefinitionsById } from "../../src/content/cards/monsterCards.js";

const cardDefinitionsById = getMonsterCardDefinitionsById();
const activeCardsById = getActiveCardDefinitionsById();

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

  it("card enhancements apply after tier scaling and cap cooldown reduction", () => {
    const baseDefinition = cardDefinitionsById.get("rusty-blade");
    if (!baseDefinition) {
      throw new Error("Missing rusty-blade.");
    }

    const effective = getEffectiveCardDefinition(
      {
        instanceId: "rusty",
        definitionId: "rusty-blade",
        tierOverride: "SILVER",
        enhancements: [
          {
            id: "damage",
            sourceRewardCardDefinitionId: "sharpened-edge",
            type: "INCREASE_DAMAGE",
            amount: 1
          },
          {
            id: "cooldown-a",
            sourceRewardCardDefinitionId: "precision-gear",
            type: "REDUCE_COOLDOWN_PERCENT",
            percent: 30
          },
          {
            id: "cooldown-b",
            sourceRewardCardDefinitionId: "precision-gear",
            type: "REDUCE_COOLDOWN_PERCENT",
            percent: 30
          }
        ]
      },
      baseDefinition
    );

    expect(effective.effects?.[0]?.["amount"]).toBe(4);
    expect(effective.cooldownTicks).toBe(30);
  });

  it("Bronze Iron adds a small armor effect to eligible active damage cards", () => {
    const baseDefinition = activeCardsById.get("rusty-blade")!;
    const effective = getEffectiveCardDefinition(
      {
        instanceId: "rusty",
        definitionId: "rusty-blade",
        enchantment: {
          id: "iron",
          enchantmentDefinitionId: "bronze-iron-edge",
          sourceEventChoiceId: "event-25-enchantment-0",
          attachedAtNodeIndex: 25
        }
      },
      baseDefinition
    );

    expect(effective.effects).toEqual([
      { command: "DealDamage", amount: 2 },
      { command: "GainArmor", amount: BRONZE_IRON_ARMOR_BONUS }
    ]);
  });

  it("Bronze Flame stacks with Phase 15D Burn reward enhancements without changing reward data", () => {
    const baseDefinition = activeCardsById.get("oil-flask")!;
    const card = {
      instanceId: "oil",
      definitionId: "oil-flask",
      enhancements: [{
        id: "ember",
        sourceRewardCardDefinitionId: "ember-powder",
        type: "INCREASE_BURN" as const,
        amount: 1
      }],
      enchantment: {
        id: "flame",
        enchantmentDefinitionId: "bronze-flame-spark",
        sourceEventChoiceId: "event-25-enchantment-1",
        attachedAtNodeIndex: 25
      }
    };

    const effective = getEffectiveCardDefinition(card, baseDefinition);
    expect(effective.effects?.find((effect) => effect["command"] === "ApplyBurn")?.["amount"])
      .toBe(2 + 1 + BRONZE_FLAME_BURN_BONUS);
    expect(card.enhancements?.[0]).toEqual({
      id: "ember",
      sourceRewardCardDefinitionId: "ember-powder",
      type: "INCREASE_BURN",
      amount: 1
    });
  });

  it("Bronze Vital adds a small heal bonus to eligible active heal cards", () => {
    const baseDefinition = activeCardsById.get("field-medic")!;
    const effective = getEffectiveCardDefinition(
      {
        instanceId: "medic",
        definitionId: "field-medic",
        enchantment: {
          id: "vital",
          enchantmentDefinitionId: "bronze-vital-thread",
          sourceEventChoiceId: "event-25-enchantment-2",
          attachedAtNodeIndex: 25
        }
      },
      baseDefinition
    );

    expect(effective.effects?.find((effect) => effect["command"] === "HealHP")?.["amount"])
      .toBe(5 + BRONZE_VITAL_HEAL_BONUS);
  });
});
