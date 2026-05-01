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
      tier: "BRONZE",
      size: 1,
      cooldown: 45,
      summary: "Damage: 2"
    });
  });

  it("summarizes Wooden Shield", () => {
    expect(display("wooden-shield").summary).toBe("Armor: 3");
  });

  it("summarizes Flame Spear", () => {
    expect(display("flame-spear").summary).toBe("Damage: 1 · Burn: 2 / 120t");
  });

  it("summarizes Spark Drum", () => {
    expect(display("spark-drum")).toMatchObject({
      typeLabel: "Active",
      size: 2,
      summary: "Cooldown: -30t"
    });
  });

  it("summarizes Fire Echo Seal", () => {
    expect(display("fire-echo-seal")).toMatchObject({
      typeLabel: "Passive",
      summary: "Trigger: OnStatusApplied -> Damage: 1"
    });
  });
});
