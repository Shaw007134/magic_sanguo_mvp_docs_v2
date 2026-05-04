import { describe, expect, it } from "vitest";

import { CombatEngine } from "../../src/combat/CombatEngine.js";
import type { CardDefinition, CardInstance, CardRuntimeState } from "../../src/model/card.js";
import type { FormationSnapshot } from "../../src/model/formation.js";

function activeCard(id: string, effects: CardDefinition["effects"], cooldownTicks = 1): CardDefinition {
  return {
    id,
    name: id,
    tier: "BRONZE",
    type: "ACTIVE",
    size: 1,
    tags: [],
    cooldownTicks,
    effects,
    description: "Critical scaling test card."
  };
}

function formation(
  id: "player" | "enemy",
  maxHp: number,
  cardInstanceIds: readonly (string | undefined)[],
  startingArmor = 0
): FormationSnapshot {
  return {
    id,
    kind: id === "player" ? "PLAYER" : "MONSTER",
    displayName: id,
    level: 1,
    maxHp,
    startingArmor,
    slots: [1, 2, 3, 4].map((slotIndex, index) => ({
      slotIndex,
      cardInstanceId: cardInstanceIds[index]
    })),
    skills: [],
    relics: []
  };
}

function runtimeState(instanceId: string, definitionId: string, ownerCombatantId: "player" | "enemy"): CardRuntimeState {
  return {
    instanceId,
    definitionId,
    ownerCombatantId,
    slotIndex: 1,
    cooldownMaxTicks: 999,
    cooldownRemainingTicks: 1,
    cooldownRecoveryRate: 1,
    disabled: false,
    silenced: false,
    frozen: false,
    activationCount: 0
  };
}

function simulate(input: {
  readonly card: CardDefinition;
  readonly playerMaxHp?: number;
  readonly playerArmor?: number;
  readonly enemyMaxHp?: number;
  readonly enemyArmor?: number;
}) {
  const instance: CardInstance = { instanceId: "player-card", definitionId: input.card.id };
  return new CombatEngine().simulate({
    playerFormation: formation("player", input.playerMaxHp ?? 40, ["player-card"], input.playerArmor ?? 0),
    enemyFormation: formation("enemy", input.enemyMaxHp ?? 40, [], input.enemyArmor ?? 0),
    cardInstancesById: new Map([[instance.instanceId, instance]]),
    cardDefinitionsById: new Map([[input.card.id, input.card]]),
    initialCardRuntimeStates: [runtimeState("player-card", input.card.id, "player")],
    maxCombatTicks: 1
  });
}

function damageEvents(result: ReturnType<typeof simulate>) {
  return result.replayTimeline.events.filter((event) => event.type === "DamageDealt");
}

describe("critical hits and terminal scaling", () => {
  it("DealDamage without crit behaves exactly as before", () => {
    const result = simulate({
      card: activeCard("plain-strike", [{ command: "DealDamage", amount: 5 }]),
      enemyArmor: 2
    });

    expect(result.enemyFinalHp).toBe(37);
    expect(damageEvents(result)[0]?.payload).toMatchObject({
      amount: 5,
      hpDamage: 3,
      armorBlocked: 2,
      critical: false
    });
  });

  it("DealDamage with crit is deterministic for the same input and appears in replay and summary", () => {
    const card = activeCard("crit-strike", [
      { command: "DealDamage", amount: 5, critChancePercent: 100, critMultiplier: 2 }
    ]);

    const first = simulate({ card });
    const second = simulate({ card });

    expect(second).toEqual(first);
    expect(damageEvents(first)[0]?.payload).toMatchObject({
      amount: 10,
      critical: true,
      critChancePercent: 100,
      critMultiplier: 2
    });
    expect(first.summary.critCountByCard).toEqual({ "player-card": 1 });
    expect(first.summary.criticalDamageByCard).toEqual({ "player-card": 10 });
  });

  it("OWNER_ARMOR_PERCENT scaling works and is deterministic", () => {
    const card = activeCard("armor-terminal", [
      {
        command: "DealDamage",
        amount: 2,
        scaling: { source: "OWNER_ARMOR_PERCENT", percent: 100 }
      }
    ]);

    const first = simulate({ card, playerArmor: 9 });
    const second = simulate({ card, playerArmor: 9 });

    expect(second).toEqual(first);
    expect(damageEvents(first)[0]?.payload).toMatchObject({
      amount: 11,
      scalingAmount: 9
    });
  });

  it("OWNER_MAX_HP_PERCENT scaling works and is deterministic", () => {
    const card = activeCard("hp-terminal", [
      {
        command: "DealDamage",
        amount: 0,
        scaling: { source: "OWNER_MAX_HP_PERCENT", percent: 20 }
      }
    ]);

    const result = simulate({ card, playerMaxHp: 55 });

    expect(damageEvents(result)[0]?.payload).toMatchObject({
      amount: 11,
      scalingAmount: 11
    });
  });

  it("TARGET_MISSING_HP_PERCENT scaling works and is deterministic", () => {
    const card = activeCard("missing-hp-terminal", [
      { command: "DealDamage", amount: 10 },
      {
        command: "DealDamage",
        amount: 0,
        scaling: { source: "TARGET_MISSING_HP_PERCENT", percent: 50 }
      }
    ]);

    const result = simulate({ card, enemyMaxHp: 40 });
    const events = damageEvents(result);

    expect(events[1]?.payload).toMatchObject({
      amount: 5,
      scalingAmount: 5
    });
  });

  it("conditional multiplier works below threshold", () => {
    const card = activeCard("execute", [
      { command: "DealDamage", amount: 30 },
      {
        command: "DealDamage",
        amount: 4,
        conditionalMultiplier: { targetHpBelowPercent: 35, multiplier: 2 }
      }
    ]);

    const events = damageEvents(simulate({ card, enemyMaxHp: 40 }));

    expect(events[1]?.payload).toMatchObject({
      amount: 8,
      conditionalMultiplier: 2
    });
  });

  it("conditional multiplier does not apply above threshold", () => {
    const card = activeCard("not-execute", [
      {
        command: "DealDamage",
        amount: 4,
        conditionalMultiplier: { targetHpBelowPercent: 35, multiplier: 2 }
      }
    ]);

    const events = damageEvents(simulate({ card, enemyMaxHp: 40 }));

    expect(events[0]?.payload).toMatchObject({
      amount: 4
    });
    expect(events[0]?.payload?.conditionalMultiplier).toBeUndefined();
  });
});
