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
    description: "Summary test card."
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

describe("CombatResultSummary", () => {
  it("aggregates card damage, armor gained, armor blocked, and Burn damage", () => {
    const blade = activeCard(
      "blade",
      [
        { command: "DealDamage", amount: 5 },
        { command: "GainArmor", amount: 3 }
      ],
      999
    );
    const flame = activeCard("flame", [{ command: "ApplyBurn", amount: 2, durationTicks: 60 }], 999);
    const instances: CardInstance[] = [
      { instanceId: "blade-card", definitionId: "blade" },
      { instanceId: "flame-card", definitionId: "flame" }
    ];

    const result = new CombatEngine().simulate({
      playerFormation: formation("player", 50, ["blade-card", "flame-card"]),
      enemyFormation: formation("enemy", 50, [], 2),
      cardInstancesById: new Map(instances.map((instance) => [instance.instanceId, instance])),
      cardDefinitionsById: new Map([
        [blade.id, blade],
        [flame.id, flame]
      ]),
      initialCardRuntimeStates: [
        runtimeState("blade-card", "blade", "player", 999),
        runtimeState("flame-card", "flame", "player", 999)
      ],
      maxCombatTicks: 61
    });

    expect(result.summary.damageByCard).toEqual({ "blade-card": 3 });
    expect(result.summary.statusDamage).toEqual({ Burn: 2 });
    expect(result.summary.armorGainedByCard).toEqual({ "blade-card": 3 });
    expect(result.summary.armorBlocked).toBe(2);
    expect(result.summary.activationsByCard).toEqual({ "blade-card": 1, "flame-card": 1 });
    expect(result.summary.topContributors[0]).toMatchObject({
      sourceId: "blade-card",
      score: 6
    });
  });

  it("is deterministic for the same combat", () => {
    const strike = activeCard("strike", [{ command: "DealDamage", amount: 4 }], 1);
    const instance: CardInstance = { instanceId: "strike-card", definitionId: "strike" };
    const input = {
      playerFormation: formation("player", 30, ["strike-card"]),
      enemyFormation: formation("enemy", 30, []),
      cardInstancesById: new Map([[instance.instanceId, instance]]),
      cardDefinitionsById: new Map([[strike.id, strike]]),
      initialCardRuntimeStates: [runtimeState("strike-card", "strike", "player", 1)],
      maxCombatTicks: 3
    };

    const first = new CombatEngine().simulate(input).summary;
    const second = new CombatEngine().simulate(input).summary;

    expect(second).toEqual(first);
  });
});
