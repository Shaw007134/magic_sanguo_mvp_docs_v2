import { describe, expect, it } from "vitest";

import { CombatEngine } from "../../src/combat/CombatEngine.js";
import type { Modifier } from "../../src/combat/modifiers/Modifier.js";
import { ModifierSystem } from "../../src/combat/modifiers/ModifierSystem.js";
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

function damageModifier(
  id: string,
  priority: number,
  operation: Modifier["operation"],
  expiresAtTick?: number
): Modifier {
  return {
    id,
    sourceId: id,
    ownerId: "player",
    hook: "BeforeDealDamage",
    priority,
    condition: { always: true },
    operation,
    expiresAtTick
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
      combatants: [],
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
      combatants: [],
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
      type: "CARD_ACTIVATED",
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
      .filter((event) => event.type === "DAMAGE_DEALT" && event.payload?.command === "BurnTick")
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
});
