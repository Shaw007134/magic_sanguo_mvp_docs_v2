import { describe, expect, it } from "vitest";

import { CombatEngine } from "../../src/combat/CombatEngine.js";
import { getMonsterCardDefinitionsById } from "../../src/content/cards/monsterCards.js";
import { MonsterGenerator } from "../../src/content/monsters/MonsterGenerator.js";
import { getMonsterTemplateById, MONSTER_TEMPLATES } from "../../src/content/monsters/monsterTemplates.js";
import type { CardDefinition, CardInstance } from "../../src/model/card.js";
import type { FormationSnapshot } from "../../src/model/formation.js";
import { validateCardDefinition } from "../../src/validation/cardValidation.js";
import { validateFormationSnapshot } from "../../src/validation/formationValidation.js";

const generator = new MonsterGenerator();
const monsterCardsById = getMonsterCardDefinitionsById();

function requireTemplate(id: string) {
  const template = getMonsterTemplateById(id);
  if (!template) {
    throw new Error(`Missing template ${id}`);
  }
  return template;
}

function generate(templateId: string, seed = "seed-a", day = 3) {
  return generator.generate({
    template: requireTemplate(templateId),
    seed,
    day,
    cardDefinitionsById: monsterCardsById
  });
}

function playerStrikeCard(): CardDefinition {
  return {
    id: "player-strike",
    name: "Player Strike",
    tier: "BRONZE",
    type: "ACTIVE",
    size: 1,
    tags: ["weapon"],
    cooldownTicks: 30,
    effects: [{ command: "DealDamage", amount: 3 }],
    description: "Simple player test card."
  };
}

function playerFormation(): FormationSnapshot {
  return {
    id: "player",
    kind: "PLAYER",
    displayName: "Player",
    level: 1,
    maxHp: 40,
    startingArmor: 0,
    slots: [
      { slotIndex: 1, cardInstanceId: "player-card" },
      { slotIndex: 2 },
      { slotIndex: 3 },
      { slotIndex: 4 }
    ],
    skills: [],
    relics: []
  };
}

describe("MonsterGenerator", () => {
  it("same seed creates the same monster formation", () => {
    const first = generate("rust-bandit", "same-seed", 3);
    const second = generate("rust-bandit", "same-seed", 3);

    expect(second).toEqual(first);
  });

  it("different seeds can choose deterministic but different optional card layouts", () => {
    const template = requireTemplate("rust-bandit");
    const baseline = generator.generate({ template, seed: "seed-0", day: 3, cardDefinitionsById: monsterCardsById });
    let different = false;

    for (let index = 1; index <= 20; index += 1) {
      const candidate = generator.generate({
        template,
        seed: `seed-${index}`,
        day: 3,
        cardDefinitionsById: monsterCardsById
      });
      if (JSON.stringify(candidate.formation.slots) !== JSON.stringify(baseline.formation.slots)) {
        different = true;
        break;
      }
    }

    expect(different).toBe(true);
  });

  it("generated monsters use valid known cards", () => {
    for (const template of MONSTER_TEMPLATES) {
      const result = generator.generate({ template, seed: "known-cards", day: template.minDay });

      for (const instance of result.cardInstances) {
        const card = monsterCardsById.get(instance.definitionId);
        expect(card, instance.definitionId).toBeDefined();
        expect(validateCardDefinition(card as CardDefinition).valid).toBe(true);
      }
    }
  });

  it("required cards are always included", () => {
    const template = requireTemplate("fire-echo-adept");
    const result = generator.generate({ template, seed: "required", day: 6 });
    const definitionIds = result.cardInstances.map((instance) => instance.definitionId);

    for (const requiredCard of template.requiredCards) {
      expect(definitionIds).toContain(requiredCard.cardId);
    }
  });

  it("slot count is respected", () => {
    const template = requireTemplate("burn-apprentice");
    const result = generate(template.id, "slot-count", 3);

    expect(result.formation.slots).toHaveLength(template.slotCount);
  });

  it("size 2 cards fit correctly", () => {
    const result = generate("drum-tactician", "size-two", 5);
    const sparkDrum = result.cardInstances.find((instance) => instance.definitionId === "spark-drum");
    const sparkDrumSlot = result.formation.slots.find((slot) => slot.cardInstanceId === sparkDrum?.instanceId);

    expect(sparkDrumSlot?.slotIndex).toBe(2);
    expect(result.formation.slots.find((slot) => slot.slotIndex === 3)?.locked).toBe(true);
    expect(validateFormationSnapshot(result.formation, {
      cardDefinitionsById: monsterCardsById,
      cardInstancesById: new Map(result.cardInstances.map((instance) => [instance.instanceId, instance]))
    }).valid).toBe(true);
  });

  it("Monster FormationSnapshot passes validation", () => {
    const result = generate("shield-guard", "valid", 4);

    expect(validateFormationSnapshot(result.formation, {
      cardDefinitionsById: monsterCardsById,
      cardInstancesById: new Map(result.cardInstances.map((instance) => [instance.instanceId, instance]))
    })).toEqual({ valid: true, errors: [] });
  });

  it("boss generation is fixed and deterministic", () => {
    const first = generate("gate-captain", "boss-seed-a", 9);
    const second = generate("gate-captain", "boss-seed-b", 9);

    expect(second).toEqual(first);
  });

  it("generated monster can be used directly in CombatEngine", () => {
    const monster = generate("rust-bandit", "combat", 3);
    const playerCard = playerStrikeCard();
    const playerInstance: CardInstance = {
      instanceId: "player-card",
      definitionId: playerCard.id
    };

    const result = new CombatEngine().simulate({
      playerFormation: playerFormation(),
      enemyFormation: monster.formation,
      cardInstancesById: new Map([
        [playerInstance.instanceId, playerInstance],
        ...monster.cardInstances.map((instance) => [instance.instanceId, instance] as const)
      ]),
      cardDefinitionsById: new Map([[playerCard.id, playerCard], ...monsterCardsById]),
      maxCombatTicks: 120
    });

    expect(result.replayTimeline.events.length).toBeGreaterThan(0);
    expect(result.combatLog.length).toBeGreaterThan(0);
  });

  it("generated monster battle produces clean ReplayTimeline and CombatResultSummary", () => {
    const monster = generate("burn-apprentice", "replay-summary", 3);
    const playerCard = playerStrikeCard();
    const playerInstance: CardInstance = {
      instanceId: "player-card",
      definitionId: playerCard.id
    };

    const result = new CombatEngine().simulate({
      playerFormation: playerFormation(),
      enemyFormation: monster.formation,
      cardInstancesById: new Map([
        [playerInstance.instanceId, playerInstance],
        ...monster.cardInstances.map((instance) => [instance.instanceId, instance] as const)
      ]),
      cardDefinitionsById: new Map([[playerCard.id, playerCard], ...monsterCardsById]),
      maxCombatTicks: 130
    });
    const replayTypes = result.replayTimeline.events.map((event) => event.type);
    const meaningfulSummaryPopulated =
      Object.keys(result.summary.damageByCard).length > 0 ||
      Object.keys(result.summary.armorGainedByCard).length > 0 ||
      Object.keys(result.summary.statusDamage).length > 0 ||
      Object.keys(result.summary.activationsByCard).length > 0 ||
      Object.keys(result.summary.triggerCountByCard).length > 0;

    expect(replayTypes).toContain("CombatStarted");
    expect(replayTypes).toContain("CombatEnded");
    expect(replayTypes.some((type) => type === "CardActivated" || type === "DamageDealt")).toBe(true);
    expect(replayTypes).not.toContain("StackLimitReached");
    expect(result.summary.winner).toBe(result.winner);
    expect(result.summary.ticksElapsed).toBe(result.ticksElapsed);
    expect(result.summary.playerFinalHp).toBe(result.playerFinalHp);
    expect(result.summary.enemyFinalHp).toBe(result.enemyFinalHp);
    expect(meaningfulSummaryPopulated).toBe(true);
  });
});
