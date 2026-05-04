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
      type: "ArmorGained",
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
    const damageEvent = result.replayTimeline.events.find((event) => event.type === "DamageDealt");

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

  it("Burn applied at tick 1 first ticks at tick 61 and ignores Armor", () => {
    const card = createCard("flame", [{ command: "ApplyBurn", amount: 2, durationTicks: 120 }], 999);

    const result = simulateOnePlayerCard(card, createFormation("enemy", 20, [], 5), 61);
    const burnDamageEvents = result.replayTimeline.events.filter(
      (event) => event.type === "DamageDealt" && event.payload?.command === "BurnTick"
    );

    expect(burnDamageEvents).toHaveLength(1);
    expect(burnDamageEvents[0]).toMatchObject({
      tick: 61,
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

  it("explicit PHYSICAL and FIRE DealDamage types appear in replay and still use Armor", () => {
    const card = createCard(
      "typed-strikes",
      [
        { command: "DealDamage", amount: 4, damageType: "PHYSICAL" },
        { command: "DealDamage", amount: 4, damageType: "FIRE" }
      ],
      999
    );

    const result = simulateOnePlayerCard(card, createFormation("enemy", 20, [], 5), 1);
    const damageEvents = result.replayTimeline.events.filter((event) => event.type === "DamageDealt");

    expect(damageEvents.map((event) => event.payload?.damageType)).toEqual(["PHYSICAL", "FIRE"]);
    expect(damageEvents.map((event) => event.payload?.hpDamage)).toEqual([0, 3]);
    expect(result.enemyFinalHp).toBe(17);
  });

  it("Burn duration 60 applied at tick 1 ticks once at tick 61 and then expires", () => {
    const card = createCard("short-flame", [{ command: "ApplyBurn", amount: 2, durationTicks: 60 }], 999);

    const result = simulateOnePlayerCard(card, createFormation("enemy", 20, []), 61);
    const burnDamageEvents = result.replayTimeline.events.filter(
      (event) => event.type === "DamageDealt" && event.payload?.command === "BurnTick"
    );
    const expiryEvents = result.replayTimeline.events.filter((event) => event.type === "StatusExpired");

    expect(burnDamageEvents).toHaveLength(1);
    expect(burnDamageEvents[0]?.tick).toBe(61);
    expect(expiryEvents).toContainEqual({
      tick: 61,
      type: "StatusExpired",
      targetId: "enemy",
      payload: {
        kind: "BURN"
      }
    });
  });

  it("Burn does not lose duration during the same tick it is applied", () => {
    const card = createCard("duration-flame", [{ command: "ApplyBurn", amount: 2, durationTicks: 60 }], 999);

    const result = simulateOnePlayerCard(card, createFormation("enemy", 20, []), 1);

    expect(result.replayTimeline.events).toContainEqual({
      tick: 1,
      type: "StatusApplied",
      sourceId: "player-card",
      targetId: "enemy",
      payload: {
        command: "ApplyBurn",
        status: "Burn",
        amount: 2,
        durationTicks: 60,
        sourceCombatantId: "player",
        sourceCardInstanceId: "player-card",
        sourceCardDefinitionId: "duration-flame",
        totalAmount: 2,
        nextTickAt: 61,
        expiresAtTick: 61,
        sourceContributions: [
          {
            sourceCombatantId: "player",
            sourceCardInstanceId: "player-card",
            sourceCardDefinitionId: "duration-flame",
            amount: 2
          }
        ]
      }
    });
    expect(result.replayTimeline.events.some((event) => event.type === "StatusExpired")).toBe(false);
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

    const result = simulateOnePlayerCard(card, createFormation("enemy", 20, []), 61);
    const burnDamageEvents = result.replayTimeline.events.filter(
      (event) => event.type === "DamageDealt" && event.payload?.command === "BurnTick"
    );
    const statusAppliedEvents = result.replayTimeline.events.filter((event) => event.type === "StatusApplied");

    expect(statusAppliedEvents.map((event) => event.payload?.sourceContributions)).toEqual([
      [
        {
          sourceCombatantId: "player",
          sourceCardInstanceId: "player-card",
          sourceCardDefinitionId: "double-flame",
          amount: 2
        }
      ],
      [
        {
          sourceCombatantId: "player",
          sourceCardInstanceId: "player-card",
          sourceCardDefinitionId: "double-flame",
          amount: 5
        }
      ]
    ]);
    expect(burnDamageEvents.map((event) => event.payload?.hpDamage)).toEqual([5]);
    expect(burnDamageEvents[0]?.payload?.statusSourceContributions).toEqual([
      {
        sourceCombatantId: "player",
        sourceCardInstanceId: "player-card",
        sourceCardDefinitionId: "double-flame",
        amount: 5
      }
    ]);
    expect(result.enemyFinalHp).toBe(15);
  });

  it("same input produces the same Burn result", () => {
    const card = createCard("repeatable-flame", [{ command: "ApplyBurn", amount: 2, durationTicks: 120 }], 999);
    const enemy = createFormation("enemy", 20, []);

    const firstResult = simulateOnePlayerCard(card, enemy, 120);
    const secondResult = simulateOnePlayerCard(card, enemy, 120);

    expect(secondResult).toEqual(firstResult);
  });

  it("same combat input produces the same replay and summary with attributed Burn", () => {
    const card = createCard("repeatable-attributed-flame", [{ command: "ApplyBurn", amount: 2, durationTicks: 120 }], 999);
    const enemy = createFormation("enemy", 20, []);

    const firstResult = simulateOnePlayerCard(card, enemy, 120);
    const secondResult = simulateOnePlayerCard(card, enemy, 120);

    expect(secondResult.replayTimeline).toEqual(firstResult.replayTimeline);
    expect(secondResult.summary).toEqual(firstResult.summary);
  });
});
