import { describe, expect, it } from "vitest";

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
