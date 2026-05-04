import { describe, expect, it } from "vitest";

import { CombatEngine } from "../../src/combat/CombatEngine.js";
import type { CardDefinition, CardInstance, CardRuntimeState } from "../../src/model/card.js";
import type { FormationSnapshot } from "../../src/model/formation.js";

function activeCard(id: string, effects: CardDefinition["effects"], cooldownTicks = 1, tags: readonly string[] = []): CardDefinition {
  return {
    id,
    name: id,
    tier: "BRONZE",
    type: "ACTIVE",
    size: 1,
    tags,
    cooldownTicks,
    effects,
    description: "Reaction active test card."
  };
}

function passiveCard(id: string, triggers: CardDefinition["triggers"], tags: readonly string[] = []): CardDefinition {
  return {
    id,
    name: id,
    tier: "BRONZE",
    type: "PASSIVE",
    size: 1,
    tags,
    triggers,
    description: "Reaction passive test card."
  };
}

function formation(id: "player" | "enemy", maxHp: number, cardInstanceIds: readonly (string | undefined)[]): FormationSnapshot {
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

function runtimeState(
  instanceId: string,
  definitionId: string,
  ownerCombatantId: "player" | "enemy",
  slotIndex: number,
  cooldownMaxTicks: number,
  cooldownRemainingTicks = 1
): CardRuntimeState {
  return {
    instanceId,
    definitionId,
    ownerCombatantId,
    slotIndex,
    cooldownMaxTicks,
    cooldownRemainingTicks,
    cooldownRecoveryRate: 1,
    disabled: false,
    silenced: false,
    frozen: false,
    activationCount: 0
  };
}

function simulate(input: {
  readonly playerCards: readonly CardDefinition[];
  readonly enemyCards?: readonly CardDefinition[];
  readonly playerSlots?: readonly (string | undefined)[];
  readonly enemySlots?: readonly (string | undefined)[];
  readonly playerInitialCooldowns?: Readonly<Record<string, number>>;
  readonly enemyInitialCooldowns?: Readonly<Record<string, number>>;
  readonly maxCombatTicks: number;
  readonly sidePriority?: readonly ("PLAYER" | "ENEMY")[];
  readonly resolutionStackLimits?: Parameters<CombatEngine["simulate"]>[0]["resolutionStackLimits"];
}) {
  const enemyCards = input.enemyCards ?? [];
  const playerSlots = input.playerSlots ?? input.playerCards.map((_, index) => `player-card-${index + 1}`);
  const enemySlots = input.enemySlots ?? enemyCards.map((_, index) => `enemy-card-${index + 1}`);
  const playerInstances: CardInstance[] = input.playerCards.map((card, index) => ({
    instanceId: `player-card-${index + 1}`,
    definitionId: card.id
  }));
  const enemyInstances: CardInstance[] = enemyCards.map((card, index) => ({
    instanceId: `enemy-card-${index + 1}`,
    definitionId: card.id
  }));
  const allCards = [...input.playerCards, ...enemyCards];
  const allInstances = [...playerInstances, ...enemyInstances];

  return new CombatEngine().simulate({
    playerFormation: formation("player", 50, playerSlots),
    enemyFormation: formation("enemy", 50, enemySlots),
    cardInstancesById: new Map(allInstances.map((card) => [card.instanceId, card])),
    cardDefinitionsById: new Map(allCards.map((card) => [card.id, card])),
    initialCardRuntimeStates: [
      ...playerInstances.map((instance) => {
        const definition = input.playerCards.find((card) => card.id === instance.definitionId);
        return runtimeState(
          instance.instanceId,
          instance.definitionId,
          "player",
          playerSlots.indexOf(instance.instanceId) + 1,
          definition?.cooldownTicks ?? 999,
          input.playerInitialCooldowns?.[instance.instanceId] ?? 1
        );
      }),
      ...enemyInstances.map((instance) => {
        const definition = enemyCards.find((card) => card.id === instance.definitionId);
        return runtimeState(
          instance.instanceId,
          instance.definitionId,
          "enemy",
          enemySlots.indexOf(instance.instanceId) + 1,
          definition?.cooldownTicks ?? 999,
          input.enemyInitialCooldowns?.[instance.instanceId] ?? 1
        );
      })
    ],
    maxCombatTicks: input.maxCombatTicks,
    sidePriority: input.sidePriority,
    resolutionStackLimits: input.resolutionStackLimits
  });
}

describe("status reaction triggers", () => {
  it("OnStatusTicked fires for Burn and Poison ticks", () => {
    const applier = activeCard("status-applier", [
      { command: "ApplyBurn", amount: 1, durationTicks: 120 },
      { command: "ApplyPoison", amount: 1 }
    ]);
    const watcher = passiveCard("watcher", [
      { hook: "OnStatusTicked", conditions: { status: "Burn" }, internalCooldownTicks: 60, maxTriggersPerTick: 1, effects: [] },
      { hook: "OnStatusTicked", conditions: { status: "Poison" }, internalCooldownTicks: 60, maxTriggersPerTick: 1, effects: [] }
    ]);

    const result = simulate({ playerCards: [watcher, applier], maxCombatTicks: 61 });
    const triggerStatuses = result.replayTimeline.events
      .filter((event) => event.type === "TriggerFired" && event.payload?.hook === "OnStatusTicked")
      .map((event) => event.payload?.triggerId);

    expect(triggerStatuses).toEqual(["player-card-1:0", "player-card-1:1"]);
  });

  it("OnHealReceived fires only when HealHP actually restores HP", () => {
    const healer = activeCard("healer", [{ command: "HealHP", amount: 5 }], 999);
    const attacker = activeCard("attacker", [{ command: "DealDamage", amount: 3 }], 999);
    const triage = passiveCard("triage", [
      {
        hook: "OnHealReceived",
        conditions: { appliedByOwner: true, healedAmountAtLeast: 1 },
        internalCooldownTicks: 60,
        maxTriggersPerTick: 1,
        effects: [{ command: "GainArmor", amount: 2 }]
      }
    ]);

    const zeroHeal = simulate({ playerCards: [triage, healer], maxCombatTicks: 1 });
    const realHeal = simulate({
      playerCards: [triage, healer],
      enemyCards: [attacker],
      playerInitialCooldowns: { "player-card-2": 2 },
      maxCombatTicks: 2
    });

    expect(zeroHeal.replayTimeline.events.some((event) => event.type === "TriggerFired" && event.payload?.hook === "OnHealReceived")).toBe(false);
    expect(realHeal.replayTimeline.events).toContainEqual({
      tick: 2,
      type: "ArmorGained",
      sourceId: "player-card-1",
      targetId: "player",
      payload: {
        command: "GainArmor",
        amount: 2,
        armor: 2
      }
    });
  });

  it("Poison tick can trigger a HealHP reaction through ResolutionStack", () => {
    const poison = activeCard("poison", [{ command: "ApplyPoison", amount: 1 }], 999);
    const chip = activeCard("chip", [{ command: "DealDamage", amount: 5 }], 999);
    const leech = passiveCard("leech", [
      {
        hook: "OnStatusTicked",
        conditions: { status: "Poison", appliedByOwner: true },
        internalCooldownTicks: 60,
        maxTriggersPerTick: 1,
        effects: [{ command: "HealHP", amount: 1 }]
      }
    ]);

    const result = simulate({ playerCards: [leech, poison], enemyCards: [chip], maxCombatTicks: 61 });

    expect(result.replayTimeline.events).toContainEqual({
      tick: 61,
      type: "HpHealed",
      sourceId: "player-card-1",
      targetId: "player",
      payload: {
        command: "HealHP",
        amount: 1,
        requestedAmount: 1,
        targetSide: "PLAYER",
        targetHp: 46,
        maxHp: 50
      }
    });
  });

  it("Burn ticking on a Poisoned enemy can trigger bonus Fire damage", () => {
    const applier = activeCard("hybrid", [
      { command: "ApplyBurn", amount: 1, durationTicks: 120 },
      { command: "ApplyPoison", amount: 1 }
    ], 999);
    const seal = passiveCard("toxic-flame", [
      {
        hook: "OnStatusTicked",
        conditions: { status: "Burn", appliedByOwner: true, targetHasStatus: "Poison" },
        internalCooldownTicks: 60,
        maxTriggersPerTick: 1,
        effects: [{ command: "DealDamage", amount: 1, damageType: "FIRE" }]
      }
    ]);

    const result = simulate({ playerCards: [seal, applier], maxCombatTicks: 61 });
    const reactionDamage = result.replayTimeline.events.find(
      (event) => event.type === "DamageDealt" && event.sourceId === "player-card-1"
    );

    expect(reactionDamage?.payload).toMatchObject({ command: "DealDamage", amount: 1, damageType: "FIRE", hpDamage: 1 });
    expect(result.enemyFinalHp).toBe(47);
  });

  it("internalCooldownTicks and maxTriggersPerTick prevent reaction spam", () => {
    const applier = activeCard("status-applier", [
      { command: "ApplyBurn", amount: 1, durationTicks: 240 },
      { command: "ApplyPoison", amount: 1 }
    ], 999);
    const watcher = passiveCard("limited", [
      {
        hook: "OnStatusTicked",
        internalCooldownTicks: 120,
        maxTriggersPerTick: 1,
        effects: [{ command: "DealDamage", amount: 1 }]
      }
    ]);

    const result = simulate({ playerCards: [watcher, applier], maxCombatTicks: 181 });
    const triggerTicks = result.replayTimeline.events
      .filter((event) => event.type === "TriggerFired" && event.sourceId === "player-card-1")
      .map((event) => event.tick);

    expect(triggerTicks).toEqual([61, 181]);
  });

  it("reaction-created status commands do not create same-tick status loops", () => {
    const poison = activeCard("poison", [{ command: "ApplyPoison", amount: 1 }], 999);
    const reactor = passiveCard("more-poison", [
      {
        hook: "OnStatusTicked",
        conditions: { status: "Poison", appliedByOwner: true },
        internalCooldownTicks: 60,
        maxTriggersPerTick: 1,
        effects: [{ command: "ApplyPoison", amount: 1 }]
      }
    ]);

    const result = simulate({ playerCards: [reactor, poison], maxCombatTicks: 61 });
    const poisonTickTicks = result.replayTimeline.events
      .filter((event) => event.payload?.command === "PoisonTick")
      .map((event) => event.tick);

    expect(poisonTickTicks).toEqual([61]);
    expect(result.replayTimeline.events.some((event) => event.type === "StackLimitReached")).toBe(false);
  });

  it("OnHealReceived recursion is still bounded by ResolutionStack safety", () => {
    const healer = activeCard("healer", [{ command: "HealHP", amount: 1 }], 999);
    const attacker = activeCard("attacker", [{ command: "DealDamage", amount: 20 }], 999);
    const loop = passiveCard("heal-loop", [
      {
        hook: "OnHealReceived",
        internalCooldownTicks: 0,
        maxTriggersPerTick: 20,
        effects: [{ command: "HealHP", amount: 1 }]
      }
    ]);

    const result = simulate({
      playerCards: [loop, healer],
      enemyCards: [attacker],
      playerInitialCooldowns: { "player-card-2": 2 },
      maxCombatTicks: 2,
      resolutionStackLimits: {
        maxCommandsPerTick: 200,
        maxCommandsPerCombat: 20000,
        maxTriggerDepth: 2
      }
    });

    expect(result.combatLog).toContain("2: ResolutionStack exceeded max trigger depth 2.");
  });

  it("passive control reactions target active runtime cards only and never passive cards", () => {
    const poison = activeCard("poison", [{ command: "ApplyPoison", amount: 1 }], 999);
    const activeTarget = activeCard("active-target", [], 999);
    const passiveTarget = passiveCard("passive-target", [
      { hook: "OnCombatStart", internalCooldownTicks: 999, maxTriggersPerTick: 1, effects: [] }
    ]);
    const controller = passiveCard("controller", [
      {
        hook: "OnStatusTicked",
        conditions: { status: "Poison", appliedByOwner: true },
        internalCooldownTicks: 60,
        maxTriggersPerTick: 1,
        effects: [{ command: "ApplyHaste", "target": "OWNER_ALL_CARDS", "percent": 25, "durationTicks": 60 }]
      }
    ]);

    const result = simulate({
      playerCards: [controller, poison, passiveTarget, activeTarget],
      playerSlots: ["player-card-1", "player-card-2", "player-card-3", "player-card-4"],
      maxCombatTicks: 61
    });
    const controlTargets = result.replayTimeline.events
      .filter((event) => event.type === "StatusApplied" && event.payload?.command === "ApplyHaste")
      .map((event) => event.targetId);

    expect(controlTargets).toEqual(["player-card-2", "player-card-4"]);
    expect(controlTargets).not.toContain("player-card-1");
    expect(controlTargets).not.toContain("player-card-3");
  });

  it("passive reaction SELF control effects resolve to no active target", () => {
    const poison = activeCard("poison", [{ command: "ApplyPoison", amount: 1 }], 999);
    const selfControl = passiveCard("self-control", [
      {
        hook: "OnStatusTicked",
        conditions: { status: "Poison", appliedByOwner: true },
        internalCooldownTicks: 60,
        maxTriggersPerTick: 1,
        effects: [
          { command: "ApplyHaste", target: "SELF", percent: 25, durationTicks: 60 },
          { command: "ApplySlow", target: "SELF", percent: 25, durationTicks: 60 }
        ]
      }
    ]);

    const result = simulate({ playerCards: [selfControl, poison], maxCombatTicks: 61 });

    expect(result.replayTimeline.events.some((event) => event.type === "StatusApplied" && event.payload?.command === "ApplyHaste")).toBe(false);
    expect(result.replayTimeline.events.some((event) => event.type === "StatusApplied" && event.payload?.command === "ApplySlow")).toBe(false);
  });

  it("passive adjacent Haste and enemy Slow reactions use the passive slot as an anchor", () => {
    const poison = activeCard("poison", [{ command: "ApplyPoison", amount: 1 }], 999);
    const ally = activeCard("ally", [], 999);
    const enemy = activeCard("enemy", [], 999);
    const controller = passiveCard("slot-controller", [
      {
        hook: "OnStatusTicked",
        conditions: { status: "Poison", appliedByOwner: true },
        internalCooldownTicks: 60,
        maxTriggersPerTick: 1,
        effects: [
          { command: "ApplyHaste", target: "ADJACENT_ALLY", percent: 15, durationTicks: 60 },
          { command: "ApplySlow", target: "OPPOSITE_ENEMY_CARD", percent: 15, durationTicks: 60 }
        ]
      }
    ]);

    const result = simulate({
      playerCards: [controller, ally, poison],
      enemyCards: [enemy],
      playerSlots: ["player-card-1", "player-card-2", "player-card-3"],
      enemySlots: ["enemy-card-1"],
      maxCombatTicks: 61
    });

    expect(result.replayTimeline.events).toContainEqual(expect.objectContaining({
      tick: 61,
      type: "StatusApplied",
      targetId: "player-card-2",
      payload: expect.objectContaining({ command: "ApplyHaste", status: "Haste" })
    }));
    expect(result.replayTimeline.events).toContainEqual(expect.objectContaining({
      tick: 61,
      type: "StatusApplied",
      targetId: "enemy-card-1",
      payload: expect.objectContaining({ command: "ApplySlow", status: "Slow" })
    }));
  });

  it("Haste, Slow, and Freeze reactions do not change Burn or Poison tick intervals", () => {
    const applier = activeCard("status-applier", [
      { command: "ApplyBurn", amount: 1, durationTicks: 180 },
      { command: "ApplyPoison", amount: 1 }
    ], 999);
    const enemy = activeCard("enemy", [], 999);
    const controller = passiveCard("control-reaction", [
      {
        hook: "OnStatusTicked",
        conditions: { appliedByOwner: true },
        internalCooldownTicks: 60,
        maxTriggersPerTick: 1,
        effects: [
          { command: "ApplyHaste", target: "OWNER_ALL_CARDS", percent: 50, durationTicks: 60 },
          { command: "ApplySlow", target: "ENEMY_LEFTMOST_ACTIVE", percent: 50, durationTicks: 60 },
          { command: "ApplyFreeze", target: "ENEMY_LEFTMOST_ACTIVE", durationTicks: 30 }
        ]
      }
    ]);

    const result = simulate({ playerCards: [controller, applier], enemyCards: [enemy], maxCombatTicks: 121 });
    const burnTicks = result.replayTimeline.events.filter((event) => event.payload?.command === "BurnTick");
    const poisonTicks = result.replayTimeline.events.filter((event) => event.payload?.command === "PoisonTick");

    expect(burnTicks.map((event) => event.tick)).toEqual([61, 121]);
    expect(poisonTicks.map((event) => event.tick)).toEqual([61, 121]);
  });

  it("reaction replay and summary remain deterministic", () => {
    const poison = activeCard("poison", [{ command: "ApplyPoison", amount: 1 }], 999);
    const leech = passiveCard("leech", [
      {
        hook: "OnStatusTicked",
        conditions: { status: "Poison", appliedByOwner: true },
        internalCooldownTicks: 60,
        maxTriggersPerTick: 1,
        effects: [{ command: "DealDamage", amount: 1 }]
      }
    ]);

    const first = simulate({ playerCards: [leech, poison], maxCombatTicks: 121 });
    const second = simulate({ playerCards: [leech, poison], maxCombatTicks: 121 });

    expect(second.replayTimeline).toEqual(first.replayTimeline);
    expect(second.summary).toEqual(first.summary);
    expect(first.summary.triggerCountByCard).toEqual({ "player-card-1": 2 });
  });
});
