import { describe, expect, it } from "vitest";

import { getActiveCardDefinitionsById } from "../../src/content/cards/activeCards.js";
import { getCardDisplayInfo } from "../../src/ui/presentation/cardDisplay.js";

const cardsById = getActiveCardDefinitionsById();

function display(cardId: string) {
  const card = cardsById.get(cardId);
  if (!card) {
    throw new Error(`Missing card ${cardId}`);
  }
  return getCardDisplayInfo(card);
}

describe("cardDisplay", () => {
  it("summarizes Rusty Blade", () => {
    expect(display("rusty-blade")).toMatchObject({
      name: "Rusty Blade",
      typeLabel: "Active",
      tier: "Bronze",
      size: 1,
      cooldown: 45,
      summary: "Damage: 2"
    });
  });

  it("summarizes Wooden Shield", () => {
    expect(display("wooden-shield").summary).toBe("Armor: 3");
  });

  it("summarizes Flame Spear", () => {
    expect(display("flame-spear").summary).toBe("Damage: 1 · Burn: 2 for 2s; deals current Burn per sec, then loses 1");
    expect(display("flame-spear").summary).not.toMatch(/\d+t\b|tick/i);
  });

  it("summarizes Spark Drum", () => {
    expect(display("spark-drum")).toMatchObject({
      typeLabel: "Active",
      size: 2,
      summary: "Cooldown: -0.5s"
    });
    expect(display("spark-drum").summary).not.toMatch(/\d+t\b|tick/i);
  });

  it("summarizes Fire Echo Seal", () => {
    expect(display("fire-echo-seal")).toMatchObject({
      typeLabel: "Passive",
      summary: "When you apply Burn: Damage: 1."
    });
    expect(display("fire-echo-seal").summary).not.toContain("OnStatusApplied");
    expect(display("fire-echo-seal").summary).not.toMatch(/On(Card|Damage|Burn|Cooldown|Combat|Status)|hook/i);
  });

  it("summarizes Poison and Heal cards without raw tick labels", () => {
    expect(display("poison-needle").summary).toBe("Poison: 1 damage/sec; does not decay");
    expect(display("field-medic").summary).toBe("Heal: 5 HP");
    expect(display("toxic-lance").summary).toBe("Physical damage: 2 · Poison: 1 damage/sec; does not decay");
    expect(display("poison-needle").summary).not.toMatch(/\d+t\b|tick|On[A-Z]|hook/i);
  });

  it("summarizes Haste, Slow, and Freeze cards without raw tick labels", () => {
    expect(display("war-chant").summary).toBe("Haste adjacent active allies by 25% for 3s");
    expect(display("command-banner").summary).toBe("Haste all your active cards by 20% for 3s");
    expect(display("mud-trap").summary).toBe("Slow the opposite enemy active card by 30% for 3s");
    expect(display("frost-chain").summary).toBe("Freeze the opposite enemy active card for 1s");
    expect(display("cold-spear").summary).toBe("Physical damage: 2 · Freeze the opposite enemy active card for 1s");
    expect(display("heavy-net").summary).toBe("Slow the leftmost enemy active card by 25% for 4s");
    expect(display("war-chant").summary).not.toMatch(/\d+t\b|tick|On[A-Z]|hook/i);
  });

  it("summarizes reaction cards with readable hooks and seconds", () => {
    expect(display("venom-leech").summary).toBe("When your Poison deals damage: Heal: 1 HP. Limited to every 1s.");
    expect(display("toxic-flame-seal").summary).toBe("When your Burn deals damage: Fire damage: 1. Limited to every 1s.");
    expect(display("field-triage").summary).toBe("When you heal: Armor: 2. Limited to every 2s.");
    expect(display("poisoned-net").summary).toBe("When your Poison deals damage: Slow the leftmost enemy active card by 15% for 1s. Limited to every 3s.");
    expect(display("burning-remedy").summary).not.toMatch(/\d+t\b|tick|On[A-Z]|hook/i);
  });

  it("formats whole-second cooldown modifications without raw tick suffixes", () => {
    const card = {
      ...cardsById.get("spark-drum")!,
      effects: [{ command: "ModifyCooldown", amountTicks: -60 }]
    };

    expect(getCardDisplayInfo(card).summary).toBe("Cooldown: -1s");
  });

  it("summarizes crit and execution text without internal ids", () => {
    const summary = display("execution-halberd").summary;

    expect(summary).toContain("25% chance to crit for 2x");
    expect(summary).toContain("if enemy is below 35% HP, 2x damage");
    expect(summary).not.toMatch(/TARGET_|OWNER_|conditionalMultiplier|critChancePercent|tick/i);
  });

  it("summarizes terminal scaling text readably", () => {
    expect(display("iron-bastion-strike").summary).toContain("100% of your Armor");
    expect(display("warlords-mandate").summary).toContain("20% of your max HP");
    expect(display("burning-trebuchet").summary).toContain("20% of enemy missing HP");
    expect(display("burning-trebuchet").summary).toContain("20% chance to crit for 2x");
  });
});
