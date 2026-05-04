import { describe, expect, it } from "vitest";

import { getMonsterCardDefinitionsById } from "../../src/content/cards/monsterCards.js";
import type { CardDefinition } from "../../src/model/card.js";
import type { CombatResult } from "../../src/model/result.js";
import { createNewRun, RunManager } from "../../src/run/RunManager.js";
import {
  deserializeRunState,
  loadRunManagerFromSaveString,
  RUN_SAVE_FORMAT_VERSION,
  serializeRunState
} from "../../src/run/save/SaveManager.js";

function roundTrip(manager: RunManager): RunManager {
  const save = serializeRunState(manager.state);
  expect(save.ok).toBe(true);
  const loaded = loadRunManagerFromSaveString(save.ok ? save.value : "");
  expect(loaded.ok).toBe(true);
  return loaded.ok ? loaded.value : manager;
}

function getSaveObject(manager: RunManager): { readonly version: number; readonly state: Record<string, unknown> } {
  const save = serializeRunState(manager.state);
  expect(save.ok).toBe(true);
  return JSON.parse(save.ok ? save.value : "{}") as { version: number; state: Record<string, unknown> };
}

function deserializeMutatedState(
  manager: RunManager,
  mutate: (state: Record<string, unknown>) => void
) {
  const save = getSaveObject(manager);
  mutate(save.state);
  return deserializeRunState(JSON.stringify(save));
}

function chooseFirstShop(manager: RunManager) {
  const choice = manager.state.currentChoices.find((candidate) => candidate.type === "SHOP_CARD");
  if (!choice) {
    throw new Error("Missing shop choice.");
  }
  const result = manager.chooseShopOption(choice.id);
  expect(result.ok).toBe(true);
}

function leaveShop(manager: RunManager) {
  const result = manager.leaveShop();
  expect(result.ok).toBe(true);
}

function chooseFirstEvent(manager: RunManager) {
  const choice = manager.state.currentChoices.find((candidate) => candidate.type === "EVENT_CARD");
  if (!choice) {
    throw new Error("Missing event choice.");
  }
  const result = manager.chooseEventOption(choice.id);
  expect(result.ok).toBe(true);
}

function fakeCombatResult(winner: CombatResult["winner"] = "PLAYER"): CombatResult {
  return {
    winner,
    ticksElapsed: 60,
    playerFinalHp: 15,
    enemyFinalHp: winner === "PLAYER" ? 0 : 1,
    combatLog: ["debug"],
    replayTimeline: { events: [{ tick: 60, type: "CombatEnded" }] },
    summary: {
      winner,
      ticksElapsed: 60,
      playerFinalHp: 15,
      enemyFinalHp: winner === "PLAYER" ? 0 : 1,
      damageByCard: {},
      statusDamage: {},
      statusDamageByCard: {},
      armorGainedByCard: {},
      healingByCard: {},
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
  expect(manager.state.currentNode.type).toBe("BATTLE");
}

function completeFakeBattleWin(manager: RunManager) {
  manager.state = {
    ...manager.state,
    pendingCombatResult: fakeCombatResult("PLAYER"),
    pendingBattleResult: fakeCombatResult("PLAYER")
  };
  const result = manager.completeBattle();
  expect(result.ok).toBe(true);
}

describe("SaveManager", () => {
  it("save/load round trip preserves exact RunState including shop sold-out state", () => {
    const manager = createNewRun("save-shop");
    chooseFirstShop(manager);
    const loaded = roundTrip(manager);

    expect(loaded.state).toEqual(manager.state);
    expect(loaded.state.currentChoices).toEqual(manager.state.currentChoices);
    expect(loaded.state.shopStates).toEqual(manager.state.shopStates);
    expect(loaded.state.currentChoices.some((choice) => choice.type === "SHOP_CARD" && choice.purchased)).toBe(true);
    expect(loaded.state.gold).toBe(manager.state.gold);
    expect(loaded.state.level).toBe(manager.state.level);
    expect(loaded.state.exp).toBe(manager.state.exp);
    expect(loaded.state.currentHp).toBe(manager.state.currentHp);
    expect(loaded.state.maxHp).toBe(manager.state.maxHp);
    expect(loaded.state.ownedCards.map((card) => [card.instanceId, card.definitionId, card.tierOverride])).toEqual(
      manager.state.ownedCards.map((card) => [card.instanceId, card.definitionId, card.tierOverride])
    );
  });

  it("save/load preserves attributed DOT result payloads without persisting runtime status arrays", () => {
    const manager = createNewRun("save-attributed-dot");
    const attributedResult: CombatResult = {
      ...fakeCombatResult("PLAYER"),
      replayTimeline: {
        events: [
          {
            tick: 61,
            type: "DamageDealt",
            payload: {
              command: "BurnTick",
              damageType: "FIRE",
              hpDamage: 3,
              statusSourceContributions: [
                {
                  sourceCombatantId: "player",
                  sourceCardInstanceId: "run-card-1",
                  sourceCardDefinitionId: "oil-flask",
                  amount: 3
                }
              ]
            }
          },
          {
            tick: 61,
            type: "DamageDealt",
            payload: {
              command: "PoisonTick",
              damageType: "POISON",
              hpDamage: 2,
              statusSourceContributions: [
                {
                  sourceCombatantId: "player",
                  sourceCardInstanceId: "run-card-2",
                  sourceCardDefinitionId: "poison-needle",
                  amount: 2
                }
              ]
            }
          },
          {
            tick: 62,
            type: "HpHealed",
            sourceId: "run-card-3",
            payload: {
              command: "HealHP",
              amount: 4
            }
          }
        ]
      },
      summary: {
        ...fakeCombatResult("PLAYER").summary,
        statusDamage: { Burn: 3, Poison: 2 },
        statusDamageByCard: { Burn: { "run-card-1": 3 }, Poison: { "run-card-2": 2 } },
        healingByCard: { "run-card-3": 4 }
      }
    };
    manager.state = {
      ...manager.state,
      pendingCombatResult: attributedResult
    };

    const save = serializeRunState(manager.state);
    expect(save.ok).toBe(true);
    expect(save.ok ? save.value : "").not.toContain('"statuses"');
    const loaded = deserializeRunState(save.ok ? save.value : "");

    expect(loaded.ok).toBe(true);
    expect(loaded.ok ? loaded.value.pendingCombatResult : undefined).toEqual(attributedResult);
  });

  it("event choices remain identical after load and are not rerolled", () => {
    const manager = createNewRun("save-event");
    chooseFirstShop(manager);
    leaveShop(manager);
    const beforeChoices = manager.state.currentChoices;
    const loaded = roundTrip(manager);

    expect(loaded.state.currentNode.type).toBe("EVENT");
    expect(loaded.state.currentChoices).toEqual(beforeChoices);
  });

  it("reward choices and reward reveal source remain identical after load", () => {
    const manager = createNewRun("save-reward");
    reachFirstBattle(manager);
    completeFakeBattleWin(manager);
    const beforeChoices = manager.state.currentChoices;
    const beforeRewardSource = manager.state.pendingRewardSource;

    const loaded = roundTrip(manager);

    expect(loaded.state.currentNode.type).toBe("REWARD");
    expect(loaded.state.currentChoices).toEqual(beforeChoices);
    expect(loaded.state.pendingRewardChoices).toEqual(manager.state.pendingRewardChoices);
    expect(loaded.state.pendingRewardSource).toEqual(beforeRewardSource);
  });

  it("saved shop and reward choices are not rerolled by late-quality curation on load", () => {
    const shopManager = createNewRun("save-late-shop-no-reroll");
    const savedStarterChoices = shopManager.state.currentChoices;
    shopManager.state = { ...shopManager.state, level: 8 };
    const loadedShop = roundTrip(shopManager);

    expect(loadedShop.state.currentNode.type).toBe("SHOP");
    expect(loadedShop.state.currentChoices).toEqual(savedStarterChoices);

    const rewardManager = createNewRun("save-late-reward-no-reroll");
    reachFirstBattle(rewardManager);
    completeFakeBattleWin(rewardManager);
    const savedRewardChoices = rewardManager.state.currentChoices;
    const savedPendingRewards = rewardManager.state.pendingRewardChoices;
    rewardManager.state = { ...rewardManager.state, level: 8 };
    const loadedReward = roundTrip(rewardManager);

    expect(loadedReward.state.currentNode.type).toBe("REWARD");
    expect(loadedReward.state.currentChoices).toEqual(savedRewardChoices);
    expect(loadedReward.state.pendingRewardChoices).toEqual(savedPendingRewards);
  });

  it("level-up reward choices, owned skills, card tiers, and formation layout survive load", () => {
    const manager = createNewRun("save-level-up");
    manager.addCardToChest("rusty-blade");
    manager.addCardToChest("wooden-shield");
    manager.moveCardFromChestToFormation(manager.state.ownedCards[0]!.instanceId, 1);
    manager.state = {
      ...manager.state,
      ownedCards: [
        { ...manager.state.ownedCards[0]!, tierOverride: "SILVER" },
        manager.state.ownedCards[1]!
      ],
      ownedSkills: [{ instanceId: "run-skill-1", definitionId: "weapon-drill" }]
    };
    manager.gainExp(10, "test");
    const loaded = roundTrip(manager);

    expect(loaded.state.currentNode.type).toBe("LEVEL_UP_REWARD");
    expect(loaded.state.currentChoices).toEqual(manager.state.currentChoices);
    expect(loaded.state.pendingLevelUpChoices).toEqual(manager.state.pendingLevelUpChoices);
    expect(loaded.state.formationSlots).toEqual(manager.state.formationSlots);
    expect(loaded.state.ownedCards).toEqual(manager.state.ownedCards);
    expect(loaded.state.ownedSkills).toEqual(manager.state.ownedSkills);
  });

  it("enemy FormationSnapshot and completed battle result remain identical after load", () => {
    const manager = createNewRun("save-battle");
    reachFirstBattle(manager);
    const originalEnemy = {
      ...manager.state.currentEnemySnapshot!,
      displayName: "Serialized Sentinel"
    };
    manager.state = {
      ...manager.state,
      currentEnemySnapshot: originalEnemy,
      pendingCombatResult: fakeCombatResult("PLAYER"),
      pendingBattleResult: fakeCombatResult("PLAYER")
    };
    const loaded = roundTrip(manager);

    expect(loaded.state.currentNode.type).toBe("BATTLE");
    expect(loaded.state.currentEnemySnapshot).toEqual(originalEnemy);
    expect(loaded.state.currentEnemyCardInstances).toEqual(manager.state.currentEnemyCardInstances);
    expect(loaded.state.pendingCombatResult).toEqual(manager.state.pendingCombatResult);
    expect(loaded.state.pendingBattleResult).toEqual(manager.state.pendingBattleResult);
  });

  it("loading a battle node uses serialized enemy snapshot when starting battle", () => {
    const manager = createNewRun("save-battle-no-reroll");
    reachFirstBattle(manager);
    const serializedEnemy = {
      ...manager.state.currentEnemySnapshot!,
      id: "monster:serialized-sentinel",
      displayName: "Serialized Sentinel",
      maxHp: 1
    };
    manager.state = {
      ...manager.state,
      currentEnemySnapshot: serializedEnemy
    };
    manager.moveCardFromChestToFormation(manager.state.ownedCards[0]!.instanceId, 1);

    const loaded = roundTrip(manager);
    expect(loaded.startBattle().ok).toBe(true);

    expect(loaded.state.currentEnemySnapshot).toEqual(serializedEnemy);
    expect(loaded.state.pendingCombatResult?.enemyFinalHp).toBe(0);
  });

  it("restored manager continues ids without colliding after load", () => {
    const manager = createNewRun("save-next-id");
    manager.addCardToChest("rusty-blade");
    manager.state = {
      ...manager.state,
      ownedSkills: [{ instanceId: "run-skill-1", definitionId: "weapon-drill" }]
    };
    const loaded = roundTrip(manager);

    expect(loaded.addCardToChest("wooden-shield").ok).toBe(true);
    expect(loaded.state.ownedCards.map((card) => card.instanceId)).toEqual(["run-card-1", "run-card-2"]);
  });

  it("invalid save version, corrupt JSON, and missing required fields fail clearly", () => {
    const manager = createNewRun("save-invalid");
    const save = serializeRunState(manager.state);
    expect(save.ok).toBe(true);
    const parsed = JSON.parse(save.ok ? save.value : "{}") as Record<string, unknown>;

    expect(deserializeRunState("{nope").ok).toBe(false);
    expect(deserializeRunState(JSON.stringify({ ...parsed, version: RUN_SAVE_FORMAT_VERSION + 1 }))).toEqual({
      ok: false,
      error: `Unsupported save format version: ${RUN_SAVE_FORMAT_VERSION + 1}.`
    });
    const missingState = { ...parsed, state: { ...(parsed["state"] as Record<string, unknown>) } };
    delete (missingState["state"] as Record<string, unknown>)["gold"];
    const missingResult = deserializeRunState(JSON.stringify(missingState));
    expect(missingResult.ok).toBe(false);
    expect(missingResult.ok ? "" : missingResult.error).toContain("missing required field: gold");
  });

  it("corrupt save with negative numeric domains fails clearly", () => {
    const manager = createNewRun("save-negative-domains");
    const corruptions = [
      { field: "gold", value: -1, message: "gold must be >= 0" },
      { field: "currentHp", value: -1, message: "currentHp must be >= 0" },
      { field: "level", value: 0, message: "level must be >= 1" },
      { field: "exp", value: -1, message: "exp must be >= 0" },
      { field: "currentNodeIndex", value: -1, message: "currentNodeIndex must be >= 0" },
      { field: "expToNextLevel", value: 0, message: "expToNextLevel must be > 0" },
      { field: "maxHp", value: 0, message: "maxHp must be > 0" },
      { field: "completedEncounterCount", value: -1, message: "completedEncounterCount must be >= 0" },
      { field: "defeatedBattleCount", value: -1, message: "defeatedBattleCount must be >= 0" }
    ] as const;

    for (const corruption of corruptions) {
      const result = deserializeMutatedState(manager, (state) => {
        state[corruption.field] = corruption.value;
      });

      expect(result.ok).toBe(false);
      expect(result.ok ? "" : result.error).toContain(corruption.message);
    }

    const overMaxHp = deserializeMutatedState(manager, (state) => {
      state["currentHp"] = 41;
    });
    expect(overMaxHp.ok).toBe(false);
    expect(overMaxHp.ok ? "" : overMaxHp.error).toContain("currentHp must be <= maxHp");
  });

  it("corrupt save with invalid classId or chest capacity domains fails clearly", () => {
    const manager = createNewRun("save-class-domains");

    const missingClass = deserializeMutatedState(manager, (state) => {
      state["classId"] = "";
    });
    expect(missingClass.ok).toBe(false);
    expect(missingClass.ok ? "" : missingClass.error).toContain("classId");

    const badChest = deserializeMutatedState(manager, (state) => {
      state["chestCapacity"] = 3;
    });
    expect(badChest.ok).toBe(false);
    expect(badChest.ok ? "" : badChest.error).toContain("chestCapacity must be >= formationSlotCount");
  });

  it("corrupt save with slotIndex outside formationSlotCount fails", () => {
    const manager = createNewRun("save-slot-index");
    const result = deserializeMutatedState(manager, (state) => {
      state["formationSlots"] = [
        { slotIndex: 1 },
        { slotIndex: 2 },
        { slotIndex: 3 },
        { slotIndex: 5 }
      ];
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("outside formationSlotCount");
  });

  it("corrupt save with missing locked footprint for a size-2 card fails", () => {
    const manager = createNewRun("save-missing-footprint");
    manager.addCardToChest("spark-drum");
    manager.moveCardFromChestToFormation(manager.state.ownedCards[0]!.instanceId, 1);

    const result = deserializeMutatedState(manager, (state) => {
      state["formationSlots"] = [
        { slotIndex: 1, cardInstanceId: "run-card-1" },
        { slotIndex: 2 },
        { slotIndex: 3 },
        { slotIndex: 4 }
      ];
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("missing its adjacent locked footprint");
  });

  it("corrupt save with lockedByInstanceId pointing to a size-1 card fails", () => {
    const manager = createNewRun("save-size-one-lock");
    manager.addCardToChest("rusty-blade");

    const result = deserializeMutatedState(manager, (state) => {
      state["formationSlots"] = [
        { slotIndex: 1, cardInstanceId: "run-card-1" },
        { slotIndex: 2, lockedByInstanceId: "run-card-1" },
        { slotIndex: 3 },
        { slotIndex: 4 }
      ];
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("Size 1 card run-card-1 must not lock adjacent slots");
  });

  it("corrupt save with locked slot not adjacent to its size-2 owner fails", () => {
    const manager = createNewRun("save-non-adjacent-lock");
    manager.addCardToChest("spark-drum");

    const result = deserializeMutatedState(manager, (state) => {
      state["formationSlots"] = [
        { slotIndex: 1, cardInstanceId: "run-card-1" },
        { slotIndex: 2 },
        { slotIndex: 3, lockedByInstanceId: "run-card-1" },
        { slotIndex: 4 }
      ];
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("missing its adjacent locked footprint");
  });

  it("corrupt save with locked slot containing a card fails", () => {
    const manager = createNewRun("save-locked-card");
    manager.addCardToChest("spark-drum");
    manager.addCardToChest("rusty-blade");

    const result = deserializeMutatedState(manager, (state) => {
      state["formationSlots"] = [
        { slotIndex: 1, cardInstanceId: "run-card-1" },
        { slotIndex: 2, cardInstanceId: "run-card-2", lockedByInstanceId: "run-card-1" },
        { slotIndex: 3 },
        { slotIndex: 4 }
      ];
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("cannot contain a card and be locked");
  });

  it("serializeRunState accepts an injected cardDefinitionsById map", () => {
    const baseDefinitionsById = getMonsterCardDefinitionsById();
    const customCard: CardDefinition = {
      ...baseDefinitionsById.get("rusty-blade")!,
      id: "custom-blade",
      name: "Custom Blade"
    };
    const customDefinitionsById = new Map([...baseDefinitionsById, [customCard.id, customCard]]);
    const manager = RunManager.createNewRun("save-custom-registry", customDefinitionsById);
    manager.addCardToChest(customCard.id);

    expect(serializeRunState(manager.state).ok).toBe(false);
    const save = serializeRunState(manager.state, customDefinitionsById);
    expect(save.ok).toBe(true);
    const loaded = save.ok ? loadRunManagerFromSaveString(save.value, customDefinitionsById) : { ok: false as const, error: "" };
    expect(loaded.ok).toBe(true);
  });

  it("unknown node type, invalid card, invalid formation, and invalid enemy snapshot fail clearly", () => {
    const manager = createNewRun("save-validation");
    const save = serializeRunState(manager.state);
    expect(save.ok).toBe(true);
    const parsed = JSON.parse(save.ok ? save.value : "{}") as { state: Record<string, unknown> };

    const badNode = structuredClone(parsed);
    badNode.state["currentNode"] = { id: "bad", type: "MAP", day: 1, label: "Bad" };
    expect(deserializeRunState(JSON.stringify(badNode)).ok).toBe(false);

    const badCard = structuredClone(parsed);
    badCard.state["ownedCards"] = [{ instanceId: "run-card-1", definitionId: "missing-card" }];
    expect(deserializeRunState(JSON.stringify(badCard)).ok).toBe(false);

    const badFormation = structuredClone(parsed);
    badFormation.state["formationSlots"] = [{ slotIndex: 1, cardInstanceId: "missing-card" }];
    expect(deserializeRunState(JSON.stringify(badFormation)).ok).toBe(false);

    const battle = createNewRun("save-bad-enemy");
    reachFirstBattle(battle);
    const battleSave = serializeRunState(battle.state);
    expect(battleSave.ok).toBe(true);
    const badEnemy = JSON.parse(battleSave.ok ? battleSave.value : "{}") as { state: Record<string, unknown> };
    badEnemy.state["currentEnemySnapshot"] = { ...(badEnemy.state["currentEnemySnapshot"] as Record<string, unknown>), maxHp: 0 };
    const badEnemyResult = deserializeRunState(JSON.stringify(badEnemy));
    expect(badEnemyResult.ok).toBe(false);
    expect(badEnemyResult.ok ? "" : badEnemyResult.error).toContain("Invalid enemy FormationSnapshot");
  });
});
