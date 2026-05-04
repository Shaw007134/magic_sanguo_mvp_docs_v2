import { describe, expect, it } from "vitest";

import monsterCardsJson from "../../data/cards/monster_cards.json" with { type: "json" };
import banditDuelistJson from "../../data/monsters/bandit_duelist.json" with { type: "json" };
import bannerGuardJson from "../../data/monsters/banner_guard.json" with { type: "json" };
import burnApprenticeJson from "../../data/monsters/burn_apprentice.json" with { type: "json" };
import cinderCaptainJson from "../../data/monsters/cinder_captain.json" with { type: "json" };
import cinderStrategistJson from "../../data/monsters/cinder_strategist.json" with { type: "json" };
import drumAdeptJson from "../../data/monsters/drum_adept.json" with { type: "json" };
import drumTacticianJson from "../../data/monsters/drum_tactician.json" with { type: "json" };
import fireEchoAdeptJson from "../../data/monsters/fire_echo_adept.json" with { type: "json" };
import gateCaptainJson from "../../data/monsters/gate_captain.json" with { type: "json" };
import gateCaptainEliteJson from "../../data/monsters/gate_captain_elite.json" with { type: "json" };
import ironPatrolJson from "../../data/monsters/iron_patrol.json" with { type: "json" };
import oilRaiderJson from "../../data/monsters/oil_raider.json" with { type: "json" };
import rustBanditJson from "../../data/monsters/rust_bandit.json" with { type: "json" };
import shieldSergeantJson from "../../data/monsters/shield_sergeant.json" with { type: "json" };
import shieldGuardJson from "../../data/monsters/shield_guard.json" with { type: "json" };
import siegeMarshalJson from "../../data/monsters/siege_marshal.json" with { type: "json" };
import siegeTraineeJson from "../../data/monsters/siege_trainee.json" with { type: "json" };
import trainingDummyJson from "../../data/monsters/training_dummy.json" with { type: "json" };
import { CombatEngine } from "../../src/combat/CombatEngine.js";
import { getActiveCardDefinitionsById } from "../../src/content/cards/activeCards.js";
import { MONSTER_CARD_DEFINITIONS } from "../../src/content/cards/monsterCards.js";
import { MonsterGenerator } from "../../src/content/monsters/MonsterGenerator.js";
import { getMonsterTemplateById, MONSTER_TEMPLATES } from "../../src/content/monsters/monsterTemplates.js";
import type { CardDefinition, CardInstance } from "../../src/model/card.js";
import type { FormationSnapshot } from "../../src/model/formation.js";
import { validateCardDefinition } from "../../src/validation/cardValidation.js";
import { validateFormationSnapshot } from "../../src/validation/formationValidation.js";

const generator = new MonsterGenerator();
const activeCardsById = getActiveCardDefinitionsById();
const monsterTemplatesJson = [
  trainingDummyJson,
  rustBanditJson,
  burnApprenticeJson,
  shieldGuardJson,
  drumTacticianJson,
  fireEchoAdeptJson,
  banditDuelistJson,
  oilRaiderJson,
  shieldSergeantJson,
  drumAdeptJson,
  siegeTraineeJson,
  bannerGuardJson,
  cinderCaptainJson,
  ironPatrolJson,
  gateCaptainJson,
  gateCaptainEliteJson,
  siegeMarshalJson,
  cinderStrategistJson
];

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
    cardDefinitionsById: activeCardsById
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
  it("exports monster cards directly from JSON content", () => {
    expect(MONSTER_CARD_DEFINITIONS).toEqual(monsterCardsJson);
  });

  it("all JSON monster cards validate", () => {
    for (const card of monsterCardsJson) {
      expect(validateCardDefinition(card as CardDefinition), card.id).toEqual({ valid: true, errors: [] });
    }
  });

  it("exports all JSON monster templates", () => {
    expect(MONSTER_TEMPLATES).toEqual(monsterTemplatesJson);
  });

  it("every template card reference exists in monster card definitions", () => {
    for (const template of MONSTER_TEMPLATES) {
      const templateCards = [...template.requiredCards, ...template.optionalCards];
      for (const templateCard of templateCards) {
        expect(activeCardsById.has(templateCard.cardId), `${template.id}:${templateCard.cardId}`).toBe(true);
      }
    }
  });

  it("every reward pool card id exists in monster card definitions", () => {
    for (const template of MONSTER_TEMPLATES) {
      for (const cardId of template.rewardPool) {
        expect(activeCardsById.has(cardId), `${template.id}:${cardId}`).toBe(true);
      }
    }
  });

  it("every template has readable engine, payoff, weakness, and rewards", () => {
    for (const template of MONSTER_TEMPLATES) {
      expect(template.engine.trim().length, `${template.id}:engine`).toBeGreaterThan(0);
      expect(template.payoff.trim().length, `${template.id}:payoff`).toBeGreaterThan(0);
      expect(template.weakness.trim().length, `${template.id}:weakness`).toBeGreaterThan(0);
      expect(template.rewardPool.length, `${template.id}:rewardPool`).toBeGreaterThan(0);
    }
  });

  it("fixed templates remain deterministic across different seeds", () => {
    for (const template of MONSTER_TEMPLATES.filter((candidate) => candidate.fixed)) {
      const first = generator.generate({ template, seed: "fixed-seed-a", day: template.minDay });
      const second = generator.generate({ template, seed: "fixed-seed-b", day: template.minDay });

      expect(second, template.id).toEqual(first);
    }
  });

  it("same seed creates the same monster formation", () => {
    const first = generate("bandit-duelist", "same-seed", 3);
    const second = generate("bandit-duelist", "same-seed", 3);

    expect(second).toEqual(first);
  });

  it("different seeds can choose deterministic but different optional card layouts", () => {
    const template = requireTemplate("bandit-duelist");
    const baseline = generator.generate({ template, seed: "seed-0", day: 3, cardDefinitionsById: activeCardsById });
    let different = false;

    for (let index = 1; index <= 20; index += 1) {
      const candidate = generator.generate({
        template,
        seed: `seed-${index}`,
        day: 3,
        cardDefinitionsById: activeCardsById
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
        const card = activeCardsById.get(instance.definitionId);
        expect(card, instance.definitionId).toBeDefined();
        expect(validateCardDefinition(card as CardDefinition).valid).toBe(true);
      }
    }
  });

  it("required cards are always included", () => {
    const template = requireTemplate("cinder-captain");
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
      cardDefinitionsById: activeCardsById,
      cardInstancesById: new Map(result.cardInstances.map((instance) => [instance.instanceId, instance]))
    }).valid).toBe(true);
  });

  it("Monster FormationSnapshot passes validation", () => {
    const result = generate("shield-guard", "valid", 4);

    expect(validateFormationSnapshot(result.formation, {
      cardDefinitionsById: activeCardsById,
      cardInstancesById: new Map(result.cardInstances.map((instance) => [instance.instanceId, instance]))
    })).toEqual({ valid: true, errors: [] });
  });

  it("boss generation is fixed and deterministic", () => {
    const first = generate("gate-captain-elite", "boss-seed-a", 10);
    const second = generate("gate-captain-elite", "boss-seed-b", 10);

    expect(second).toEqual(first);
  });

  it("generated monster can be used directly in CombatEngine", () => {
    const monster = generate("bandit-duelist", "combat", 3);
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
      cardDefinitionsById: new Map([[playerCard.id, playerCard], ...activeCardsById]),
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
      cardDefinitionsById: new Map([[playerCard.id, playerCard], ...activeCardsById]),
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
