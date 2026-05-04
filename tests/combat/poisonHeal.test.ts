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
    description: "Poison and Heal test card."
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

function runtimeState(
  instanceId: string,
  definitionId: string,
  ownerCombatantId: "player" | "enemy",
  cooldownMaxTicks: number,
  cooldownRemainingTicks = 1
): CardRuntimeState {
  return {
    instanceId,
    definitionId,
    ownerCombatantId,
    slotIndex: 1,
    cooldownMaxTicks,
    cooldownRemainingTicks,
    cooldownRecoveryRate: 1,
    disabled: false,
    silenced: false,
    frozen: false,
    activationCount: 0
  };
}

function simulateOnePlayerCard(card: CardDefinition, enemy: FormationSnapshot, maxCombatTicks: number) {
  const instance: CardInstance = { instanceId: "player-card", definitionId: card.id };
  return new CombatEngine().simulate({
    playerFormation: formation("player", 50, ["player-card"]),
    enemyFormation: enemy,
    cardInstancesById: new Map([[instance.instanceId, instance]]),
    cardDefinitionsById: new Map([[card.id, card]]),
    initialCardRuntimeStates: [runtimeState("player-card", card.id, "player", card.cooldownTicks ?? 999, 1)],
    maxCombatTicks
  });
}

function simulateDuel(input: {
  readonly playerCard: CardDefinition;
  readonly enemyCard: CardDefinition;
  readonly playerMaxHp?: number;
  readonly enemyMaxHp?: number;
  readonly playerInitialCooldown?: number;
  readonly enemyInitialCooldown?: number;
  readonly maxCombatTicks: number;
}) {
  const playerInstance: CardInstance = { instanceId: "heal-card", definitionId: input.playerCard.id };
  const enemyInstance: CardInstance = { instanceId: "enemy-card", definitionId: input.enemyCard.id };
  return new CombatEngine().simulate({
    playerFormation: formation("player", input.playerMaxHp ?? 20, ["heal-card"]),
    enemyFormation: formation("enemy", input.enemyMaxHp ?? 40, ["enemy-card"]),
    cardInstancesById: new Map([
      [playerInstance.instanceId, playerInstance],
      [enemyInstance.instanceId, enemyInstance]
    ]),
    cardDefinitionsById: new Map([
      [input.playerCard.id, input.playerCard],
      [input.enemyCard.id, input.enemyCard]
    ]),
    initialCardRuntimeStates: [
      runtimeState("heal-card", input.playerCard.id, "player", input.playerCard.cooldownTicks ?? 999, input.playerInitialCooldown ?? 2),
      runtimeState("enemy-card", input.enemyCard.id, "enemy", input.enemyCard.cooldownTicks ?? 999, input.enemyInitialCooldown ?? 1)
    ],
    maxCombatTicks: input.maxCombatTicks
  });
}

describe("Poison and HealHP", () => {
  it("Poison applies, ticks every 60 ticks, ignores Armor, and does not naturally expire", () => {
    const card = activeCard("poison-needle", [{ command: "ApplyPoison", amount: 1 }], 999);

    const result = simulateOnePlayerCard(card, formation("enemy", 30, [], 5), 181);
    const poisonDamageEvents = result.replayTimeline.events.filter(
      (event) => event.type === "DamageDealt" && event.payload?.command === "PoisonTick"
    );

    expect(poisonDamageEvents.map((event) => event.tick)).toEqual([61, 121, 181]);
    expect(poisonDamageEvents[0]?.payload).toMatchObject({
      amount: 1,
      damageType: "POISON",
      ignoresArmor: true,
      armorBlocked: 0,
      hpDamage: 1,
      targetArmor: 5
    });
    expect(result.replayTimeline.events.some((event) => event.type === "StatusExpired")).toBe(false);
    expect(result.summary.statusDamage).toEqual({ Poison: 3 });
    expect(result.summary.statusDamageByCard).toEqual({ Poison: { "player-card": 3 } });
  });

  it("Poison stacks additively and keeps source attribution", () => {
    const card = activeCard(
      "double-poison",
      [
        { command: "ApplyPoison", amount: 1 },
        { command: "ApplyPoison", amount: 2 }
      ],
      999
    );

    const result = simulateOnePlayerCard(card, formation("enemy", 30, []), 61);
    const poisonDamage = result.replayTimeline.events.find(
      (event) => event.type === "DamageDealt" && event.payload?.command === "PoisonTick"
    );

    expect(poisonDamage?.payload?.hpDamage).toBe(3);
    expect(poisonDamage?.payload?.statusSourceContributions).toEqual([
      {
        sourceCombatantId: "player",
        sourceCardInstanceId: "player-card",
        sourceCardDefinitionId: "double-poison",
        amount: 3
      }
    ]);
  });

  it("Poison amount and source contributions do not decay between ticks", () => {
    const card = activeCard(
      "persistent-poison",
      [
        { command: "ApplyPoison", amount: 1 },
        { command: "ApplyPoison", amount: 2 }
      ],
      999
    );

    const result = simulateOnePlayerCard(card, formation("enemy", 30, []), 121);
    const poisonDamageEvents = result.replayTimeline.events.filter(
      (event) => event.type === "DamageDealt" && event.payload?.command === "PoisonTick"
    );

    expect(poisonDamageEvents.map((event) => event.tick)).toEqual([61, 121]);
    expect(poisonDamageEvents.map((event) => event.payload?.hpDamage)).toEqual([3, 3]);
    expect(poisonDamageEvents.map((event) => event.payload?.statusSourceContributions)).toEqual([
      [
        {
          sourceCombatantId: "player",
          sourceCardInstanceId: "player-card",
          sourceCardDefinitionId: "persistent-poison",
          amount: 3
        }
      ],
      [
        {
          sourceCombatantId: "player",
          sourceCardInstanceId: "player-card",
          sourceCardDefinitionId: "persistent-poison",
          amount: 3
        }
      ]
    ]);
    expect(result.replayTimeline.events.some((event) => event.type === "StatusExpired")).toBe(false);
  });

  it("HealHP restores HP, caps at max HP, and appears in replay and summary", () => {
    const healer = activeCard("field-medic", [{ command: "HealHP", amount: 5 }], 999);
    const attacker = activeCard("enemy-strike", [{ command: "DealDamage", amount: 8 }], 999);

    const result = simulateDuel({
      playerCard: healer,
      enemyCard: attacker,
      playerMaxHp: 20,
      maxCombatTicks: 2
    });
    const healEvent = result.replayTimeline.events.find((event) => event.type === "HpHealed");

    expect(result.playerFinalHp).toBe(17);
    expect(healEvent).toMatchObject({
      tick: 2,
      sourceId: "heal-card",
      targetId: "player",
      payload: {
        command: "HealHP",
        amount: 5,
        requestedAmount: 5,
        targetHp: 17,
        maxHp: 20
      }
    });
    expect(result.summary.healingByCard).toEqual({ "heal-card": 5 });
  });

  it("HealHP cannot overheal", () => {
    const healer = activeCard("field-medic", [{ command: "HealHP", amount: 5 }], 999);
    const attacker = activeCard("enemy-chip", [{ command: "DealDamage", amount: 3 }], 999);

    const result = simulateDuel({
      playerCard: healer,
      enemyCard: attacker,
      playerMaxHp: 20,
      maxCombatTicks: 2
    });
    const healEvent = result.replayTimeline.events.find((event) => event.type === "HpHealed");

    expect(result.playerFinalHp).toBe(20);
    expect(healEvent?.payload?.amount).toBe(3);
    expect(result.summary.healingByCard).toEqual({ "heal-card": 3 });
  });

  it("invalid ApplyPoison effects are ignored consistently", () => {
    const card = activeCard("bad-poison", [{ command: "ApplyPoison" }], 999);

    const result = simulateOnePlayerCard(card, formation("enemy", 30, []), 61);

    expect(result.replayTimeline.events.some((event) => event.type === "StatusApplied")).toBe(false);
    expect(result.replayTimeline.events.some((event) => event.payload?.command === "PoisonTick")).toBe(false);
    expect(result.summary.statusDamage).toEqual({});
  });

  it("same combat input produces the same replay and summary", () => {
    const card = activeCard("repeatable-poison", [{ command: "ApplyPoison", amount: 1 }], 999);
    const enemy = formation("enemy", 30, []);

    const first = simulateOnePlayerCard(card, enemy, 181);
    const second = simulateOnePlayerCard(card, enemy, 181);

    expect(second.replayTimeline).toEqual(first.replayTimeline);
    expect(second.summary).toEqual(first.summary);
  });
});
