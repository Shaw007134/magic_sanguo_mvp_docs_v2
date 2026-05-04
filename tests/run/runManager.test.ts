import { describe, expect, it } from "vitest";

import type { CombatResult } from "../../src/model/result.js";
import { createNewRun, getRunNodes, RunManager } from "../../src/run/RunManager.js";

function chooseFirstShop(manager: RunManager) {
  const choice = manager.state.currentChoices.find((candidate) => candidate.type === "SHOP_CARD");
  if (!choice) {
    throw new Error("Missing shop choice.");
  }
  return manager.chooseShopOption(choice.id);
}

function leaveShop(manager: RunManager) {
  const result = manager.leaveShop();
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to leave shop.");
  }
  return result;
}

function chooseFirstEvent(manager: RunManager) {
  const choice = manager.state.currentChoices.find((candidate) => candidate.type === "EVENT_CARD" || candidate.type === "EVENT_GOLD");
  if (!choice) {
    throw new Error("Missing event choice.");
  }
  return manager.chooseEventOption(choice.id);
}

function chooseFirstReward(manager: RunManager) {
  const choice = manager.state.currentChoices.find((candidate) => candidate.type.startsWith("REWARD"));
  if (!choice) {
    throw new Error("Missing reward choice.");
  }
  return manager.chooseRewardOption(choice.id);
}

function chooseFirstLevelReward(manager: RunManager) {
  const choice = manager.state.pendingLevelUpChoices[0];
  if (!choice) {
    throw new Error("Missing level-up choice.");
  }
  return manager.chooseLevelUpReward(choice.id);
}

function fakeCombatResult(winner: CombatResult["winner"], playerFinalHp = 12): CombatResult {
  return {
    winner,
    ticksElapsed: 60,
    playerFinalHp: winner === "ENEMY" ? 0 : playerFinalHp,
    enemyFinalHp: winner === "PLAYER" ? 0 : 1,
    combatLog: [],
    replayTimeline: { events: [{ tick: 60, type: "CombatEnded" }] },
    summary: {
      winner,
      ticksElapsed: 60,
      playerFinalHp: winner === "ENEMY" ? 0 : playerFinalHp,
      enemyFinalHp: winner === "PLAYER" ? 0 : 1,
      damageByCard: {},
      statusDamage: {},
      statusDamageByCard: {},
      armorGainedByCard: {},
      armorBlocked: 0,
      activationsByCard: {},
      triggerCountByCard: {},
      topContributors: []
    }
  };
}

function reachFirstBattle(manager: RunManager) {
  chooseFirstShop(manager);
  leaveShop(manager);
  chooseFirstEvent(manager);
  expect(manager.getCurrentNode().type).toBe("BATTLE");
}

function completeFakeBattleWin(manager: RunManager, playerFinalHp = 12) {
  manager.state = {
    ...manager.state,
    pendingCombatResult: fakeCombatResult("PLAYER", playerFinalHp),
    pendingBattleResult: fakeCombatResult("PLAYER", playerFinalHp),
    currentEnemySnapshot: {
      id: "monster:training-dummy:2",
      kind: "MONSTER",
      displayName: "Training Dummy",
      level: 2,
      maxHp: 1,
      startingArmor: 0,
      slots: [],
      skills: [],
      relics: [],
      aiProfile: { id: "training-dummy" }
    },
    currentEnemyCardInstances: [{ instanceId: "dummy-staff", definitionId: "training-staff" }]
  };
  return manager.completeBattle();
}

function firstDamageAmount(result: CombatResult, sourceId: string): number {
  const event = result.replayTimeline.events.find((candidate) => (
    candidate.type === "DamageDealt" && candidate.sourceId === sourceId
  ));
  return typeof event?.payload?.["amount"] === "number" ? event.payload["amount"] : 0;
}

describe("RunManager", () => {
  it("new run starts with MVP resources and first two safe growth nodes", () => {
    const manager = createNewRun("start");

    expect(manager.state.level).toBe(1);
    expect(manager.state.exp).toBe(0);
    expect(manager.state.expToNextLevel).toBe(10);
    expect(manager.state.gold).toBe(10);
    expect(manager.state.ownedCards).toEqual([]);
    expect(manager.state.formationSlotCount).toBe(4);
    expect(manager.state.formationSlots).toHaveLength(4);
    expect(manager.state.chestCapacity).toBe(8);
    expect(manager.state.maxHp).toBe(40);
    expect(manager.state.currentHp).toBe(40);
    expect(manager.getCurrentNode().type).toBe("SHOP");
    expect(manager.state.currentChoices.some((choice) => choice.type === "SHOP_CARD" && choice.cost <= 10)).toBe(true);
    chooseFirstShop(manager);
    expect(manager.getCurrentNode().type).toBe("SHOP");
    leaveShop(manager);
    expect(manager.getCurrentNode().type).toBe("EVENT");
  });

  it("resolving shop/event gives 1 exp and winning battle gives total 4 exp", () => {
    const manager = createNewRun("exp");

    chooseFirstShop(manager);
    expect(manager.state.exp).toBe(0);
    leaveShop(manager);
    expect(manager.state.exp).toBe(1);
    chooseFirstEvent(manager);
    expect(manager.state.exp).toBe(2);
    completeFakeBattleWin(manager, 9);

    expect(manager.state.exp).toBe(6);
    expect(manager.state.currentHp).toBe(9);
    expect(manager.state.defeatedBattleCount).toBe(1);
    expect(manager.getCurrentNode().type).toBe("REWARD");
  });

  it("10 exp triggers one level-up, increases HP by 10 percent rounded up, heals, and caps at 10", () => {
    const manager = createNewRun("level");

    manager.gainExp(10, "test");

    expect(manager.state.level).toBe(2);
    expect(manager.state.exp).toBe(0);
    expect(manager.state.maxHp).toBe(44);
    expect(manager.state.currentHp).toBe(44);
    expect(manager.state.currentNode.type).toBe("LEVEL_UP_REWARD");
    expect(manager.state.pendingLevelUpChoices).toHaveLength(3);

    manager.gainExp(200, "test");
    while (manager.state.pendingLevelUpChoices.length > 0) {
      chooseFirstLevelReward(manager);
    }
    expect(manager.state.level).toBe(10);
    expect(manager.state.exp).toBeLessThan(10);
  });

  it("level-up pauses progression until a reward is selected", () => {
    const manager = createNewRun("level-pause");
    manager.gainExp(10, "test");

    expect(manager.state.currentNode.type).toBe("LEVEL_UP_REWARD");
    expect(manager.state.pendingLevelUpChoices.map((choice) => choice.type)).toEqual([
      "LEVEL_SKILL",
      "LEVEL_GOLD",
      "LEVEL_CARD"
    ]);
    expect(manager.state.currentNodeIndex).toBe(0);
    expect(manager.getCurrentNode().type).toBe("LEVEL_UP_REWARD");

    const goldBefore = manager.state.gold;
    const goldChoice = manager.state.pendingLevelUpChoices.find((choice) => choice.type === "LEVEL_GOLD");
    expect(goldChoice).toBeDefined();
    expect(manager.chooseLevelUpReward(goldChoice!.id).ok).toBe(true);
    expect(manager.state.gold).toBeGreaterThan(goldBefore);
    expect(manager.getCurrentNode().type).toBe("SHOP");
  });

  it("level-up upgrade upgrades a card and level-up skill adds to ownedSkills", () => {
    const upgradeManager = createNewRun("level-up-upgrade");
    upgradeManager.addCardToChest("rusty-blade");
    upgradeManager.gainExp(10, "test");
    const upgradeChoice = upgradeManager.state.pendingLevelUpChoices.find((choice) => choice.type === "LEVEL_UPGRADE");
    expect(upgradeChoice).toBeDefined();
    expect(upgradeChoice?.preview).toBeTruthy();
    expect(upgradeManager.chooseLevelUpReward(upgradeChoice!.id).ok).toBe(true);
    expect(upgradeManager.state.ownedCards[0]?.tierOverride).toBe("SILVER");

    const skillManager = createNewRun("level-up-skill");
    skillManager.gainExp(10, "test");
    const skillChoice = skillManager.state.pendingLevelUpChoices.find((choice) => choice.type === "LEVEL_SKILL");
    expect(skillChoice).toBeDefined();
    expect(skillManager.chooseLevelUpReward(skillChoice!.id).ok).toBe(true);
    expect(skillManager.state.ownedSkills).toHaveLength(1);
  });

  it("shop purchase, reward card, chest derivation, formation moves, and capacity are enforced", () => {
    const manager = createNewRun("inventory");
    chooseFirstShop(manager);
    expect(manager.state.gold).toBe(10);
    expect(manager.state.ownedCards).toHaveLength(1);
    const card = manager.state.ownedCards[0];

    expect(manager.moveCardFromChestToFormation(card.instanceId, 1).ok).toBe(true);
    expect(manager.getChestCards()).toEqual([]);
    expect(manager.removeCardFromFormationToChest(card.instanceId).ok).toBe(true);
    expect(manager.getChestCards()).toEqual([card]);

    leaveShop(manager);
    chooseFirstEvent(manager);
    expect(manager.getCurrentNode().type).toBe("BATTLE");
    completeFakeBattleWin(manager);
    const rewardChoice = manager.state.currentChoices.find((choice) => choice.type === "REWARD_CARD");
    expect(rewardChoice).toBeDefined();
    expect(chooseFirstReward(manager).ok).toBe(true);
    expect(manager.state.ownedCards.length).toBeGreaterThan(1);

    while (manager.state.ownedCards.length < manager.state.chestCapacity) {
      expect(manager.addCardToChest("rusty-blade").ok).toBe(true);
    }
    expect(manager.addCardToChest("rusty-blade").ok).toBe(false);
  });

  it("shop can buy multiple cards and leave grants shop exp once", () => {
    const manager = createNewRun("multi-shop");
    const choices = manager.state.currentChoices.filter((choice) => choice.type === "SHOP_CARD");

    expect(manager.chooseShopOption(choices[0]!.id).ok).toBe(true);
    expect(manager.getCurrentNode().type).toBe("SHOP");
    const purchasedChoice = manager.state.currentChoices.find(
      (choice): choice is typeof choices[number] => choice.id === choices[0]!.id && choice.type === "SHOP_CARD"
    );
    expect(purchasedChoice?.purchased).toBe(true);
    expect(manager.chooseShopOption(choices[1]!.id).ok).toBe(true);
    expect(manager.state.ownedCards).toHaveLength(2);

    expect(manager.leaveShop().ok).toBe(true);
    expect(manager.state.exp).toBe(1);
    expect(manager.getCurrentNode().type).toBe("EVENT");
    manager.state = { ...manager.state, currentNode: { id: "starter-shop-1", type: "SHOP", day: 1, label: "Starter Shop" }, currentNodeIndex: 0 };
    expect(manager.leaveShop().ok).toBe(true);
    expect(manager.state.exp).toBe(1);
  });

  it("buying duplicate same-tier shop card upgrades existing card and does not add duplicate", () => {
    const manager = createNewRun("shop-duplicate");
    manager.addCardToChest("rusty-blade");
    const result = chooseFirstShop(manager);

    expect(result.ok).toBe(true);
    expect(result.message).toContain("Duplicate Rusty Blade upgraded existing Rusty Blade: BRONZE -> SILVER");
    expect(manager.state.ownedCards).toHaveLength(1);
    expect(manager.state.ownedCards[0]?.tierOverride).toBe("SILVER");
  });

  it("event and reward duplicate card grants upgrade existing cards", () => {
    const eventManager = createNewRun("event-duplicate");
    eventManager.addCardToChest("rusty-blade");
    eventManager.advanceToNextNode();
    const eventChoice = eventManager.state.currentChoices.find(
      (choice) => choice.type === "EVENT_CARD" && choice.cardDefinitionId === "rusty-blade"
    );
    expect(eventChoice).toBeDefined();
    expect(eventManager.chooseEventOption(eventChoice!.id).ok).toBe(true);
    expect(eventManager.state.ownedCards).toHaveLength(1);
    expect(eventManager.state.ownedCards[0]?.tierOverride).toBe("SILVER");

    const rewardManager = createNewRun("reward-duplicate");
    rewardManager.addCardToChest("training-staff");
    reachFirstBattle(rewardManager);
    completeFakeBattleWin(rewardManager);
    const rewardChoice = rewardManager.state.currentChoices.find(
      (choice) => choice.type === "REWARD_CARD" && choice.cardDefinitionId === "training-staff"
    );
    expect(rewardChoice).toBeDefined();
    expect(rewardManager.chooseRewardOption(rewardChoice!.id).ok).toBe(true);
    expect(rewardManager.state.ownedCards).toHaveLength(2);
    expect(rewardManager.state.ownedCards.find((card) => card.definitionId === "training-staff")?.tierOverride).toBe("SILVER");
  });

  it("non-duplicate card is added normally and max-tier duplicate can add when capacity allows", () => {
    const manager = createNewRun("non-duplicate");
    manager.addCardToChest("rusty-blade");
    expect(manager.gainCardOrUpgradeDuplicate("wooden-shield").ok).toBe(true);
    expect(manager.state.ownedCards.map((card) => card.definitionId)).toEqual(["rusty-blade", "wooden-shield"]);

    const celestialCard = {
      ...manager.cardDefinitionsById.get("rusty-blade")!,
      id: "celestial-blade",
      tier: "CELESTIAL" as const
    };
    const customManager = RunManager.createNewRun(
      "max-tier-duplicate",
      new Map([...manager.cardDefinitionsById, [celestialCard.id, celestialCard]])
    );
    customManager.addCardToChest(celestialCard.id);
    expect(customManager.gainCardOrUpgradeDuplicate(celestialCard.id).ok).toBe(true);
    expect(customManager.state.ownedCards).toHaveLength(2);
  });

  it("cannot place unowned or duplicate cards, and removing from formation works at full capacity", () => {
    const manager = createNewRun("formation");
    expect(manager.moveCardFromChestToFormation("missing", 1).ok).toBe(false);
    for (let index = 0; index < manager.state.chestCapacity; index += 1) {
      manager.addCardToChest("rusty-blade");
    }
    const card = manager.state.ownedCards[0];
    expect(manager.moveCardFromChestToFormation(card.instanceId, 1).ok).toBe(true);
    expect(manager.moveCardFromChestToFormation(card.instanceId, 2).ok).toBe(false);
    expect(manager.removeCardFromFormationToChest(card.instanceId).ok).toBe(true);
  });

  it("selling is chest-only and uses tier prices including upgrades", () => {
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

    manager.addCardToChest("rusty-blade");
    const upgraded = manager.state.ownedCards[0];
    manager.state = {
      ...manager.state,
      ownedCards: [{ ...upgraded, tierOverride: "GOLD" }]
    };
    const beforeGoldSale = manager.state.gold;
    expect(manager.sellCardFromChest(upgraded.instanceId).ok).toBe(true);
    expect(manager.state.gold).toBe(beforeGoldSale + 4);
  });

  it("first combat cannot start without an active card in formation, then uses MonsterGenerator and returns replay/summary", () => {
    const manager = createNewRun("battle");
    reachFirstBattle(manager);

    expect(manager.startBattle().ok).toBe(false);
    manager.moveCardFromChestToFormation(manager.state.ownedCards[0].instanceId, 1);
    const result = manager.startBattle();

    expect(result.ok).toBe(true);
    expect(manager.state.currentEnemySnapshot?.kind).toBe("MONSTER");
    expect(manager.state.pendingCombatResult?.replayTimeline.events.length).toBeGreaterThan(0);
    expect(manager.state.pendingCombatResult?.summary.ticksElapsed).toBeGreaterThan(0);
  });

  it("battle reward includes at least one option from monster rewardPool if possible", () => {
    const manager = createNewRun("reward-pool");
    reachFirstBattle(manager);
    completeFakeBattleWin(manager);

    expect(manager.getCurrentNode().type).toBe("REWARD");
    expect(manager.state.currentChoices.some((choice) => choice.type === "REWARD_CARD" && choice.cardDefinitionId === "rusty-blade")).toBe(true);
  });

  it("battle reward choices do not include direct upgrade rewards", () => {
    const manager = createNewRun("reward-no-direct-upgrade");
    manager.addCardToChest("rusty-blade");
    reachFirstBattle(manager);
    completeFakeBattleWin(manager);

    expect(manager.state.currentChoices.some((choice) => choice.type === "REWARD_UPGRADE")).toBe(false);
  });

  it("battle victory reveals reward source and can prioritize monster-used cards", () => {
    const manager = createNewRun("reward-reveal");
    reachFirstBattle(manager);
    completeFakeBattleWin(manager);

    expect(manager.state.pendingRewardSource?.defeatedMonsterName).toBe("Training Dummy");
    expect(manager.state.pendingRewardChoices.length).toBeGreaterThan(0);
    expect(manager.state.currentChoices.some((choice) => choice.type === "REWARD_CARD" && choice.cardDefinitionId === "training-staff")).toBe(true);
  });

  it("selecting a duplicate dropped card auto-upgrades the existing owned card", () => {
    const manager = createNewRun("duplicate-drop-upgrade");
    manager.addCardToChest("training-staff");
    reachFirstBattle(manager);
    completeFakeBattleWin(manager);

    const rewardChoice = manager.state.currentChoices.find(
      (choice) => choice.type === "REWARD_CARD" && choice.cardDefinitionId === "training-staff"
    );
    expect(rewardChoice).toBeDefined();
    const result = manager.chooseRewardOption(rewardChoice!.id);

    expect(result.ok).toBe(true);
    expect(result.message).toContain("Duplicate Training Staff upgraded existing Training Staff");
    expect(manager.state.ownedCards.filter((card) => card.definitionId === "training-staff")).toHaveLength(1);
    expect(manager.state.ownedCards.find((card) => card.definitionId === "training-staff")?.tierOverride).toBe("SILVER");
  });

  it("RunState includes owned skills and skill rewards can be learned", () => {
    const manager = createNewRun("skill-reward");
    manager.gainExp(10, "test");
    const skillChoice = manager.state.currentChoices.find((choice) => choice.type === "LEVEL_SKILL");
    expect(manager.state.ownedSkills).toEqual([]);
    expect(skillChoice).toBeDefined();
    if (!skillChoice) {
      throw new Error("Missing skill choice.");
    }

    expect(manager.chooseLevelUpReward(skillChoice.id).ok).toBe(true);
    expect(manager.state.ownedSkills).toHaveLength(1);
    expect(manager.getPlayerFormationSnapshot().skills).toEqual([
      { id: "run-skill-1", definitionId: manager.state.ownedSkills[0]?.definitionId }
    ]);
  });

  it("upgraded card affects combat result compared with base card", () => {
    const base = createNewRun("upgrade-combat-base");
    const upgraded = createNewRun("upgrade-combat-upgraded");
    for (const manager of [base, upgraded]) {
      manager.addCardToChest("rusty-blade");
      manager.moveCardFromChestToFormation(manager.state.ownedCards[0]!.instanceId, 1);
      manager.advanceToNextNode();
      manager.advanceToNextNode();
    }
    upgraded.state = {
      ...upgraded.state,
      ownedCards: [{ ...upgraded.state.ownedCards[0]!, tierOverride: "GOLD" }]
    };

    expect(base.startBattle().ok).toBe(true);
    expect(upgraded.startBattle().ok).toBe(true);
    expect(firstDamageAmount(upgraded.state.pendingCombatResult!, upgraded.state.ownedCards[0]!.instanceId))
      .toBeGreaterThan(firstDamageAmount(base.state.pendingCombatResult!, base.state.ownedCards[0]!.instanceId));
  });

  it("upgraded card affects combat result compared with previous upgraded tier", () => {
    const silver = createNewRun("upgrade-combat-silver");
    const gold = createNewRun("upgrade-combat-gold");
    for (const manager of [silver, gold]) {
      manager.addCardToChest("rusty-blade");
      manager.moveCardFromChestToFormation(manager.state.ownedCards[0]!.instanceId, 1);
      manager.advanceToNextNode();
      manager.advanceToNextNode();
    }
    silver.state = {
      ...silver.state,
      ownedCards: [{ ...silver.state.ownedCards[0]!, tierOverride: "SILVER" }]
    };
    gold.state = {
      ...gold.state,
      ownedCards: [{ ...gold.state.ownedCards[0]!, tierOverride: "GOLD" }]
    };

    expect(silver.startBattle().ok).toBe(true);
    expect(gold.startBattle().ok).toBe(true);
    expect(firstDamageAmount(gold.state.pendingCombatResult!, gold.state.ownedCards[0]!.instanceId))
      .toBeGreaterThan(firstDamageAmount(silver.state.pendingCombatResult!, silver.state.ownedCards[0]!.instanceId));
  });

  it("loss and draw set run status DEFEAT", () => {
    for (const winner of ["ENEMY", "DRAW"] as const) {
      const manager = createNewRun(`defeat-${winner}`);
      reachFirstBattle(manager);
      manager.state = {
        ...manager.state,
        pendingCombatResult: fakeCombatResult(winner),
        pendingBattleResult: fakeCombatResult(winner)
      };

      expect(manager.completeBattle().ok).toBe(true);
      expect(manager.state.status).toBe("DEFEAT");
    }
  });

  it("same seed and choices produce same shop, reward, and monster setup", () => {
    const first = createNewRun("deterministic");
    const second = createNewRun("deterministic");
    expect(second.state.currentChoices).toEqual(first.state.currentChoices);

    reachFirstBattle(first);
    reachFirstBattle(second);
    first.moveCardFromChestToFormation(first.state.ownedCards[0].instanceId, 1);
    second.moveCardFromChestToFormation(second.state.ownedCards[0].instanceId, 1);
    first.startBattle();
    second.startBattle();
    expect(second.state.currentEnemySnapshot).toEqual(first.state.currentEnemySnapshot);

    completeFakeBattleWin(first);
    completeFakeBattleWin(second);
    expect(second.state.currentChoices).toEqual(first.state.currentChoices);
  });

  it("run can continue through repeated cycles, reach level 10, and final boss win produces victory", () => {
    const manager = createNewRun("victory");
    manager.gainExp(90, "test");
    while (manager.state.pendingLevelUpChoices.length > 0) {
      chooseFirstLevelReward(manager);
    }
    expect(manager.state.level).toBe(10);
    manager.advanceToNextNode();
    expect(manager.getCurrentNode().battleDifficulty).toBe("BOSS");
    manager.state = {
      ...manager.state,
      pendingCombatResult: fakeCombatResult("PLAYER"),
      pendingBattleResult: fakeCombatResult("PLAYER"),
      currentEnemySnapshot: {
        id: "monster:gate-captain:10",
        kind: "BOSS",
        displayName: "First Boss: Gate Captain",
        level: 10,
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
    expect(manager.getCurrentNode().type).toBe("RUN_RESULT");
  });

  it("run node starter sequence remains deterministic", () => {
    expect(getRunNodes().map((node) => node.id)).toEqual([
      "starter-shop-1",
      "starter-event-1",
      "easy-monster-1",
      "reward-1",
      "shop-1",
      "normal-monster-1",
      "reward-2",
      "shop-2",
      "elite-monster-1",
      "reward-3"
    ]);
  });
});
