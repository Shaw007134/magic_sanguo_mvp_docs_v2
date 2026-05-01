import { describe, expect, it } from "vitest";

import { CombatEngine } from "../../src/combat/CombatEngine.js";
import type { Modifier } from "../../src/combat/modifiers/Modifier.js";
import { ModifierSystem } from "../../src/combat/modifiers/ModifierSystem.js";
import type { RuntimeCombatant } from "../../src/combat/types.js";
import type { CardDefinition, CardInstance } from "../../src/model/card.js";
import type { FormationSnapshot } from "../../src/model/formation.js";

function createActiveCard(
  id: string,
  effects: CardDefinition["effects"],
  tags: readonly string[] = [],
  cooldownTicks = 1
): CardDefinition {
  return {
    id,
    name: id,
    tier: "BRONZE",
    type: "ACTIVE",
    size: 1,
    tags,
    cooldownTicks,
    effects,
    description: "Modifier test card."
  };
}

function createFormation(id: string, maxHp: number, cardInstanceIds: readonly (string | undefined)[]): FormationSnapshot {
  return {
    id,
    kind: id === "player" ? "PLAYER" : "MONSTER",
    displayName: id,
    level: 1,
    maxHp,
    startingArmor: 0,
    slots: [1, 2, 3, 4].map((slotIndex, index) => ({
      slotIndex,
      cardInstanceId: cardInstanceIds[index]
    })),
    skills: [],
    relics: []
  };
}

function simulate(
  card: CardDefinition,
  maxCombatTicks: number,
  modifiers: readonly Modifier[],
  initialCooldownRemainingTicks = 1
) {
  const instance: CardInstance = {
    instanceId: "active",
    definitionId: card.id
  };

  return new CombatEngine().simulate({
    playerFormation: createFormation("player", 40, ["active"]),
    enemyFormation: createFormation("enemy", 40, []),
    cardInstancesById: new Map([[instance.instanceId, instance]]),
    cardDefinitionsById: new Map([[card.id, card]]),
    initialCardRuntimeStates: [
      {
        instanceId: "active",
        definitionId: card.id,
        ownerCombatantId: "player",
        slotIndex: 1,
        cooldownMaxTicks: card.cooldownTicks ?? 1,
        cooldownRemainingTicks: initialCooldownRemainingTicks,
        cooldownRecoveryRate: 1,
        disabled: false,
        silenced: false,
        frozen: false,
        activationCount: 0
      }
    ],
    modifiers,
    maxCombatTicks
  });
}

function simulateDuel(
  playerCard: CardDefinition,
  enemyCard: CardDefinition,
  maxCombatTicks: number,
  modifiers: readonly Modifier[],
  playerInitialCooldownRemainingTicks = 1,
  enemyInitialCooldownRemainingTicks = 1
) {
  const playerInstance: CardInstance = {
    instanceId: "player-active",
    definitionId: playerCard.id
  };
  const enemyInstance: CardInstance = {
    instanceId: "enemy-active",
    definitionId: enemyCard.id
  };

  return new CombatEngine().simulate({
    playerFormation: createFormation("player", 40, ["player-active"]),
    enemyFormation: createFormation("enemy", 40, ["enemy-active"]),
    cardInstancesById: new Map([
      [playerInstance.instanceId, playerInstance],
      [enemyInstance.instanceId, enemyInstance]
    ]),
    cardDefinitionsById: new Map([
      [playerCard.id, playerCard],
      [enemyCard.id, enemyCard]
    ]),
    initialCardRuntimeStates: [
      {
        instanceId: "player-active",
        definitionId: playerCard.id,
        ownerCombatantId: "player",
        slotIndex: 1,
        cooldownMaxTicks: playerCard.cooldownTicks ?? 1,
        cooldownRemainingTicks: playerInitialCooldownRemainingTicks,
        cooldownRecoveryRate: 1,
        disabled: false,
        silenced: false,
        frozen: false,
        activationCount: 0
      },
      {
        instanceId: "enemy-active",
        definitionId: enemyCard.id,
        ownerCombatantId: "enemy",
        slotIndex: 1,
        cooldownMaxTicks: enemyCard.cooldownTicks ?? 1,
        cooldownRemainingTicks: enemyInitialCooldownRemainingTicks,
        cooldownRecoveryRate: 1,
        disabled: false,
        silenced: false,
        frozen: false,
        activationCount: 0
      }
    ],
    modifiers,
    maxCombatTicks
  });
}

function damageModifier(
  id: string,
  priority: number,
  operation: Modifier["operation"],
  expiresAtTick?: number,
  ownerId = "player"
): Modifier {
  return {
    id,
    sourceId: id,
    ownerId,
    hook: "BeforeDealDamage",
    priority,
    condition: { always: true },
    operation,
    expiresAtTick
  };
}

function runtimeCombatant(id: "player" | "enemy"): RuntimeCombatant {
  return {
    side: id === "player" ? "PLAYER" : "ENEMY",
    formation: createFormation(id, 40, []),
    hp: 40,
    armor: 0,
    cards: [],
    statuses: []
  };
}

describe("ModifierSystem", () => {
  it("executes modifiers in priority order", () => {
    const modifierSystem = new ModifierSystem([
      damageModifier("multiply-late", 2, { type: "MULTIPLY_DAMAGE", value: 2 }),
      damageModifier("add-early", 1, { type: "ADD_DAMAGE", value: 5 })
    ]);

    const result = modifierSystem.applyDamageModifiers(10, {
      tick: 1,
      sourceCombatant: runtimeCombatant("player"),
      combatants: [runtimeCombatant("player"), runtimeCombatant("enemy")],
      damageType: "DIRECT"
    });

    expect(result).toBe(30);
  });

  it("uses modifier id order when priority is tied", () => {
    const modifierSystem = new ModifierSystem([
      damageModifier("b-add", 1, { type: "ADD_DAMAGE", value: 3 }),
      damageModifier("a-multiply", 1, { type: "MULTIPLY_DAMAGE", value: 2 })
    ]);

    const result = modifierSystem.applyDamageModifiers(10, {
      tick: 1,
      sourceCombatant: runtimeCombatant("player"),
      combatants: [runtimeCombatant("player"), runtimeCombatant("enemy")],
      damageType: "DIRECT"
    });

    expect(result).toBe(23);
  });

  it("ADD_DAMAGE modifies damage", () => {
    const card = createActiveCard("strike", [{ command: "DealDamage", amount: 4 }]);

    const result = simulate(card, 1, [damageModifier("add-damage", 1, { type: "ADD_DAMAGE", value: 3 })]);

    expect(result.enemyFinalHp).toBe(33);
  });

  it("MULTIPLY_DAMAGE modifies damage", () => {
    const card = createActiveCard("strike", [{ command: "DealDamage", amount: 4 }]);

    const result = simulate(card, 1, [
      damageModifier("multiply-damage", 1, { type: "MULTIPLY_DAMAGE", value: 2 })
    ]);

    expect(result.enemyFinalHp).toBe(32);
  });

  it("cooldown recovery modifier changes activation timing", () => {
    const card = createActiveCard("slow-strike", [{ command: "DealDamage", amount: 1 }], [], 3);
    const modifier: Modifier = {
      id: "quick-hands",
      sourceId: "quick-hands",
      ownerId: "player",
      hook: "BeforeCooldownRecover",
      priority: 1,
      condition: { cardInSlot: 1 },
      operation: { type: "ADD_COOLDOWN_RECOVERY_RATE", value: 1 }
    };

    const result = simulate(card, 2, [modifier], 3);

    expect(result.replayTimeline.events).toContainEqual({
      tick: 2,
      type: "CardActivated",
      sourceId: "active",
      payload: {
        side: "PLAYER",
        slotIndex: 1,
        definitionId: "slow-strike"
      }
    });
  });

  it("status duration modifier changes Burn duration", () => {
    const card = createActiveCard("flame", [{ command: "ApplyBurn", amount: 1, durationTicks: 60 }], [], 999);
    const modifier: Modifier = {
      id: "lasting-flame",
      sourceId: "lasting-flame",
      ownerId: "player",
      hook: "OnStatusApplied",
      priority: 1,
      condition: { always: true },
      operation: { type: "ADD_STATUS_DURATION", value: 60 }
    };

    const result = simulate(card, 121, [modifier]);
    const burnDamageTicks = result.replayTimeline.events
      .filter((event) => event.type === "DamageDealt" && event.payload?.command === "BurnTick")
      .map((event) => event.tick);

    expect(burnDamageTicks).toEqual([61, 121]);
    expect(result.enemyFinalHp).toBe(38);
  });

  it("expired modifier no longer applies", () => {
    const card = createActiveCard("strike", [{ command: "DealDamage", amount: 4 }]);

    const result = simulate(card, 1, [
      damageModifier("expired-add", 1, { type: "ADD_DAMAGE", value: 10 }, 0)
    ]);

    expect(result.enemyFinalHp).toBe(36);
  });

  it("owner-scoped modifiers do not apply without a source combatant", () => {
    const modifierSystem = new ModifierSystem([
      damageModifier("add-without-source", 1, { type: "ADD_DAMAGE", value: 10 })
    ]);

    const result = modifierSystem.applyDamageModifiers(4, {
      tick: 1,
      combatants: [runtimeCombatant("player"), runtimeCombatant("enemy")],
      damageType: "DIRECT"
    });

    expect(result).toBe(4);
  });

  it("player-owned damage modifier does not modify enemy DealDamage", () => {
    const playerCard = createActiveCard("player-strike", [{ command: "DealDamage", amount: 1 }]);
    const enemyCard = createActiveCard("enemy-strike", [{ command: "DealDamage", amount: 4 }]);

    const result = simulateDuel(playerCard, enemyCard, 1, [
      damageModifier("player-add", 1, { type: "ADD_DAMAGE", value: 10 })
    ]);

    expect(result.playerFinalHp).toBe(36);
    expect(result.enemyFinalHp).toBe(29);
  });

  it("enemy-owned damage modifier does not modify player DealDamage", () => {
    const playerCard = createActiveCard("player-strike", [{ command: "DealDamage", amount: 4 }]);
    const enemyCard = createActiveCard("enemy-strike", [{ command: "DealDamage", amount: 1 }]);

    const result = simulateDuel(playerCard, enemyCard, 1, [
      damageModifier("enemy-add", 1, { type: "ADD_DAMAGE", value: 10 }, undefined, "enemy")
    ]);

    expect(result.enemyFinalHp).toBe(36);
    expect(result.playerFinalHp).toBe(29);
  });

  it("player-owned cooldown recovery modifier does not speed up enemy card cooldown", () => {
    const playerCard = createActiveCard("player-strike", [{ command: "DealDamage", amount: 1 }], [], 99);
    const enemyCard = createActiveCard("enemy-strike", [{ command: "DealDamage", amount: 1 }], [], 3);
    const modifier: Modifier = {
      id: "player-quick-hands",
      sourceId: "player-quick-hands",
      ownerId: "player",
      hook: "BeforeCooldownRecover",
      priority: 1,
      condition: { cardInSlot: 1 },
      operation: { type: "ADD_COOLDOWN_RECOVERY_RATE", value: 1 }
    };

    const result = simulateDuel(playerCard, enemyCard, 2, [modifier], 99, 3);

    expect(result.replayTimeline.events.some((event) => event.sourceId === "enemy-active")).toBe(false);
  });

  it("rounds decimal damage modifier results deterministically", () => {
    const card = createActiveCard("precise-strike", [{ command: "DealDamage", amount: 3 }]);

    const result = simulate(card, 1, [
      damageModifier("decimal-multiply", 1, { type: "MULTIPLY_DAMAGE", value: 1.5 })
    ]);

    expect(result.enemyFinalHp).toBe(35);
    expect(result.replayTimeline.events.find((event) => event.type === "DamageDealt")?.payload?.amount).toBe(5);
  });

  it("rounds decimal cooldown recovery modifier results deterministically", () => {
    const card = createActiveCard("precise-cooldown", [{ command: "DealDamage", amount: 1 }], [], 3);
    const modifier: Modifier = {
      id: "decimal-quick-hands",
      sourceId: "decimal-quick-hands",
      ownerId: "player",
      hook: "BeforeCooldownRecover",
      priority: 1,
      condition: { cardInSlot: 1 },
      operation: { type: "MULTIPLY_COOLDOWN_RECOVERY_RATE", value: 1.5 }
    };

    const result = simulate(card, 2, [modifier], 3);

    expect(result.replayTimeline.events.some((event) => event.type === "CardActivated")).toBe(true);
  });

  it("BurnTick does not receive source-owned damage modifiers without Burn source tracking", () => {
    const card = createActiveCard("flame", [{ command: "ApplyBurn", amount: 2, durationTicks: 60 }], [], 999);

    const result = simulate(card, 61, [
      damageModifier("source-owned-fire-add", 1, { type: "ADD_DAMAGE", value: 10 })
    ]);
    const burnDamage = result.replayTimeline.events.find(
      (event) => event.type === "DamageDealt" && event.payload?.command === "BurnTick"
    );

    expect(burnDamage?.payload?.hpDamage).toBe(2);
    expect(result.enemyFinalHp).toBe(38);
  });
});
