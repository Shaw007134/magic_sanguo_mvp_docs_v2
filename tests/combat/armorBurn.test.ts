import { describe, expect, it } from "vitest";

import { CombatEngine } from "../../src/combat/CombatEngine.js";
import type { CardDefinition, CardInstance } from "../../src/model/card.js";
import type { FormationSnapshot } from "../../src/model/formation.js";

function createCard(id: string, effects: CardDefinition["effects"], cooldownTicks = 1): CardDefinition {
  return {
    id,
    name: id,
    tier: "BRONZE",
    type: "ACTIVE",
    size: 1,
    tags: [],
    cooldownTicks,
    effects,
    description: "Test card."
  };
}

function createFormation(
  id: string,
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

function simulateOnePlayerCard(card: CardDefinition, enemy: FormationSnapshot, maxCombatTicks: number) {
  const instance: CardInstance = {
    instanceId: "player-card",
    definitionId: card.id
  };

  return new CombatEngine().simulate({
    playerFormation: createFormation("player", 50, ["player-card"]),
    enemyFormation: enemy,
    cardInstancesById: new Map([[instance.instanceId, instance]]),
    cardDefinitionsById: new Map([[card.id, card]]),
    initialCardRuntimeStates: [
      {
        instanceId: "player-card",
        definitionId: card.id,
        ownerCombatantId: "player",
        slotIndex: 1,
        cooldownMaxTicks: card.cooldownTicks ?? 999,
        cooldownRemainingTicks: 1,
        cooldownRecoveryRate: 1,
        disabled: false,
        silenced: false,
        frozen: false,
        activationCount: 0
      }
    ],
    maxCombatTicks
  });
}

describe("Armor and Burn", () => {
  it("GainArmorCommand increases Armor", () => {
    const card = createCard("guard", [{ command: "GainArmor", amount: 5 }]);

    const result = simulateOnePlayerCard(card, createFormation("enemy", 20, []), 1);

    expect(result.replayTimeline.events).toContainEqual({
      tick: 1,
      type: "ARMOR_GAINED",
      sourceId: "player-card",
      targetId: "player",
      payload: {
        command: "GainArmor",
        amount: 5,
        armor: 5
      }
    });
  });

  it("Armor reduces direct damage and is consumed by blocked damage", () => {
    const card = createCard("strike", [{ command: "DealDamage", amount: 8 }]);

    const result = simulateOnePlayerCard(card, createFormation("enemy", 20, [], 3), 1);
    const damageEvent = result.replayTimeline.events.find((event) => event.type === "DAMAGE_DEALT");

    expect(damageEvent?.payload).toMatchObject({
      command: "DealDamage",
      amount: 8,
      armorBlocked: 3,
      hpDamage: 5,
      targetHp: 15,
      targetArmor: 0
    });
    expect(result.enemyFinalHp).toBe(15);
  });

  it("Burn ticks every 60 ticks and ignores Armor", () => {
    const card = createCard("flame", [{ command: "ApplyBurn", amount: 2, durationTicks: 120 }], 999);

    const result = simulateOnePlayerCard(card, createFormation("enemy", 20, [], 5), 60);
    const burnDamageEvents = result.replayTimeline.events.filter(
      (event) => event.type === "DAMAGE_DEALT" && event.payload?.command === "BurnTick"
    );

    expect(burnDamageEvents).toHaveLength(1);
    expect(burnDamageEvents[0]).toMatchObject({
      tick: 60,
      payload: {
        amount: 2,
        damageType: "FIRE",
        ignoresArmor: true,
        armorBlocked: 0,
        hpDamage: 2,
        targetHp: 18,
        targetArmor: 5
      }
    });
  });

  it("Burn expires after duration", () => {
    const card = createCard("short-flame", [{ command: "ApplyBurn", amount: 2, durationTicks: 60 }], 999);

    const result = simulateOnePlayerCard(card, createFormation("enemy", 20, []), 120);
    const burnDamageEvents = result.replayTimeline.events.filter(
      (event) => event.type === "DAMAGE_DEALT" && event.payload?.command === "BurnTick"
    );
    const expiryEvents = result.replayTimeline.events.filter((event) => event.type === "STATUS_EXPIRED");

    expect(burnDamageEvents).toHaveLength(1);
    expect(burnDamageEvents[0]?.tick).toBe(60);
    expect(expiryEvents).toContainEqual({
      tick: 60,
      type: "STATUS_EXPIRED",
      targetId: "enemy",
      payload: {
        kind: "BURN"
      }
    });
  });

  it("Burn stacking works deterministically", () => {
    const card = createCard(
      "double-flame",
      [
        { command: "ApplyBurn", amount: 2, durationTicks: 120 },
        { command: "ApplyBurn", amount: 3, durationTicks: 120 }
      ],
      999
    );

    const result = simulateOnePlayerCard(card, createFormation("enemy", 20, []), 60);
    const burnDamageEvents = result.replayTimeline.events.filter(
      (event) => event.type === "DAMAGE_DEALT" && event.payload?.command === "BurnTick"
    );

    expect(burnDamageEvents.map((event) => event.payload?.hpDamage)).toEqual([2, 3]);
    expect(result.enemyFinalHp).toBe(15);
  });

  it("same input produces the same Burn result", () => {
    const card = createCard("repeatable-flame", [{ command: "ApplyBurn", amount: 2, durationTicks: 120 }], 999);
    const enemy = createFormation("enemy", 20, []);

    const firstResult = simulateOnePlayerCard(card, enemy, 120);
    const secondResult = simulateOnePlayerCard(card, enemy, 120);

    expect(secondResult).toEqual(firstResult);
  });
});
