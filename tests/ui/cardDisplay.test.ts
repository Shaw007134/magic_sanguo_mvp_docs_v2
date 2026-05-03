import { describe, expect, it } from "vitest";

import { getMonsterCardDefinitionsById } from "../../src/content/cards/monsterCards.js";
import { getCardDisplayInfo } from "../../src/ui/presentation/cardDisplay.js";

const cardsById = getMonsterCardDefinitionsById();

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
    expect(display("flame-spear").summary).toBe("Damage: 1 · Burn: 2 damage/sec for 2s");
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

  it("formats whole-second cooldown modifications without raw tick suffixes", () => {
    const card = {
      ...cardsById.get("spark-drum")!,
      effects: [{ command: "ModifyCooldown", amountTicks: -60 }]
    };

    expect(getCardDisplayInfo(card).summary).toBe("Cooldown: -1s");
  });
});
