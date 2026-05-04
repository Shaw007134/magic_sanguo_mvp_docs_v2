import { describe, expect, it } from "vitest";

import { CombatEngine } from "../../src/combat/CombatEngine.js";
import type { Modifier } from "../../src/combat/modifiers/Modifier.js";
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
    description: "Control status test card."
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
  readonly playerInitialCooldowns?: readonly number[];
  readonly enemyInitialCooldowns?: readonly number[];
  readonly playerArmor?: number;
  readonly enemyArmor?: number;
  readonly maxCombatTicks: number;
  readonly sidePriority?: readonly ("PLAYER" | "ENEMY")[];
  readonly modifiers?: readonly Modifier[];
}) {
  const enemyCards = input.enemyCards ?? [];
  const cardInstances: CardInstance[] = [
    ...input.playerCards.map((card, index) => ({
      instanceId: `player-card-${index + 1}`,
      definitionId: card.id
    })),
    ...enemyCards.map((card, index) => ({
      instanceId: `enemy-card-${index + 1}`,
      definitionId: card.id
    }))
  ];
  const cardDefinitions = [...input.playerCards, ...enemyCards];
  return new CombatEngine().simulate({
    playerFormation: formation(
      "player",
      50,
      input.playerCards.map((_, index) => `player-card-${index + 1}`),
      input.playerArmor ?? 0
    ),
    enemyFormation: formation(
      "enemy",
      50,
      enemyCards.map((_, index) => `enemy-card-${index + 1}`),
      input.enemyArmor ?? 0
    ),
    cardInstancesById: new Map(cardInstances.map((card) => [card.instanceId, card])),
    cardDefinitionsById: new Map(cardDefinitions.map((card) => [card.id, card])),
    initialCardRuntimeStates: [
      ...input.playerCards.map((card, index) =>
        runtimeState(
          `player-card-${index + 1}`,
          card.id,
          "player",
          index + 1,
          card.cooldownTicks ?? 999,
          input.playerInitialCooldowns?.[index] ?? 1
        )
      ),
      ...enemyCards.map((card, index) =>
        runtimeState(
          `enemy-card-${index + 1}`,
          card.id,
          "enemy",
          index + 1,
          card.cooldownTicks ?? 999,
          input.enemyInitialCooldowns?.[index] ?? 1
        )
      )
    ],
    maxCombatTicks: input.maxCombatTicks,
    sidePriority: input.sidePriority,
    modifiers: input.modifiers
  });
}

function activationTicks(result: ReturnType<CombatEngine["simulate"]>, sourceId: string): readonly number[] {
  return result.replayTimeline.events
    .filter((event) => event.type === "CardActivated" && event.sourceId === sourceId)
    .map((event) => event.tick);
}

describe("Haste, Slow, and Freeze control statuses", () => {
  it("Haste increases cooldown recovery only while active and preserves partial cooldown math", () => {
    const hasted = activeCard("self-haste", [{ command: "ApplyHaste", target: "SELF", percent: 50, durationTicks: 60 }], 120);

    const result = simulate({ playerCards: [hasted], maxCombatTicks: 91 });

    expect(activationTicks(result, "player-card-1")).toEqual([1, 91]);
  });

  it("Haste stacking is additive and clamps at +100%", () => {
    const hasted = activeCard(
      "stacked-haste",
      [
        { command: "ApplyHaste", target: "SELF", percent: 75, durationTicks: 60 },
        { command: "ApplyHaste", target: "SELF", percent: 75, durationTicks: 60 }
      ],
      120
    );

    const result = simulate({ playerCards: [hasted], maxCombatTicks: 61 });

    expect(activationTicks(result, "player-card-1")).toEqual([1, 61]);
  });

  it("Haste cannot create zero-cooldown or same-tick runaway activation loops", () => {
    const hasted = activeCard(
      "runaway-guard",
      [
        { command: "ApplyHaste", target: "SELF", percent: 100, durationTicks: 600 },
        { command: "ApplyHaste", target: "SELF", percent: 100, durationTicks: 600 }
      ],
      120
    );

    const result = simulate({ playerCards: [hasted], maxCombatTicks: 181 });
    const ticks = activationTicks(result, "player-card-1");

    expect(ticks).toEqual([1, 61, 121, 181]);
    expect(new Set(ticks).size).toBe(ticks.length);
  });

  it("Slow reduces cooldown recovery while active and then expires", () => {
    const slowed = activeCard("self-slow", [{ command: "ApplySlow", target: "SELF", percent: 50, durationTicks: 60 }], 120);

    const result = simulate({ playerCards: [slowed], maxCombatTicks: 151 });

    expect(activationTicks(result, "player-card-1")).toEqual([1, 151]);
  });

  it("Slow stacking clamps so recovery cannot drop below 25% of base", () => {
    const slowed = activeCard(
      "clamped-slow",
      [
        { command: "ApplySlow", target: "SELF", percent: 90, durationTicks: 60 },
        { command: "ApplySlow", target: "SELF", percent: 90, durationTicks: 60 }
      ],
      120
    );

    const result = simulate({ playerCards: [slowed], maxCombatTicks: 166 });

    expect(activationTicks(result, "player-card-1")).toEqual([1, 166]);
  });

  it("Freeze pauses cooldown recovery, preserves progress, and expires deterministically", () => {
    const victim = activeCard("victim", [], 120);
    const freezer = activeCard("freezer", [{ command: "ApplyFreeze", target: "OPPOSITE_ENEMY_CARD", durationTicks: 60 }], 999);

    const result = simulate({
      playerCards: [victim],
      enemyCards: [freezer],
      playerInitialCooldowns: [120],
      enemyInitialCooldowns: [1],
      maxCombatTicks: 180
    });

    expect(activationTicks(result, "player-card-1")).toEqual([180]);
    expect(result.replayTimeline.events.find((event) => event.type === "StatusExpired" && event.payload?.status === "Freeze")?.tick).toBe(61);
  });

  it("a ready card frozen earlier in the same tick cannot activate until Freeze ends", () => {
    const victim = activeCard("ready-victim", [], 120);
    const freezer = activeCard("priority-freezer", [{ command: "ApplyFreeze", target: "OPPOSITE_ENEMY_CARD", durationTicks: 60 }], 999);

    const result = simulate({
      playerCards: [victim],
      enemyCards: [freezer],
      playerInitialCooldowns: [1],
      enemyInitialCooldowns: [1],
      sidePriority: ["ENEMY", "PLAYER"],
      maxCombatTicks: 62
    });

    expect(activationTicks(result, "player-card-1")).toEqual([62]);
  });

  it("reapplying Freeze extends to the later expiration without duplicate expiry events", () => {
    const victim = activeCard("extend-victim", [], 120);
    const freezer = activeCard(
      "extend-freezer",
      [
        { command: "ApplyFreeze", target: "OPPOSITE_ENEMY_CARD", durationTicks: 30 },
        { command: "ApplyFreeze", target: "OPPOSITE_ENEMY_CARD", durationTicks: 60 }
      ],
      999
    );

    const result = simulate({
      playerCards: [victim],
      enemyCards: [freezer],
      playerInitialCooldowns: [120],
      enemyInitialCooldowns: [1],
      maxCombatTicks: 61
    });
    const freezeExpires = result.replayTimeline.events.filter((event) => event.type === "StatusExpired" && event.payload?.status === "Freeze");

    expect(freezeExpires.map((event) => event.tick)).toEqual([61]);
  });

  it("Haste and Slow combine deterministically with existing cooldown recovery modifiers", () => {
    const hasted = activeCard("modified-haste", [{ command: "ApplyHaste", target: "SELF", percent: 50, durationTicks: 60 }], 180);
    const modifier: Modifier = {
      id: "quick-hands-test",
      sourceId: "skill",
      ownerId: "player",
      hook: "BeforeCooldownRecover",
      priority: 1,
      condition: { always: true },
      operation: { type: "ADD_COOLDOWN_RECOVERY_RATE", value: 1 }
    };

    const result = simulate({ playerCards: [hasted], maxCombatTicks: 61, modifiers: [modifier] });

    expect(activationTicks(result, "player-card-1")).toEqual([1, 61]);
  });

  it("Haste, Slow, and Freeze do not change Burn or Poison tick intervals", () => {
    const controlDot = activeCard(
      "control-dot",
      [
        { command: "ApplyBurn", amount: 2, durationTicks: 180 },
        { command: "ApplyPoison", amount: 1 },
        { command: "ApplyHaste", target: "SELF", percent: 100, durationTicks: 180 },
        { command: "ApplySlow", target: "OPPOSITE_ENEMY_CARD", percent: 75, durationTicks: 180 },
        { command: "ApplyFreeze", target: "OPPOSITE_ENEMY_CARD", durationTicks: 60 }
      ],
      999
    );
    const enemyCard = activeCard("enemy-card", [], 999);

    const result = simulate({
      playerCards: [controlDot],
      enemyCards: [enemyCard],
      enemyArmor: 10,
      maxCombatTicks: 121
    });
    const burnTicks = result.replayTimeline.events.filter((event) => event.payload?.command === "BurnTick");
    const poisonTicks = result.replayTimeline.events.filter((event) => event.payload?.command === "PoisonTick");

    expect(burnTicks.map((event) => event.tick)).toEqual([61, 121]);
    expect(poisonTicks.map((event) => event.tick)).toEqual([61, 121]);
    expect(burnTicks[0]?.payload).toMatchObject({ ignoresArmor: true, armorBlocked: 0 });
    expect(poisonTicks[0]?.payload).toMatchObject({ ignoresArmor: true, armorBlocked: 0 });
  });

  it("control application replay and summary attribution are deterministic", () => {
    const controller = activeCard(
      "controller",
      [
        { command: "ApplyHaste", target: "SELF", percent: 25, durationTicks: 60 },
        { command: "ApplySlow", target: "OPPOSITE_ENEMY_CARD", percent: 25, durationTicks: 60 },
        { command: "ApplyFreeze", target: "OPPOSITE_ENEMY_CARD", durationTicks: 30 }
      ],
      999
    );
    const target = activeCard("target", [], 999);

    const first = simulate({ playerCards: [controller], enemyCards: [target], maxCombatTicks: 61 });
    const second = simulate({ playerCards: [controller], enemyCards: [target], maxCombatTicks: 61 });

    expect(first.summary.controlApplicationsByCard).toEqual({
      Freeze: { "player-card-1": 1 },
      Haste: { "player-card-1": 1 },
      Slow: { "player-card-1": 1 }
    });
    expect(second.replayTimeline).toEqual(first.replayTimeline);
    expect(second.summary).toEqual(first.summary);
  });

  it("invalid ApplyHaste target is ignored consistently by the command factory", () => {
    const invalid = activeCard("bad-haste", [{ command: "ApplyHaste", target: "OPPOSITE_ENEMY_CARD", percent: 25, durationTicks: 60 }], 999);
    const target = activeCard("target", [], 999);

    const result = simulate({ playerCards: [invalid], enemyCards: [target], maxCombatTicks: 1 });

    expect(result.replayTimeline.events.some((event) => event.type === "StatusApplied")).toBe(false);
  });

  it("Poison, Heal, and Slow remain bounded by maxCombatTicks", () => {
    const poisonSlow = activeCard(
      "poison-slow",
      [
        { command: "ApplyPoison", amount: 1 },
        { command: "ApplySlow", target: "OPPOSITE_ENEMY_CARD", percent: 75, durationTicks: 180 }
      ],
      60
    );
    const healer = activeCard("healer", [{ command: "HealHP", amount: 5 }], 60);

    const result = simulate({
      playerCards: [poisonSlow],
      enemyCards: [healer],
      playerInitialCooldowns: [1],
      enemyInitialCooldowns: [1],
      maxCombatTicks: 300
    });

    expect(result.ticksElapsed).toBeLessThanOrEqual(300);
    expect(result.replayTimeline.events.at(-1)?.type).toBe("CombatEnded");
  });

  it("Freeze chains cannot permanently prevent all enemy cards from acting", () => {
    const freezer = activeCard("short-freezer", [{ command: "ApplyFreeze", target: "OPPOSITE_ENEMY_CARD", durationTicks: 30 }], 60);
    const striker = activeCard("striker", [{ command: "DealDamage", amount: 1 }], 60);

    const result = simulate({
      playerCards: [freezer],
      enemyCards: [striker],
      playerInitialCooldowns: [1],
      enemyInitialCooldowns: [60],
      maxCombatTicks: 200
    });

    expect(activationTicks(result, "enemy-card-1").length).toBeGreaterThan(0);
  });
});
