import { describe, expect, it } from "vitest";

import { CombatEngine, type CombatEngineInput } from "../../src/combat/CombatEngine.js";
import type { CardDefinition, CardInstance, CardRuntimeState } from "../../src/model/card.js";
import type { FormationSnapshot } from "../../src/model/formation.js";

function createDamageCard(id: string, cooldownTicks: number, amount: number): CardDefinition {
  return {
    id,
    name: id,
    tier: "BRONZE",
    type: "ACTIVE",
    size: 1,
    tags: [],
    cooldownTicks,
    effects: [{ command: "DealDamage", amount }],
    description: "Deals direct damage."
  };
}

function createFormation(
  id: string,
  displayName: string,
  maxHp: number,
  cardInstanceIds: readonly (string | undefined)[]
): FormationSnapshot {
  return {
    id,
    kind: id === "player" ? "PLAYER" : "MONSTER",
    displayName,
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

function createInput(overrides: Partial<CombatEngineInput> = {}): CombatEngineInput {
  const playerCard = createDamageCard("player-strike", 3, 2);
  const enemyCard = createDamageCard("enemy-strike", 4, 1);
  const playerInstance: CardInstance = {
    instanceId: "player-card",
    definitionId: playerCard.id
  };
  const enemyInstance: CardInstance = {
    instanceId: "enemy-card",
    definitionId: enemyCard.id
  };

  return {
    playerFormation: createFormation("player", "Player", 20, ["player-card"]),
    enemyFormation: createFormation("enemy", "Enemy", 20, ["enemy-card"]),
    cardInstancesById: new Map([
      [playerInstance.instanceId, playerInstance],
      [enemyInstance.instanceId, enemyInstance]
    ]),
    cardDefinitionsById: new Map([
      [playerCard.id, playerCard],
      [enemyCard.id, enemyCard]
    ]),
    maxCombatTicks: 10,
    ...overrides
  };
}

describe("CombatEngine", () => {
  it("produces the same output for the same input", () => {
    const input = createInput();
    const firstResult = new CombatEngine().simulate(input);
    const secondResult = new CombatEngine().simulate(input);

    expect(secondResult).toEqual(firstResult);
  });

  it("activates a card after its cooldown", () => {
    const input = createInput({
      enemyFormation: createFormation("enemy", "Enemy", 20, []),
      maxCombatTicks: 3
    });

    const result = new CombatEngine().simulate(input);

    expect(result.replayTimeline.events).toContainEqual({
      tick: 3,
      type: "CARD_ACTIVATED",
      sourceId: "player-card",
      payload: {
        side: "PLAYER",
        slotIndex: 1,
        definitionId: "player-strike"
      }
    });
    expect(result.enemyFinalHp).toBe(18);
  });

  it("activates same-tick cards by side priority, slot index, then stable instance id", () => {
    const leftCard = createDamageCard("left-strike", 1, 1);
    const rightCard = createDamageCard("right-strike", 1, 1);
    const enemyCard = createDamageCard("enemy-strike", 1, 1);
    const cardInstances: CardInstance[] = [
      { instanceId: "player-b", definitionId: "right-strike" },
      { instanceId: "player-a", definitionId: "left-strike" },
      { instanceId: "enemy-a", definitionId: "enemy-strike" }
    ];

    const result = new CombatEngine().simulate({
      playerFormation: createFormation("player", "Player", 20, ["player-b", "player-a"]),
      enemyFormation: createFormation("enemy", "Enemy", 20, ["enemy-a"]),
      cardInstancesById: new Map(cardInstances.map((card) => [card.instanceId, card])),
      cardDefinitionsById: new Map([
        [leftCard.id, leftCard],
        [rightCard.id, rightCard],
        [enemyCard.id, enemyCard]
      ]),
      maxCombatTicks: 1
    });

    const activations = result.replayTimeline.events
      .filter((event) => event.type === "CARD_ACTIVATED")
      .map((event) => event.sourceId);

    expect(activations).toEqual(["player-b", "player-a", "enemy-a"]);
  });

  it("uses stable card instance id when same-side cards have the same slot index", () => {
    const sharedSlotCard = createDamageCard("shared-slot-strike", 1, 1);
    const cardInstances: CardInstance[] = [
      { instanceId: "player-card-b", definitionId: "shared-slot-strike" },
      { instanceId: "player-card-a", definitionId: "shared-slot-strike" }
    ];

    const result = new CombatEngine().simulate({
      playerFormation: {
        ...createFormation("player", "Player", 20, []),
        slots: [
          { slotIndex: 1, cardInstanceId: "player-card-b" },
          { slotIndex: 1, cardInstanceId: "player-card-a" }
        ]
      },
      enemyFormation: createFormation("enemy", "Enemy", 20, []),
      cardInstancesById: new Map(cardInstances.map((card) => [card.instanceId, card])),
      cardDefinitionsById: new Map([[sharedSlotCard.id, sharedSlotCard]]),
      maxCombatTicks: 1
    });

    const activations = result.replayTimeline.events
      .filter((event) => event.type === "CARD_ACTIVATED")
      .map((event) => event.sourceId);

    expect(activations).toEqual(["player-card-a", "player-card-b"]);
  });

  it("resolves card effects in listed order through the ResolutionStack", () => {
    const orderedCard: CardDefinition = {
      ...createDamageCard("ordered-effects", 1, 0),
      effects: [
        { command: "GainArmor", amount: 3 },
        { command: "DealDamage", amount: 2 }
      ]
    };
    const orderedInstance: CardInstance = {
      instanceId: "ordered-card",
      definitionId: orderedCard.id
    };

    const result = new CombatEngine().simulate({
      playerFormation: createFormation("player", "Player", 20, ["ordered-card"]),
      enemyFormation: createFormation("enemy", "Enemy", 20, []),
      cardInstancesById: new Map([[orderedInstance.instanceId, orderedInstance]]),
      cardDefinitionsById: new Map([[orderedCard.id, orderedCard]]),
      maxCombatTicks: 1
    });

    const commandEvents = result.replayTimeline.events
      .filter((event) => event.type === "ARMOR_GAINED" || event.type === "DAMAGE_DEALT")
      .map((event) => event.type);

    expect(commandEvents).toEqual(["ARMOR_GAINED", "DAMAGE_DEALT"]);
  });

  it("ends combat when HP reaches 0", () => {
    const finishingCard = createDamageCard("finisher", 1, 20);
    const finishingInstance: CardInstance = {
      instanceId: "finisher-card",
      definitionId: finishingCard.id
    };

    const result = new CombatEngine().simulate({
      playerFormation: createFormation("player", "Player", 20, ["finisher-card"]),
      enemyFormation: createFormation("enemy", "Enemy", 10, []),
      cardInstancesById: new Map([[finishingInstance.instanceId, finishingInstance]]),
      cardDefinitionsById: new Map([[finishingCard.id, finishingCard]]),
      maxCombatTicks: 60
    });

    expect(result.winner).toBe("PLAYER");
    expect(result.ticksElapsed).toBe(1);
    expect(result.enemyFinalHp).toBe(0);
  });

  it("chooses the timeout winner by higher HP percentage", () => {
    const chipCard = createDamageCard("chip", 1, 10);
    const chipInstance: CardInstance = {
      instanceId: "chip-card",
      definitionId: chipCard.id
    };

    const result = new CombatEngine().simulate({
      playerFormation: createFormation("player", "Player", 100, ["chip-card"]),
      enemyFormation: createFormation("enemy", "Enemy", 200, []),
      cardInstancesById: new Map([[chipInstance.instanceId, chipInstance]]),
      cardDefinitionsById: new Map([[chipCard.id, chipCard]]),
      maxCombatTicks: 1
    });

    expect(result.winner).toBe("PLAYER");
    expect(result.playerFinalHp / 100).toBeGreaterThan(result.enemyFinalHp / 200);
  });

  it("draws on timeout when HP percentage and absolute HP are equal", () => {
    const result = new CombatEngine().simulate({
      playerFormation: createFormation("player", "Player", 20, []),
      enemyFormation: createFormation("enemy", "Enemy", 20, []),
      cardInstancesById: new Map(),
      cardDefinitionsById: new Map(),
      maxCombatTicks: 5
    });

    expect(result.winner).toBe("DRAW");
    expect(result.ticksElapsed).toBe(5);
  });

  it("uses explicit initial cooldown state without mutating input snapshots or definitions", () => {
    const playerFormation = createFormation("player", "Player", 20, ["player-card"]);
    const enemyFormation = createFormation("enemy", "Enemy", 20, []);
    const playerCard = createDamageCard("player-strike", 60, 2);
    const playerInstance: CardInstance = {
      instanceId: "player-card",
      definitionId: playerCard.id
    };
    const initialRuntimeState: CardRuntimeState = {
      instanceId: "player-card",
      definitionId: "player-strike",
      ownerCombatantId: "player",
      slotIndex: 1,
      cooldownMaxTicks: 60,
      cooldownRemainingTicks: 1,
      cooldownRecoveryRate: 1,
      disabled: false,
      silenced: false,
      frozen: false,
      activationCount: 0
    };
    const formationBefore = structuredClone(playerFormation);
    const cardBefore = structuredClone(playerCard);

    const result = new CombatEngine().simulate({
      playerFormation,
      enemyFormation,
      cardInstancesById: new Map([[playerInstance.instanceId, playerInstance]]),
      cardDefinitionsById: new Map([[playerCard.id, playerCard]]),
      initialCardRuntimeStates: [initialRuntimeState],
      maxCombatTicks: 1
    });

    expect(result.enemyFinalHp).toBe(18);
    expect(playerFormation).toEqual(formationBefore);
    expect(playerCard).toEqual(cardBefore);
    expect(initialRuntimeState.cooldownRemainingTicks).toBe(1);
  });
});
