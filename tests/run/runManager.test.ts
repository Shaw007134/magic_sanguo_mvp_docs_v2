import { describe, expect, it } from "vitest";

import { createNewRun, getRunNodes, RunManager } from "../../src/run/RunManager.js";
import type { CombatResult } from "../../src/model/result.js";

function chooseFirstShop(manager: RunManager) {
  const choice = manager.state.currentChoices.find((candidate) => candidate.type === "SHOP_CARD");
  if (!choice) {
    throw new Error("Missing shop choice.");
  }
  return manager.chooseShopOption(choice.id);
}

function chooseFirstEvent(manager: RunManager) {
  const choice = manager.state.currentChoices.find((candidate) => candidate.type === "EVENT_CARD" || candidate.type === "EVENT_GOLD");
  if (!choice) {
    throw new Error("Missing event choice.");
  }
  return manager.chooseEventOption(choice.id);
}

function chooseFirstReward(manager: RunManager) {
  const choice = manager.state.currentChoices.find((candidate) => candidate.type === "REWARD_CARD");
  if (!choice) {
    throw new Error("Missing reward choice.");
  }
  return manager.chooseRewardOption(choice.id);
}

function fakeCombatResult(winner: CombatResult["winner"]): CombatResult {
  return {
    winner,
    ticksElapsed: 1,
    playerFinalHp: winner === "ENEMY" ? 0 : 1,
    enemyFinalHp: winner === "PLAYER" ? 0 : 1,
    combatLog: [],
    replayTimeline: { events: [] },
    summary: {
      winner,
      ticksElapsed: 1,
      playerFinalHp: winner === "ENEMY" ? 0 : 1,
      enemyFinalHp: winner === "PLAYER" ? 0 : 1,
      damageByCard: {},
      statusDamage: {},
      armorGainedByCard: {},
      armorBlocked: 0,
      activationsByCard: {},
      triggerCountByCard: {},
      topContributors: []
    }
  };
}

describe("RunManager", () => {
  it("new run starts with 0 cards, 10 gold, 4 slots, and chest capacity 8", () => {
    const manager = createNewRun("start");

    expect(manager.state.ownedCards).toEqual([]);
    expect(manager.state.gold).toBe(10);
    expect(manager.state.formationSlotCount).toBe(4);
    expect(manager.state.formationSlots).toHaveLength(4);
    expect(manager.state.chestCapacity).toBe(8);
  });

  it("first two nodes are shop/event safe growth nodes", () => {
    const manager = createNewRun("safe-growth");

    expect(manager.getCurrentNode().type).toBe("SHOP");
    expect(manager.state.currentChoices.some((choice) => choice.type === "SHOP_CARD" && choice.cost <= 10)).toBe(true);
    manager.advanceToNextNode();
    expect(manager.getCurrentNode().type).toBe("EVENT");
    expect(manager.state.currentChoices.some((choice) => choice.type === "EVENT_CARD")).toBe(true);
  });

  it("run node sequence is deterministic for same seed", () => {
    expect(getRunNodes().map((node) => node.id)).toEqual(getRunNodes().map((node) => node.id));
    expect(createNewRun("same").state.currentChoices).toEqual(createNewRun("same").state.currentChoices);
  });

  it("shop purchase adds selected card and subtracts gold", () => {
    const manager = createNewRun("shop");
    const choice = manager.state.currentChoices[0];
    if (!choice || choice.type !== "SHOP_CARD") {
      throw new Error("Missing shop card.");
    }

    const result = manager.chooseShopOption(choice.id);

    expect(result.ok).toBe(true);
    expect(manager.state.ownedCards.map((card) => card.definitionId)).toContain(choice.cardDefinitionId);
    expect(manager.state.gold).toBe(10 - choice.cost);
  });

  it("reward adds selected card to ownedCards", () => {
    const manager = createNewRun("reward");
    manager.state = {
      ...manager.state,
      currentNodeIndex: 3,
      currentNode: getRunNodes()[3],
      defeatedMonsters: ["training-dummy"]
    };
    manager.state = createNewRun("reward").advanceToNextNode().state; // node 1
    manager.advanceToNextNode(); // node 2
    manager.advanceToNextNode(); // node 3 reward
    const result = chooseFirstReward(manager);

    expect(result.ok).toBe(true);
    expect(manager.state.ownedCards).toHaveLength(1);
  });

  it("cannot exceed chest capacity", () => {
    const manager = createNewRun("capacity");
    for (let index = 0; index < manager.state.chestCapacity; index += 1) {
      expect(manager.addCardToChest("rusty-blade").ok).toBe(true);
    }

    const result = manager.addCardToChest("rusty-blade");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Chest capacity is full.");
  });

  it("chest cards are derived from ownedCards not in formation", () => {
    const manager = createNewRun("chest");
    manager.addCardToChest("rusty-blade");
    const card = manager.state.ownedCards[0];
    manager.moveCardFromChestToFormation(card.instanceId, 1);

    expect(manager.getChestCards()).toEqual([]);
    manager.removeCardFromFormationToChest(card.instanceId);
    expect(manager.getChestCards()).toEqual([card]);
  });

  it("cannot place unowned card or same card multiple times", () => {
    const manager = createNewRun("ownership");

    expect(manager.moveCardFromChestToFormation("missing", 1).ok).toBe(false);
    manager.addCardToChest("rusty-blade");
    const card = manager.state.ownedCards[0];
    expect(manager.moveCardFromChestToFormation(card.instanceId, 1).ok).toBe(true);
    expect(manager.moveCardFromChestToFormation(card.instanceId, 2).ok).toBe(false);
  });

  it("cannot sell formation card and selling chest cards grants tier gold", () => {
    const manager = createNewRun("sell");
    manager.addCardToChest("rusty-blade");
    manager.addCardToChest("spark-drum");
    const bronze = manager.state.ownedCards[0];
    const silver = manager.state.ownedCards[1];
    manager.moveCardFromChestToFormation(bronze.instanceId, 1);

    expect(manager.sellCardFromChest(bronze.instanceId).ok).toBe(false);
    const beforeSilverSale = manager.state.gold;
    expect(manager.sellCardFromChest(silver.instanceId).ok).toBe(true);
    expect(manager.state.gold).toBe(beforeSilverSale + 2);
    manager.removeCardFromFormationToChest(bronze.instanceId);
    const beforeBronzeSale = manager.state.gold;
    expect(manager.sellCardFromChest(bronze.instanceId).ok).toBe(true);
    expect(manager.state.gold).toBe(beforeBronzeSale + 1);
  });

  it("selling GOLD card from chest adds 4 gold", () => {
    const manager = createNewRun("gold-sale");
    const goldCard = {
      ...(manager.cardDefinitionsById.get("rusty-blade")!),
      id: "gold-test",
      tier: "GOLD" as const
    };
    const definitions = new Map([...manager.cardDefinitionsById, [goldCard.id, goldCard]]);
    const customManager = RunManager.createNewRun("gold-sale-custom", definitions);
    customManager.addCardToChest(goldCard.id);
    const card = customManager.state.ownedCards[0];

    expect(customManager.sellCardFromChest(card.instanceId).ok).toBe(true);
    expect(customManager.state.gold).toBe(14);
  });

  it("formation references remain valid after selling another card", () => {
    const manager = createNewRun("sell-other");
    manager.addCardToChest("rusty-blade");
    manager.addCardToChest("wooden-shield");
    const placed = manager.state.ownedCards[0];
    const sold = manager.state.ownedCards[1];
    manager.moveCardFromChestToFormation(placed.instanceId, 1);
    manager.sellCardFromChest(sold.instanceId);

    expect(manager.state.formationSlots[0]?.cardInstanceId).toBe(placed.instanceId);
  });

  it("player can obtain an active card before first combat and cannot battle without one placed", () => {
    const manager = createNewRun("pre-combat");
    chooseFirstShop(manager);
    expect(manager.state.ownedCards.some((card) => manager.cardDefinitionsById.get(card.definitionId)?.type === "ACTIVE")).toBe(true);
    manager.advanceToNextNode();
    manager.advanceToNextNode();
    expect(manager.getCurrentNode().type).toBe("BATTLE");
    expect(manager.startBattle().ok).toBe(false);
    manager.moveCardFromChestToFormation(manager.state.ownedCards[0].instanceId, 1);
    expect(manager.startBattle().ok).toBe(true);
  });

  it("battle uses MonsterGenerator output and produces replay and summary", () => {
    const manager = createNewRun("battle");
    chooseFirstShop(manager);
    const card = manager.state.ownedCards[0];
    manager.moveCardFromChestToFormation(card.instanceId, 1);
    manager.advanceToNextNode();
    manager.advanceToNextNode();

    const result = manager.startBattle();

    expect(result.ok).toBe(true);
    expect(manager.state.currentEnemySnapshot?.kind).toBe("MONSTER");
    expect(manager.state.pendingBattleResult?.replayTimeline.events.length).toBeGreaterThan(0);
    expect(manager.state.pendingBattleResult?.summary.ticksElapsed).toBeGreaterThan(0);
  });

  it("run can progress to boss and boss win produces victory", () => {
    const manager = createNewRun("boss");
    while (manager.getCurrentNode().id !== "boss-1") {
      manager.advanceToNextNode();
    }
    manager.state = {
      ...manager.state,
      pendingBattleResult: fakeCombatResult("PLAYER"),
      currentEnemySnapshot: {
        id: "monster:gate-captain:9",
        kind: "BOSS",
        displayName: "First Boss: Gate Captain",
        level: 9,
        maxHp: 1,
        startingArmor: 0,
        slots: [],
        skills: [],
        relics: [],
        aiProfile: { id: "gate-captain" }
      }
    };

    expect(manager.completeBattle().ok).toBe(true);
    expect(manager.state.status).toBe("VICTORY");
  });

  it("player defeat and DRAW are treated as defeat", () => {
    for (const winner of ["ENEMY", "DRAW"] as const) {
      const manager = createNewRun(`defeat-${winner}`);
      manager.advanceToNextNode();
      manager.advanceToNextNode();
      manager.state = {
        ...manager.state,
        pendingBattleResult: fakeCombatResult(winner)
      };

      expect(manager.completeBattle().ok).toBe(true);
      expect(manager.state.status).toBe("DEFEAT");
    }
  });

  it("same seed produces same shop choices, reward choices, and monster setup", () => {
    const first = createNewRun("deterministic");
    const second = createNewRun("deterministic");

    expect(second.state.currentChoices).toEqual(first.state.currentChoices);
    first.advanceToNextNode();
    first.advanceToNextNode();
    first.advanceToNextNode();
    second.advanceToNextNode();
    second.advanceToNextNode();
    second.advanceToNextNode();
    expect(second.state.currentChoices).toEqual(first.state.currentChoices);

    const battleA = createNewRun("monster-setup");
    const battleB = createNewRun("monster-setup");
    battleA.advanceToNextNode();
    battleA.advanceToNextNode();
    battleB.advanceToNextNode();
    battleB.advanceToNextNode();
    battleA.addCardToChest("rusty-blade");
    battleB.addCardToChest("rusty-blade");
    battleA.moveCardFromChestToFormation(battleA.state.ownedCards[0].instanceId, 1);
    battleB.moveCardFromChestToFormation(battleB.state.ownedCards[0].instanceId, 1);
    battleA.startBattle();
    battleB.startBattle();

    expect(battleB.state.currentEnemySnapshot).toEqual(battleA.state.currentEnemySnapshot);
  });
});
