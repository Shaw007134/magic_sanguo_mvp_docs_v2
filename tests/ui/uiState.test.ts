import { describe, expect, it } from "vitest";

import { CombatEngine } from "../../src/combat/CombatEngine.js";
import { getMonsterCardDefinitionsById } from "../../src/content/cards/monsterCards.js";
import { MonsterGenerator } from "../../src/content/monsters/MonsterGenerator.js";
import { getMonsterTemplateById } from "../../src/content/monsters/monsterTemplates.js";
import type { CardDefinition, CardInstance } from "../../src/model/card.js";
import {
  createEmptyFormationSlots,
  createFormationSnapshotFromUi,
  getChestCapacity,
  getChestCards,
  moveCardFromChestToFormation,
  removeCardFromFormation,
  sellCardFromChest,
  type UiInventoryState
} from "../../src/ui/state/uiState.js";

const cardDefinitionsById = getMonsterCardDefinitionsById();

function cardInstance(instanceId: string, definitionId: string): CardInstance {
  return { instanceId, definitionId };
}

function state(cards: readonly CardInstance[] = [cardInstance("bronze", "rusty-blade")]): UiInventoryState {
  return {
    gold: 10,
    ownedCards: cards,
    formationSlots: createEmptyFormationSlots()
  };
}

describe("uiState", () => {
  it("chest capacity equals formation slot count times 2", () => {
    expect(getChestCapacity(4)).toBe(8);
  });

  it("selling BRONZE card adds 1 gold and removes card from chest", () => {
    const result = sellCardFromChest(state(), "bronze", cardDefinitionsById);

    expect(result.gold).toBe(11);
    expect(getChestCards(result)).toEqual([]);
  });

  it("selling SILVER card adds 2 gold", () => {
    const result = sellCardFromChest(state([cardInstance("silver", "spark-drum")]), "silver", cardDefinitionsById);

    expect(result.gold).toBe(12);
  });

  it("selling GOLD card adds 4 gold", () => {
    const goldCard: CardDefinition = {
      ...(cardDefinitionsById.get("rusty-blade") as CardDefinition),
      id: "gold-test-card",
      tier: "GOLD"
    };
    const definitions = new Map([...cardDefinitionsById, [goldCard.id, goldCard]]);
    const result = sellCardFromChest(state([cardInstance("gold", goldCard.id)]), "gold", definitions);

    expect(result.gold).toBe(14);
  });

  it("card in formation cannot be sold directly", () => {
    const placed = moveCardFromChestToFormation(state(), "bronze", 1, cardDefinitionsById);
    const result = sellCardFromChest(placed, "bronze", cardDefinitionsById);

    expect(result).toBe(placed);
    expect(result.gold).toBe(10);
  });

  it("moving card from chest to formation removes it from chest display", () => {
    const result = moveCardFromChestToFormation(state(), "bronze", 1, cardDefinitionsById);

    expect(getChestCards(result)).toEqual([]);
    expect(result.formationSlots[0]?.cardInstanceId).toBe("bronze");
  });

  it("removing card from formation returns it to chest if capacity allows", () => {
    const placed = moveCardFromChestToFormation(state(), "bronze", 1, cardDefinitionsById);
    const result = removeCardFromFormation(placed, "bronze");

    expect(getChestCards(result).map((card) => card.instanceId)).toEqual(["bronze"]);
    expect(result.formationSlots[0]?.cardInstanceId).toBeUndefined();
  });

  it("generated formation can still be passed into CombatEngine", () => {
    const monsterTemplate = getMonsterTemplateById("rust-bandit");
    if (!monsterTemplate) {
      throw new Error("Missing rust-bandit template.");
    }
    const monster = new MonsterGenerator().generate({
      template: monsterTemplate,
      seed: "ui-combat",
      day: 3,
      cardDefinitionsById
    });
    const playerState = moveCardFromChestToFormation(state(), "bronze", 1, cardDefinitionsById);
    const playerFormation = createFormationSnapshotFromUi({
      id: "player",
      displayName: "Player",
      maxHp: 40,
      startingArmor: 0,
      formationSlots: playerState.formationSlots
    });

    const result = new CombatEngine().simulate({
      playerFormation,
      enemyFormation: monster.formation,
      cardInstancesById: new Map([
        ...playerState.ownedCards.map((card) => [card.instanceId, card] as const),
        ...monster.cardInstances.map((card) => [card.instanceId, card] as const)
      ]),
      cardDefinitionsById,
      maxCombatTicks: 120
    });

    expect(result.replayTimeline.events.some((event) => event.type === "CombatStarted")).toBe(true);
    expect(result.summary.ticksElapsed).toBeGreaterThan(0);
  });
});
