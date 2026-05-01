import { describe, expect, it } from "vitest";

import { CombatEngine } from "../../src/combat/CombatEngine.js";
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
    description: "Active test card."
  };
}

function createPassiveCard(id: string, triggers: CardDefinition["triggers"]): CardDefinition {
  return {
    id,
    name: id,
    tier: "BRONZE",
    type: "PASSIVE",
    size: 1,
    tags: [],
    triggers,
    description: "Passive test card."
  };
}

function createFormation(
  id: string,
  maxHp: number,
  cardInstanceIds: readonly (string | undefined)[]
): FormationSnapshot {
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

function simulateWithCards(
  playerCards: readonly CardDefinition[],
  playerInstances: readonly CardInstance[],
  playerSlots: readonly (string | undefined)[],
  maxCombatTicks: number
) {
  return new CombatEngine().simulate({
    playerFormation: createFormation("player", 40, playerSlots),
    enemyFormation: createFormation("enemy", 40, []),
    cardInstancesById: new Map(playerInstances.map((instance) => [instance.instanceId, instance])),
    cardDefinitionsById: new Map(playerCards.map((card) => [card.id, card])),
    initialCardRuntimeStates: playerInstances.map((instance, index) => ({
      instanceId: instance.instanceId,
      definitionId: instance.definitionId,
      ownerCombatantId: "player",
      slotIndex: index + 1,
      cooldownMaxTicks: 1,
      cooldownRemainingTicks: 1,
      cooldownRecoveryRate: 1,
      disabled: false,
      silenced: false,
      frozen: false,
      activationCount: 0
    })),
    maxCombatTicks
  });
}

function simulateScenario(input: {
  readonly playerCards: readonly CardDefinition[];
  readonly enemyCards: readonly CardDefinition[];
  readonly playerInstances: readonly CardInstance[];
  readonly enemyInstances: readonly CardInstance[];
  readonly playerSlots: readonly (string | undefined)[];
  readonly enemySlots: readonly (string | undefined)[];
  readonly maxCombatTicks: number;
  readonly resolutionStackLimits?: Parameters<CombatEngine["simulate"]>[0]["resolutionStackLimits"];
}) {
  const allInstances = [...input.playerInstances, ...input.enemyInstances];
  const allCards = [...input.playerCards, ...input.enemyCards];
  const cardsById = new Map(allCards.map((card) => [card.id, card]));

  return new CombatEngine().simulate({
    playerFormation: createFormation("player", 40, input.playerSlots),
    enemyFormation: createFormation("enemy", 40, input.enemySlots),
    cardInstancesById: new Map(allInstances.map((instance) => [instance.instanceId, instance])),
    cardDefinitionsById: cardsById,
    initialCardRuntimeStates: allInstances.map((instance) => {
      const card = cardsById.get(instance.definitionId);
      const cooldownTicks = card?.cooldownTicks ?? 1;

      return {
        instanceId: instance.instanceId,
        definitionId: instance.definitionId,
        ownerCombatantId: input.playerInstances.includes(instance) ? "player" : "enemy",
        slotIndex:
          (input.playerInstances.includes(instance)
            ? input.playerSlots.indexOf(instance.instanceId)
            : input.enemySlots.indexOf(instance.instanceId)) + 1,
        cooldownMaxTicks: cooldownTicks,
        cooldownRemainingTicks: 1,
        cooldownRecoveryRate: 1,
        disabled: false,
        silenced: false,
        frozen: false,
        activationCount: 0
      };
    }),
    maxCombatTicks: input.maxCombatTicks,
    resolutionStackLimits: input.resolutionStackLimits
  });
}

describe("TriggerSystem", () => {
  it("fires a passive trigger on OnStatusApplied", () => {
    const active = createActiveCard("flame", [{ command: "ApplyBurn", amount: 1, durationTicks: 120 }]);
    const passive = createPassiveCard("ember-rebuke", [
      {
        hook: "OnStatusApplied",
        conditions: { status: "Burn", appliedByOwner: true },
        effects: [{ command: "DealDamage", amount: 3 }]
      }
    ]);

    const result = simulateWithCards(
      [passive, active],
      [
        { instanceId: "passive", definitionId: passive.id },
        { instanceId: "active", definitionId: active.id }
      ],
      ["passive", "active"],
      1
    );

    expect(result.replayTimeline.events).toContainEqual({
      tick: 1,
      type: "TriggerFired",
      sourceId: "passive",
      targetId: "enemy",
      payload: {
        hook: "OnStatusApplied",
        triggerId: "passive:0"
      }
    });
    expect(result.enemyFinalHp).toBe(37);
  });

  it("uses internal cooldown to prevent repeated trigger spam", () => {
    const active = createActiveCard("flame", [{ command: "ApplyBurn", amount: 1, durationTicks: 180 }]);
    const passive = createPassiveCard("ember-rebuke", [
      {
        hook: "OnStatusApplied",
        conditions: { status: "Burn", appliedByOwner: true },
        internalCooldownTicks: 5,
        effects: [{ command: "DealDamage", amount: 3 }]
      }
    ]);

    const result = simulateWithCards(
      [passive, active],
      [
        { instanceId: "passive", definitionId: passive.id },
        { instanceId: "active", definitionId: active.id }
      ],
      ["passive", "active"],
      2
    );
    const triggerEvents = result.replayTimeline.events.filter((event) => event.type === "TriggerFired");

    expect(triggerEvents).toHaveLength(1);
    expect(triggerEvents[0]?.tick).toBe(1);
  });

  it("enforces maxTriggersPerTick", () => {
    const firstActive = createActiveCard("flame-a", [{ command: "ApplyBurn", amount: 1, durationTicks: 120 }]);
    const secondActive = createActiveCard("flame-b", [{ command: "ApplyBurn", amount: 1, durationTicks: 120 }]);
    const passive = createPassiveCard("ember-rebuke", [
      {
        hook: "OnStatusApplied",
        conditions: { status: "Burn", appliedByOwner: true },
        maxTriggersPerTick: 1,
        effects: [{ command: "DealDamage", amount: 3 }]
      }
    ]);

    const result = simulateWithCards(
      [passive, firstActive, secondActive],
      [
        { instanceId: "passive", definitionId: passive.id },
        { instanceId: "active-a", definitionId: firstActive.id },
        { instanceId: "active-b", definitionId: secondActive.id }
      ],
      ["passive", "active-a", "active-b"],
      1
    );

    expect(result.replayTimeline.events.filter((event) => event.type === "TriggerFired")).toHaveLength(1);
  });

  it("pushes trigger-created commands to ResolutionStack", () => {
    const active = createActiveCard("flame", [{ command: "ApplyBurn", amount: 1, durationTicks: 120 }]);
    const passive = createPassiveCard("guarded-flame", [
      {
        hook: "OnStatusApplied",
        conditions: { status: "Burn" },
        effects: [{ command: "GainArmor", amount: 4 }]
      }
    ]);

    const result = simulateWithCards(
      [passive, active],
      [
        { instanceId: "passive", definitionId: passive.id },
        { instanceId: "active", definitionId: active.id }
      ],
      ["passive", "active"],
      1
    );

    expect(result.replayTimeline.events).toContainEqual({
      tick: 1,
      type: "ArmorGained",
      sourceId: "passive",
      targetId: "player",
      payload: {
        command: "GainArmor",
        amount: 4,
        armor: 4
      }
    });
  });

  it("orders triggers deterministically by passive slot then instance id", () => {
    const active = createActiveCard("flame", [{ command: "ApplyBurn", amount: 1, durationTicks: 120 }]);
    const firstPassive = createPassiveCard("first-passive", [
      { hook: "OnStatusApplied", conditions: { status: "Burn" }, effects: [{ command: "DealDamage", amount: 1 }] }
    ]);
    const secondPassive = createPassiveCard("second-passive", [
      { hook: "OnStatusApplied", conditions: { status: "Burn" }, effects: [{ command: "DealDamage", amount: 2 }] }
    ]);

    const result = simulateWithCards(
      [firstPassive, secondPassive, active],
      [
        { instanceId: "passive-b", definitionId: secondPassive.id },
        { instanceId: "passive-a", definitionId: firstPassive.id },
        { instanceId: "active", definitionId: active.id }
      ],
      ["passive-b", "passive-a", "active"],
      1
    );

    const triggerSourceIds = result.replayTimeline.events
      .filter((event) => event.type === "TriggerFired")
      .map((event) => event.sourceId);
    const triggerDamageAmounts = result.replayTimeline.events
      .filter((event) => event.type === "DamageDealt" && event.sourceId?.startsWith("passive"))
      .map((event) => event.payload?.amount);

    expect(triggerSourceIds).toEqual(["passive-b", "passive-a"]);
    expect(triggerDamageAmounts).toEqual([2, 1]);
  });

  it("does not trigger when no valid condition matches", () => {
    const active = createActiveCard("flame", [{ command: "ApplyBurn", amount: 1, durationTicks: 120 }]);
    const passive = createPassiveCard("cold-rebuke", [
      {
        hook: "OnStatusApplied",
        conditions: { sourceHasTag: "ice" },
        effects: [{ command: "DealDamage", amount: 3 }]
      }
    ]);

    const result = simulateWithCards(
      [passive, active],
      [
        { instanceId: "passive", definitionId: passive.id },
        { instanceId: "active", definitionId: active.id }
      ],
      ["passive", "active"],
      1
    );

    expect(result.replayTimeline.events.filter((event) => event.type === "TriggerFired")).toHaveLength(0);
    expect(result.enemyFinalHp).toBe(40);
  });

  it("OnDamageTaken DealDamage owned by damaged combatant damages the opposing attacker", () => {
    const strike = createActiveCard("strike", [{ command: "DealDamage", amount: 4 }]);
    const counter = createPassiveCard("counter", [
      { hook: "OnDamageTaken", effects: [{ command: "DealDamage", amount: 3 }] }
    ]);

    const result = simulateScenario({
      playerCards: [strike],
      enemyCards: [counter],
      playerInstances: [{ instanceId: "strike", definitionId: strike.id }],
      enemyInstances: [{ instanceId: "counter", definitionId: counter.id }],
      playerSlots: ["strike"],
      enemySlots: ["counter"],
      maxCombatTicks: 1
    });

    expect(result.playerFinalHp).toBe(37);
    expect(result.enemyFinalHp).toBe(36);
  });

  it("OnDamageTaken GainArmor owned by damaged combatant gives armor to itself", () => {
    const strike = createActiveCard("strike", [{ command: "DealDamage", amount: 4 }]);
    const guard = createPassiveCard("guard", [
      { hook: "OnDamageTaken", effects: [{ command: "GainArmor", amount: 5 }] }
    ]);

    const result = simulateScenario({
      playerCards: [strike],
      enemyCards: [guard],
      playerInstances: [{ instanceId: "strike", definitionId: strike.id }],
      enemyInstances: [{ instanceId: "guard", definitionId: guard.id }],
      playerSlots: ["strike"],
      enemySlots: ["guard"],
      maxCombatTicks: 1
    });

    expect(result.replayTimeline.events).toContainEqual({
      tick: 1,
      type: "ArmorGained",
      sourceId: "guard",
      targetId: "enemy",
      payload: {
        command: "GainArmor",
        amount: 5,
        armor: 5
      }
    });
  });

  it("stops recursive trigger chains by maxTriggerDepth", () => {
    const strike = createActiveCard("strike", [{ command: "DealDamage", amount: 1 }]);
    const echo = createPassiveCard("echo", [
      {
        hook: "OnDamageDealt",
        maxTriggersPerTick: 20,
        effects: [{ command: "DealDamage", amount: 1 }]
      }
    ]);

    const result = simulateScenario({
      playerCards: [echo, strike],
      enemyCards: [],
      playerInstances: [
        { instanceId: "echo", definitionId: echo.id },
        { instanceId: "strike", definitionId: strike.id }
      ],
      enemyInstances: [],
      playerSlots: ["echo", "strike"],
      enemySlots: [],
      maxCombatTicks: 1,
      resolutionStackLimits: {
        maxCommandsPerTick: 200,
        maxCommandsPerCombat: 20000,
        maxTriggerDepth: 2
      }
    });

    expect(result.replayTimeline.events.some((event) => event.type === "StackLimitReached")).toBe(false);
    expect(result.combatLog).toContain("1: ResolutionStack exceeded max trigger depth 2.");
  });

  it("OnCombatEnd trigger logs but does not mutate final HP or winner", () => {
    const ender = createPassiveCard("ender", [
      { hook: "OnCombatEnd", effects: [{ command: "DealDamage", amount: 40 }] }
    ]);

    const result = simulateScenario({
      playerCards: [ender],
      enemyCards: [],
      playerInstances: [{ instanceId: "ender", definitionId: ender.id }],
      enemyInstances: [],
      playerSlots: ["ender"],
      enemySlots: [],
      maxCombatTicks: 1
    });

    expect(result.winner).toBe("DRAW");
    expect(result.playerFinalHp).toBe(40);
    expect(result.enemyFinalHp).toBe(40);
    expect(result.replayTimeline.events.filter((event) => event.type === "DamageDealt")).toHaveLength(0);
    expect(result.replayTimeline.events).toContainEqual({
      tick: 1,
      type: "TriggerFired",
      sourceId: "ender",
      targetId: "enemy",
      payload: {
        hook: "OnCombatEnd",
        triggerId: "ender:0"
      }
    });
  });

  it("OnBurnTick appliedByOwner condition does not fire without Burn source ownership tracking", () => {
    const flame = createActiveCard("flame", [{ command: "ApplyBurn", amount: 1, durationTicks: 120 }], [], 999);
    const burnWatcher = createPassiveCard("burn-watcher", [
      {
        hook: "OnBurnTick",
        conditions: { status: "Burn", appliedByOwner: true },
        effects: [{ command: "DealDamage", amount: 5 }]
      }
    ]);

    const result = simulateScenario({
      playerCards: [burnWatcher, flame],
      enemyCards: [],
      playerInstances: [
        { instanceId: "burn-watcher", definitionId: burnWatcher.id },
        { instanceId: "flame", definitionId: flame.id }
      ],
      enemyInstances: [],
      playerSlots: ["burn-watcher", "flame"],
      enemySlots: [],
      maxCombatTicks: 61
    });

    expect(result.enemyFinalHp).toBe(39);
    expect(result.replayTimeline.events.filter((event) => event.type === "TriggerFired")).toHaveLength(0);
  });
});
