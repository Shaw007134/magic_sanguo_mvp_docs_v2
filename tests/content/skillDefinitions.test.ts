import { describe, expect, it } from "vitest";

import { CombatEngine } from "../../src/combat/CombatEngine.js";
import type { CardDefinition, CardInstance } from "../../src/model/card.js";
import type { FormationSnapshot } from "../../src/model/formation.js";
import { createSkillModifiers, SKILL_DEFINITIONS } from "../../src/run/skills/skillDefinitions.js";

function skillInstance(definitionId: string) {
  return { instanceId: `skill:${definitionId}`, definitionId };
}

function activeCard(input: {
  readonly id: string;
  readonly tags: readonly string[];
  readonly effects: CardDefinition["effects"];
  readonly cooldownTicks?: number;
}): CardDefinition {
  return {
    id: input.id,
    name: input.id,
    tier: "BRONZE",
    type: "ACTIVE",
    size: 1,
    tags: input.tags,
    cooldownTicks: input.cooldownTicks ?? 1,
    effects: input.effects,
    description: "Skill test card."
  };
}

function formation(id: "player" | "enemy", cardInstanceIds: readonly (string | undefined)[]): FormationSnapshot {
  return {
    id,
    kind: id === "player" ? "PLAYER" : "MONSTER",
    displayName: id,
    level: 1,
    maxHp: 40,
    startingArmor: 0,
    slots: [1, 2, 3, 4].map((slotIndex, index) => ({
      slotIndex,
      cardInstanceId: cardInstanceIds[index]
    })),
    skills: [],
    relics: []
  };
}

function simulate(input: {
  readonly skillId: string;
  readonly playerCard: CardDefinition;
  readonly enemyCard?: CardDefinition;
  readonly playerSlot?: number;
  readonly playerInitialCooldown?: number;
  readonly enemyInitialCooldown?: number;
  readonly maxCombatTicks?: number;
}) {
  const playerInstance: CardInstance = {
    instanceId: "player-card",
    definitionId: input.playerCard.id
  };
  const enemyCard = input.enemyCard ?? activeCard({
    id: "enemy-wait",
    tags: [],
    effects: [],
    cooldownTicks: 999
  });
  const enemyInstance: CardInstance = {
    instanceId: "enemy-card",
    definitionId: enemyCard.id
  };
  const playerSlots = Array.from({ length: 4 }, () => undefined as string | undefined);
  playerSlots[(input.playerSlot ?? 1) - 1] = playerInstance.instanceId;

  return new CombatEngine().simulate({
    playerFormation: formation("player", playerSlots),
    enemyFormation: formation("enemy", [enemyInstance.instanceId]),
    cardInstancesById: new Map([
      [playerInstance.instanceId, playerInstance],
      [enemyInstance.instanceId, enemyInstance]
    ]),
    cardDefinitionsById: new Map([
      [input.playerCard.id, input.playerCard],
      [enemyCard.id, enemyCard]
    ]),
    initialCardRuntimeStates: [
      {
        instanceId: playerInstance.instanceId,
        definitionId: input.playerCard.id,
        ownerCombatantId: "player",
        slotIndex: input.playerSlot ?? 1,
        cooldownMaxTicks: input.playerCard.cooldownTicks ?? 1,
        cooldownRemainingTicks: input.playerInitialCooldown ?? 1,
        cooldownRecoveryRate: 1,
        disabled: false,
        silenced: false,
        frozen: false,
        activationCount: 0
      },
      {
        instanceId: enemyInstance.instanceId,
        definitionId: enemyCard.id,
        ownerCombatantId: "enemy",
        slotIndex: 1,
        cooldownMaxTicks: enemyCard.cooldownTicks ?? 999,
        cooldownRemainingTicks: input.enemyInitialCooldown ?? 999,
        cooldownRecoveryRate: 1,
        disabled: false,
        silenced: false,
        frozen: false,
        activationCount: 0
      }
    ],
    modifiers: createSkillModifiers({
      ownedSkills: [skillInstance(input.skillId)],
      ownerId: "player"
    }),
    maxCombatTicks: input.maxCombatTicks ?? 1
  });
}

function firstDamageAmount(result: ReturnType<typeof simulate>, sourceId = "player-card"): number {
  const event = result.replayTimeline.events.find(
    (candidate) => candidate.type === "DamageDealt" && candidate.sourceId === sourceId
  );
  return typeof event?.payload?.["amount"] === "number" ? event.payload["amount"] : 0;
}

function playerActivationTicks(result: ReturnType<typeof simulate>): readonly number[] {
  return result.replayTimeline.events
    .filter((event) => event.type === "CardActivated" && event.sourceId === "player-card")
    .map((event) => event.tick);
}

describe("Phase 13A skill definitions", () => {
  it("loads exactly the 8 MVP skills", () => {
    expect(SKILL_DEFINITIONS.map((skill) => skill.id)).toEqual([
      "weapon-drill",
      "fire-study",
      "lasting-embers",
      "quick-hands",
      "shield-craft",
      "drumline-training",
      "siege-engineering",
      "disciplined-formation"
    ]);
  });

  it("Weapon Drill adds damage to weapon cards", () => {
    const result = simulate({
      skillId: "weapon-drill",
      playerCard: activeCard({
        id: "weapon-hit",
        tags: ["weapon"],
        effects: [{ command: "DealDamage", amount: 4 }]
      })
    });

    expect(firstDamageAmount(result)).toBe(5);
  });

  it("Fire Study boosts fire-tagged direct card damage", () => {
    const result = simulate({
      skillId: "fire-study",
      playerCard: activeCard({
        id: "fire-hit",
        tags: ["fire"],
        effects: [{ command: "DealDamage", amount: 4 }]
      })
    });

    expect(firstDamageAmount(result)).toBe(5);
  });

  it("Fire Study is a safe no-op for non-fire direct card damage", () => {
    const result = simulate({
      skillId: "fire-study",
      playerCard: activeCard({
        id: "plain-hit",
        tags: ["weapon"],
        effects: [{ command: "DealDamage", amount: 4 }]
      })
    });

    expect(firstDamageAmount(result)).toBe(4);
  });

  it("Lasting Embers extends Burn application duration", () => {
    const result = simulate({
      skillId: "lasting-embers",
      playerCard: activeCard({
        id: "burn-card",
        tags: ["fire"],
        effects: [{ command: "ApplyBurn", amount: 1, durationTicks: 60 }]
      })
    });
    const statusEvent = result.replayTimeline.events.find((event) => event.type === "StatusApplied");

    expect(statusEvent?.payload?.["durationTicks"]).toBe(120);
  });

  it("Quick Hands speeds all player cooldown recovery", () => {
    const result = simulate({
      skillId: "quick-hands",
      playerCard: activeCard({
        id: "slow-card",
        tags: ["weapon"],
        cooldownTicks: 5,
        effects: [{ command: "DealDamage", amount: 1 }]
      }),
      playerInitialCooldown: 5,
      maxCombatTicks: 4
    });

    expect(playerActivationTicks(result)).toEqual([3]);
  });

  it("Shield Craft speeds armor-card cooldown recovery", () => {
    const result = simulate({
      skillId: "shield-craft",
      playerCard: activeCard({
        id: "armor-card",
        tags: ["armor"],
        cooldownTicks: 3,
        effects: [{ command: "GainArmor", amount: 2 }]
      }),
      playerInitialCooldown: 3,
      maxCombatTicks: 2
    });

    expect(playerActivationTicks(result)).toEqual([2]);
  });

  it("Drumline Training speeds drum-card cooldown recovery", () => {
    const result = simulate({
      skillId: "drumline-training",
      playerCard: activeCard({
        id: "drum-card",
        tags: ["drum"],
        cooldownTicks: 5,
        effects: [{ command: "ModifyCooldown", target: "SELF", amountTicks: -1 }]
      }),
      playerInitialCooldown: 5,
      maxCombatTicks: 4
    });

    expect(playerActivationTicks(result)).toEqual([3]);
  });

  it("Siege Engineering adds damage to siege cards that deal direct damage", () => {
    const result = simulate({
      skillId: "siege-engineering",
      playerCard: activeCard({
        id: "siege-hit",
        tags: ["siege"],
        effects: [{ command: "DealDamage", amount: 4 }]
      })
    });

    expect(firstDamageAmount(result)).toBe(6);
  });

  it("Siege Engineering is a safe no-op for siege cards that only apply Burn", () => {
    const result = simulate({
      skillId: "siege-engineering",
      playerCard: activeCard({
        id: "siege-burn",
        tags: ["siege"],
        effects: [{ command: "ApplyBurn", amount: 1, durationTicks: 60 }]
      })
    });

    expect(firstDamageAmount(result)).toBe(0);
    expect(result.replayTimeline.events.some((event) => event.type === "StatusApplied")).toBe(true);
  });

  it("Disciplined Formation adds damage to cards in slot 1", () => {
    const result = simulate({
      skillId: "disciplined-formation",
      playerCard: activeCard({
        id: "slot-hit",
        tags: ["weapon"],
        effects: [{ command: "DealDamage", amount: 4 }]
      }),
      playerSlot: 1
    });

    expect(firstDamageAmount(result)).toBe(5);
  });

  it("Disciplined Formation is a safe no-op outside slot 1", () => {
    const result = simulate({
      skillId: "disciplined-formation",
      playerCard: activeCard({
        id: "slot-two-hit",
        tags: ["weapon"],
        effects: [{ command: "DealDamage", amount: 4 }]
      }),
      playerSlot: 2
    });

    expect(firstDamageAmount(result)).toBe(4);
  });
});
