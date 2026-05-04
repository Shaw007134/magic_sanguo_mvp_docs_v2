import { describe, expect, it } from "vitest";

import classBladeTempoJson from "../../data/cards/class_iron_warlord/blade_tempo.json" with { type: "json" };
import classCommandArmorJson from "../../data/cards/class_iron_warlord/command_armor.json" with { type: "json" };
import classSiegeFireJson from "../../data/cards/class_iron_warlord/siege_fire.json" with { type: "json" };
import generalBasicKitJson from "../../data/cards/general/basic_kit.json" with { type: "json" };
import generalBladeArmorJson from "../../data/cards/general/blade_armor.json" with { type: "json" };
import generalFireSupportJson from "../../data/cards/general/fire_support.json" with { type: "json" };
import monsterCardsJson from "../../data/cards/monster_cards.json" with { type: "json" };
import mvpSkillsJson from "../../data/skills/mvp_skills.json" with { type: "json" };
import { CombatEngine } from "../../src/combat/CombatEngine.js";
import {
  ACTIVE_CARD_DEFINITIONS,
  GENERAL_CARD_DEFINITIONS,
  getActiveCardDefinitionsById,
  IRON_WARLORD_CARD_DEFINITIONS,
  LEGACY_MVP_CARD_DEFINITIONS
} from "../../src/content/cards/activeCards.js";
import { MonsterGenerator } from "../../src/content/monsters/MonsterGenerator.js";
import { getMonsterTemplateById, MONSTER_TEMPLATES } from "../../src/content/monsters/monsterTemplates.js";
import type { CardDefinition, CardInstance } from "../../src/model/card.js";
import type { FormationSnapshot, FormationSlotSnapshot } from "../../src/model/formation.js";
import { RunManager } from "../../src/run/RunManager.js";
import { createEventChoices } from "../../src/run/nodes/EventNode.js";
import { createShopChoices } from "../../src/run/nodes/ShopNode.js";
import { createRewardChoices } from "../../src/run/rewards/RewardGenerator.js";
import { deserializeRunState, serializeRunState } from "../../src/run/save/SaveManager.js";
import { SKILL_DEFINITIONS } from "../../src/run/skills/skillDefinitions.js";
import { getCardDisplayInfo } from "../../src/ui/presentation/cardDisplay.js";
import { validateCardDefinition } from "../../src/validation/cardValidation.js";
import { validateFormationSnapshot } from "../../src/validation/formationValidation.js";

const generalJsonCards = [...generalBasicKitJson, ...generalBladeArmorJson, ...generalFireSupportJson] as readonly CardDefinition[];
const ironWarlordJsonCards = [
  ...classBladeTempoJson,
  ...classCommandArmorJson,
  ...classSiegeFireJson
] as readonly CardDefinition[];
const activeCardsById = getActiveCardDefinitionsById();

const NEW_MONSTER_IDS = [
  "bandit-duelist",
  "oil-raider",
  "shield-sergeant",
  "drum-adept",
  "siege-trainee",
  "banner-guard",
  "cinder-captain",
  "iron-patrol"
] as const;

const BOSS_IDS = ["gate-captain-elite", "siege-marshal", "cinder-strategist"] as const;

describe("active MVP content registry", () => {
  it("loads the requested card pack sizes and preserves legacy MVP cards", () => {
    expect(generalJsonCards).toHaveLength(18);
    expect(ironWarlordJsonCards).toHaveLength(18);
    expect(GENERAL_CARD_DEFINITIONS).toEqual(generalJsonCards);
    expect(IRON_WARLORD_CARD_DEFINITIONS).toEqual(ironWarlordJsonCards);
    expect(LEGACY_MVP_CARD_DEFINITIONS).toEqual(monsterCardsJson);

    for (const card of monsterCardsJson as readonly CardDefinition[]) {
      expect(activeCardsById.has(card.id), card.id).toBe(true);
    }
    for (const card of [...generalJsonCards, ...ironWarlordJsonCards]) {
      expect(activeCardsById.has(card.id), card.id).toBe(true);
    }
    expect(ACTIVE_CARD_DEFINITIONS).toHaveLength(monsterCardsJson.length + 36);
  });

  it("all active cards validate and use only MVP grammar", () => {
    for (const card of ACTIVE_CARD_DEFINITIONS) {
      expect(validateCardDefinition(card), card.id).toEqual({ valid: true, errors: [] });
      expect(card.description, card.id).not.toMatch(/On[A-Z]|hook|ticks?/);
      expect(card.description, card.id).not.toMatch(/Barrier|Ward|Energy Shield|absorb|Freeze|Haste|Vulnerable|Silence|Mana|Spirit|Fate|Heat|morale|rage|chance|random/i);
      expect(card.tags.some((tag) => /barrier|ward|energy|absorb|freeze|haste|vulnerable|silence|mana|spirit|fate|heat|morale|rage/i.test(tag)), card.id).toBe(false);
      for (const effect of card.effects ?? []) {
        validateEffect(effect, card.id);
      }
      for (const trigger of card.triggers ?? []) {
        validateTrigger(trigger, card.id);
      }
    }
  });

  it("all skill JSON loads, validates, and stays modifier-only", () => {
    expect(mvpSkillsJson).toHaveLength(8);
    expect(SKILL_DEFINITIONS).toEqual(mvpSkillsJson);
    for (const skill of SKILL_DEFINITIONS) {
      expect(skill.id.trim().length, skill.id).toBeGreaterThan(0);
      expect(skill.name.trim().length, skill.id).toBeGreaterThan(0);
      expect(skill.description, skill.id).not.toMatch(/Barrier|Ward|Energy Shield|absorb|Freeze|Haste|Vulnerable|Silence|Mana|Spirit|Fate|Heat|morale|rage|chance|random/i);
      expect(skill.modifierTemplates.length, skill.id).toBeGreaterThan(0);
      for (const template of skill.modifierTemplates) {
        expect(["BeforeDealDamage", "BeforeCooldownRecover", "OnStatusApplied"]).toContain(template.hook);
        expect(["ADD_DAMAGE", "MULTIPLY_DAMAGE", "ADD_COOLDOWN_RECOVERY_RATE", "MULTIPLY_COOLDOWN_RECOVERY_RATE", "ADD_STATUS_DURATION", "MULTIPLY_STATUS_DURATION"]).toContain(template.operation.type);
      }
    }
  });

  it("monster and boss templates reference known active cards and generate valid snapshots", () => {
    const generator = new MonsterGenerator();
    for (const template of MONSTER_TEMPLATES) {
      expect(template.engine.trim().length, template.id).toBeGreaterThan(0);
      expect(template.payoff.trim().length, template.id).toBeGreaterThan(0);
      expect(template.weakness.trim().length, template.id).toBeGreaterThan(0);
      for (const card of [...template.requiredCards, ...template.optionalCards]) {
        expect(activeCardsById.has(card.cardId), `${template.id}:${card.cardId}`).toBe(true);
      }
      for (const cardId of template.rewardPool) {
        expect(activeCardsById.has(cardId), `${template.id}:${cardId}`).toBe(true);
      }

      const generated = generator.generate({ template, seed: "content-validation", day: template.minDay });
      expect(validateFormationSnapshot(generated.formation, {
        cardDefinitionsById: activeCardsById,
        cardInstancesById: new Map(generated.cardInstances.map((card) => [card.instanceId, card]))
      }), template.id).toEqual({ valid: true, errors: [] });
    }
  });

  it("generates every new monster and every boss deterministically", () => {
    const generator = new MonsterGenerator();
    for (const templateId of [...NEW_MONSTER_IDS, ...BOSS_IDS]) {
      const template = getMonsterTemplateById(templateId);
      expect(template, templateId).toBeDefined();
      const first = generator.generateByTemplateId({ templateId, seed: "same", day: template?.minDay ?? 1 });
      const second = generator.generateByTemplateId({ templateId, seed: "same", day: template?.minDay ?? 1 });
      expect(second, templateId).toEqual(first);
    }
  });

  it("shop, event, rewards, and save/load use the active registry", () => {
    const shopChoices = createShopChoices({
      seed: "expanded-shop",
      nodeIndex: 4,
      cardDefinitionsById: activeCardsById
    });
    expect(shopChoices.every((choice) => activeCardsById.has(choice.cardDefinitionId))).toBe(true);

    const eventCanOfferExpandedCard = Array.from({ length: 20 }, (_, index) =>
      createEventChoices({
        seed: `expanded-event-${index}`,
        nodeIndex: 1,
        cardDefinitionsById: activeCardsById
      })
    ).some((choices) =>
      choices.some(
        (choice) =>
          choice.type === "EVENT_CARD" &&
          ["oil-flask", "iron-guard", "militia-spear"].includes(choice.cardDefinitionId ?? "")
      )
    );
    expect(eventCanOfferExpandedCard).toBe(true);

    const rewardChoices = createRewardChoices({
      seed: "expanded-reward",
      nodeIndex: 3,
      defeatedMonsterId: "oil-raider",
      usedCardDefinitionIds: ["oil-flask", "ember-banner"],
      cardDefinitionsById: activeCardsById
    });
    expect(rewardChoices.some((choice) => choice.type === "REWARD_CARD" && choice.cardDefinitionId === "oil-flask")).toBe(true);
    expect(rewardChoices.every((choice) => choice.type !== "REWARD_UPGRADE")).toBe(true);

    const manager = RunManager.createNewRun("expanded-save");
    expect(manager.addCardToChest("oil-flask").ok).toBe(true);
    const save = serializeRunState(manager.state);
    expect(save.ok).toBe(true);
    const loaded = deserializeRunState(save.ok ? save.value : "");
    expect(loaded.ok).toBe(true);
  });

  it("starter onboarding still offers active cards before first combat", () => {
    const manager = RunManager.createNewRun("starter-onboarding");
    expect(manager.state.currentNode.type).toBe("SHOP");
    expect(manager.state.currentChoices.some((choice) => choice.type === "SHOP_CARD" && choice.cost <= manager.state.gold)).toBe(true);
    expect(manager.state.currentChoices.some((choice) => choice.type === "SHOP_CARD" && activeCardsById.get(choice.cardDefinitionId)?.type === "ACTIVE")).toBe(true);

    const firstCard = manager.state.currentChoices.find((choice) => choice.type === "SHOP_CARD");
    expect(firstCard).toBeDefined();
    expect(manager.chooseShopOption(firstCard!.id).ok).toBe(true);
    expect(manager.leaveShop().ok).toBe(true);
    expect(manager.state.currentNode.type).toBe("EVENT");
    expect(manager.state.currentChoices.some((choice) => choice.type === "EVENT_CARD" && activeCardsById.get(choice.cardDefinitionId ?? "")?.type === "ACTIVE")).toBe(true);
  });

  it.each([
    ["Blade Tempo", ["rusty-blade", "field-drum", "vanguard-saber", "left-flank-blade"]],
    ["Burn Engine", ["oil-flask", "ember-banner", "fire-arrow-cart", "cinder-seal"]],
    ["Armor Counter", ["iron-guard", "counter-stance", "shield-wall"]],
    ["Drum Command", ["vanguard-saber", "war-drum", "battle-standard", "patrol-spear"]],
    ["Siege Fire", ["war-drum", "fire-cart-battery", "siege-brazier"]],
    ["Hybrid Bruiser", ["militia-spear", "burning-shield", "guard-captain", "frontline-banner"]]
  ])("%s deterministic combat smoke test", (_name, cardIds) => {
    const player = createFormation("player", "PLAYER", cardIds);
    const enemy = createFormation("enemy", "MONSTER", ["training-staff", "wooden-shield"]);
    const playerInstances = createInstances("player-card", cardIds);
    const enemyInstances = createInstances("enemy-card", ["training-staff", "wooden-shield"]);

    const result = new CombatEngine().simulate({
      playerFormation: player,
      enemyFormation: enemy,
      cardInstancesById: new Map([...playerInstances, ...enemyInstances].map((card) => [card.instanceId, card])),
      cardDefinitionsById: activeCardsById,
      maxCombatTicks: 420
    });

    expect(result.replayTimeline.events.length).toBeGreaterThan(0);
    expect(result.replayTimeline.events.map((event) => event.type)).toContain("CombatEnded");
    expect(result.winner).not.toBe("DRAW");
  });

  it("card summaries are readable seconds-only and hide internal hook names", () => {
    for (const card of ACTIVE_CARD_DEFINITIONS) {
      const summary = getCardDisplayInfo(card).summary;
      expect(summary, card.id).not.toMatch(/\d+t\b|tick|On[A-Z]|hook/i);
    }
  });
});

function validateEffect(effect: Readonly<Record<string, unknown>>, cardId: string): void {
  expect(["DealDamage", "GainArmor", "ApplyBurn", "ModifyCooldown"], `${cardId}:command`).toContain(effect["command"]);
  expect(JSON.stringify(effect), cardId).not.toMatch(/Barrier|Ward|EnergyShield|Energy Shield|absorb|Freeze|Haste|Vulnerable|Silence|Mana|Spirit|Fate|Heat|morale|rage|chance|random/i);
  if (effect["command"] === "ApplyBurn") {
    expect(effect["durationTicks"], `${cardId}:durationTicks`).toBeTypeOf("number");
  }
  if (effect["command"] === "ModifyCooldown") {
    expect(["SELF", "ADJACENT_ALLY", undefined], `${cardId}:target`).toContain(effect["target"]);
  }
}

function validateTrigger(trigger: Readonly<Record<string, unknown>>, cardId: string): void {
  expect(["OnCombatStart", "OnCardActivated", "OnDamageDealt", "OnDamageTaken", "OnStatusApplied", "OnBurnTick", "OnCooldownModified", "OnCombatEnd"], `${cardId}:hook`).toContain(trigger["hook"]);
  expect(trigger["internalCooldownTicks"], `${cardId}:internalCooldownTicks`).toBeTypeOf("number");
  expect(trigger["maxTriggersPerTick"], `${cardId}:maxTriggersPerTick`).toBeTypeOf("number");
  if (trigger["conditions"] !== undefined) {
    expect(Object.keys(trigger["conditions"] as Record<string, unknown>), `${cardId}:conditions`).toEqual(
      expect.arrayContaining([])
    );
    for (const key of Object.keys(trigger["conditions"] as Record<string, unknown>)) {
      expect(["status", "appliedByOwner", "sourceHasTag", "cardIsAdjacent", "ownerHpBelowPercent", "targetHpBelowPercent"], `${cardId}:condition:${key}`).toContain(key);
    }
  }
  for (const effect of (trigger["effects"] as readonly Readonly<Record<string, unknown>>[] | undefined) ?? []) {
    validateEffect(effect, cardId);
  }
}

function createInstances(prefix: string, definitionIds: readonly string[]): readonly CardInstance[] {
  return definitionIds.map((definitionId, index) => ({
    instanceId: `${prefix}-${index + 1}`,
    definitionId
  }));
}

function createFormation(id: string, kind: FormationSnapshot["kind"], cardIds: readonly string[]): FormationSnapshot {
  const slots: FormationSlotSnapshot[] = [];
  let slotIndex = 1;
  for (const [index, cardId] of cardIds.entries()) {
    const card = activeCardsById.get(cardId);
    if (!card) {
      throw new Error(`Missing card ${cardId}`);
    }
    slots.push({ slotIndex, cardInstanceId: `${id === "player" ? "player-card" : "enemy-card"}-${index + 1}` });
    if (card.size === 2) {
      slots.push({ slotIndex: slotIndex + 1, locked: true });
      slotIndex += 2;
    } else {
      slotIndex += 1;
    }
  }
  while (slots.length < 5) {
    slots.push({ slotIndex: slots.length + 1 });
  }
  return {
    id,
    kind,
    displayName: id,
    level: 1,
    maxHp: id === "player" ? 50 : 42,
    startingArmor: 0,
    slots,
    skills: [],
    relics: []
  };
}
