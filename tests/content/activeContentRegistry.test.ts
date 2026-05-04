import { describe, expect, it } from "vitest";

import classBladeTempoJson from "../../data/cards/class_iron_warlord/blade_tempo.json" with { type: "json" };
import classCommandArmorJson from "../../data/cards/class_iron_warlord/command_armor.json" with { type: "json" };
import classSiegeFireJson from "../../data/cards/class_iron_warlord/siege_fire.json" with { type: "json" };
import generalBasicKitJson from "../../data/cards/general/basic_kit.json" with { type: "json" };
import generalBladeArmorJson from "../../data/cards/general/blade_armor.json" with { type: "json" };
import generalControlJson from "../../data/cards/general/control.json" with { type: "json" };
import generalFireSupportJson from "../../data/cards/general/fire_support.json" with { type: "json" };
import generalPoisonHealJson from "../../data/cards/general/poison_heal.json" with { type: "json" };
import generalReactionsJson from "../../data/cards/general/reactions.json" with { type: "json" };
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
import {
  ARCHETYPE_POOLS,
  BUILD_VITAL_SUPPORT_POOL,
  CARD_POOL_METADATA,
  EARLY_REWARD_POOL,
  EARLY_SHOP_POOL,
  getCardPoolMetadata,
  getCardQualityScore,
  getRewardPoolForLevel,
  getShopPoolForLevel,
  IRON_WARLORD_TERMINALS,
  isHighQualityShopCard,
  isTerminalOrHighQualityBuildCard,
  LATE_REWARD_POOL,
  LATE_SHOP_POOL,
  MID_REWARD_POOL,
  MID_SHOP_POOL,
  STARTER_EVENT_POOL,
  STARTER_SHOP_POOL,
  TERMINAL_POOL
} from "../../src/content/cards/contentPools.js";
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

const generalJsonCards = [
  ...generalBasicKitJson,
  ...generalBladeArmorJson,
  ...generalFireSupportJson,
  ...generalPoisonHealJson,
  ...generalControlJson,
  ...generalReactionsJson
] as readonly CardDefinition[];
const ironWarlordJsonCards = [
  ...classBladeTempoJson,
  ...classCommandArmorJson,
  ...classSiegeFireJson
] as readonly CardDefinition[];
const activeCardsById = getActiveCardDefinitionsById();
const PHASE_13A_CARD_IDS = new Set([...generalJsonCards, ...ironWarlordJsonCards].map((card) => card.id));
const EARLY_REWARD_TIERS = new Set(["BRONZE", "SILVER"]);
const EARLY_ALLOWED_TIERS = new Set(["BRONZE", "SILVER"]);
const MID_ALLOWED_TIERS = new Set(["BRONZE", "SILVER", "GOLD", "JADE"]);
const LATE_ALLOWED_TIERS = new Set(["BRONZE", "SILVER", "GOLD", "JADE", "CELESTIAL"]);

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
    expect(generalJsonCards).toHaveLength(37);
    expect(ironWarlordJsonCards).toHaveLength(20);
    expect(GENERAL_CARD_DEFINITIONS).toEqual(generalJsonCards);
    expect(IRON_WARLORD_CARD_DEFINITIONS).toEqual(ironWarlordJsonCards);
    expect(LEGACY_MVP_CARD_DEFINITIONS).toEqual(monsterCardsJson);

    for (const card of monsterCardsJson as readonly CardDefinition[]) {
      expect(activeCardsById.has(card.id), card.id).toBe(true);
    }
    for (const card of [...generalJsonCards, ...ironWarlordJsonCards]) {
      expect(activeCardsById.has(card.id), card.id).toBe(true);
    }
    expect(ACTIVE_CARD_DEFINITIONS).toHaveLength(monsterCardsJson.length + 57);
  });

  it("all active cards validate and use only MVP grammar", () => {
    for (const card of ACTIVE_CARD_DEFINITIONS) {
      expect(validateCardDefinition(card), card.id).toEqual({ valid: true, errors: [] });
      expect(card.description, card.id).not.toMatch(/On[A-Z]|hook|ticks?/);
      expect(card.description, card.id).not.toMatch(/Barrier|Ward|Energy Shield|absorb|Vulnerable|Silence|Mana|Spirit|Fate|Heat|morale|rage|random/i);
      expect(card.tags.some((tag) => /barrier|ward|energy|absorb|vulnerable|silence|mana|spirit|fate|heat|morale|rage/i.test(tag)), card.id).toBe(false);
      for (const effect of card.effects ?? []) {
        validateEffect(effect, card.id);
      }
      for (const trigger of card.triggers ?? []) {
        validateTrigger(trigger, card.id);
      }
    }
  });

  it("active runtime content uses OnStatusTicked instead of legacy OnBurnTick", () => {
    const legacyBurnTickCards = ACTIVE_CARD_DEFINITIONS.filter((card) =>
      (card.triggers ?? []).some((trigger) => trigger["hook"] === "OnBurnTick")
    ).map((card) => card.id);

    expect(legacyBurnTickCards).toEqual([]);
  });

  it("all skill JSON loads, validates, and stays modifier-only", () => {
    expect(mvpSkillsJson).toHaveLength(8);
    expect(SKILL_DEFINITIONS).toEqual(mvpSkillsJson);
    for (const skill of SKILL_DEFINITIONS) {
      expect(skill.id.trim().length, skill.id).toBeGreaterThan(0);
      expect(skill.name.trim().length, skill.id).toBeGreaterThan(0);
      expect(skill.description, skill.id).not.toMatch(/Barrier|Ward|Energy Shield|absorb|Freeze|Haste|Vulnerable|Silence|Mana|Spirit|Fate|Heat|morale|rage|random/i);
      expect(skill.modifierTemplates.length, skill.id).toBeGreaterThan(0);
      for (const template of skill.modifierTemplates) {
        expect(["BeforeDealDamage", "BeforeCooldownRecover", "OnStatusApplied"]).toContain(template.hook);
        expect(["ADD_DAMAGE", "MULTIPLY_DAMAGE", "ADD_COOLDOWN_RECOVERY_RATE", "MULTIPLY_COOLDOWN_RECOVERY_RATE", "ADD_STATUS_DURATION", "MULTIPLY_STATUS_DURATION"]).toContain(template.operation.type);
      }
    }
    expect(SKILL_DEFINITIONS.find((skill) => skill.id === "fire-study")?.modifierTemplates[0]?.condition).toEqual({
      sourceHasTag: "fire"
    });
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

  it("Phase 13A cards can appear through shop, event, and monster reward routes", () => {
    const shopCanOfferPhase13Card = Array.from({ length: 40 }, (_, index) =>
      createShopChoices({
        seed: `phase-13-shop-${index}`,
        nodeIndex: 4,
        cardDefinitionsById: activeCardsById
      })
    ).some((choices) => choices.some((choice) => PHASE_13A_CARD_IDS.has(choice.cardDefinitionId)));
    expect(shopCanOfferPhase13Card).toBe(true);

    const eventCanOfferPhase13Card = Array.from({ length: 40 }, (_, index) =>
      createEventChoices({
        seed: `phase-13-event-${index}`,
        nodeIndex: 4,
        cardDefinitionsById: activeCardsById
      })
    ).some((choices) =>
      choices.some((choice) => choice.type === "EVENT_CARD" && PHASE_13A_CARD_IDS.has(choice.cardDefinitionId ?? ""))
    );
    expect(eventCanOfferPhase13Card).toBe(true);

    const rewardChoices = createRewardChoices({
      seed: "phase-13-monster-reward",
      nodeIndex: 4,
      defeatedMonsterId: "oil-raider",
      usedCardDefinitionIds: ["oil-flask", "ember-banner"],
      cardDefinitionsById: activeCardsById
    });
    expect(rewardChoices.some((choice) => choice.type === "REWARD_CARD" && PHASE_13A_CARD_IDS.has(choice.cardDefinitionId ?? ""))).toBe(true);
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

  it("starter shop, starter event, and first battle rewards stay onboarding-safe", () => {
    const starterShopChoices = createShopChoices({
      seed: "starter-shop-sanity",
      nodeIndex: 0,
      starter: true,
      cardDefinitionsById: activeCardsById
    });
    expect(
      starterShopChoices.some(
        (choice) =>
          choice.cost <= 10 &&
          activeCardsById.get(choice.cardDefinitionId)?.type === "ACTIVE"
      )
    ).toBe(true);

    const starterEventChoices = createEventChoices({
      seed: "starter-event-sanity",
      nodeIndex: 1,
      starter: true,
      cardDefinitionsById: activeCardsById
    });
    expect(
      starterEventChoices.some(
        (choice) =>
          choice.type === "EVENT_CARD" &&
          activeCardsById.get(choice.cardDefinitionId ?? "")?.type === "ACTIVE"
      )
    ).toBe(true);

    const firstBattleRewards = createRewardChoices({
      seed: "first-battle-reward-sanity",
      nodeIndex: 3,
      defeatedMonsterId: "training-dummy",
      usedCardDefinitionIds: ["training-staff"],
      cardDefinitionsById: activeCardsById
    });
    const rewardCards = firstBattleRewards
      .filter((choice) => choice.type === "REWARD_CARD")
      .map((choice) => activeCardsById.get(choice.cardDefinitionId ?? ""))
      .filter((card): card is CardDefinition => card !== undefined);
    expect(rewardCards.length).toBeGreaterThan(0);
    expect(rewardCards.some((card) => EARLY_REWARD_TIERS.has(card.tier))).toBe(true);
    expect(rewardCards.every((card) => ["GOLD", "JADE", "CELESTIAL"].includes(card.tier))).toBe(false);
  });

  it("curated content pools reference known cards and expose terminal/support structure", () => {
    const cardPools = [
      STARTER_SHOP_POOL,
      STARTER_EVENT_POOL,
      EARLY_SHOP_POOL,
      MID_SHOP_POOL,
      LATE_SHOP_POOL,
      EARLY_REWARD_POOL,
      MID_REWARD_POOL,
      LATE_REWARD_POOL,
      TERMINAL_POOL,
      BUILD_VITAL_SUPPORT_POOL,
      ...Object.values(ARCHETYPE_POOLS)
    ];
    for (const pool of cardPools) {
      expect(pool.length).toBeGreaterThan(0);
      for (const cardId of pool) {
        expect(activeCardsById.has(cardId), `pool:${cardId}`).toBe(true);
        expect(getCardPoolMetadata(cardId), `metadata:${cardId}`).toBeDefined();
      }
    }
    for (const card of ACTIVE_CARD_DEFINITIONS) {
      expect(CARD_POOL_METADATA[card.id as keyof typeof CARD_POOL_METADATA], `metadata:${card.id}`).toBeDefined();
    }
    for (const terminal of IRON_WARLORD_TERMINALS) {
      expect(activeCardsById.has(terminal.cardId), terminal.cardId).toBe(true);
      expect(TERMINAL_POOL).toContain(terminal.cardId);
      expect(terminal.supportCardIds.length, terminal.cardId).toBeGreaterThanOrEqual(2);
      for (const supportCardId of terminal.supportCardIds) {
        expect(activeCardsById.has(supportCardId), `${terminal.cardId}:${supportCardId}`).toBe(true);
      }
    }
    const buildVitalBronzeSilver = BUILD_VITAL_SUPPORT_POOL
      .map((cardId) => activeCardsById.get(cardId))
      .filter((card): card is CardDefinition => card !== undefined && ["BRONZE", "SILVER"].includes(card.tier));
    expect(buildVitalBronzeSilver.length).toBeGreaterThanOrEqual(6);
    expect(LATE_SHOP_POOL.some((cardId) => activeCardsById.get(cardId)?.tier === "BRONZE")).toBe(true);
    expect(LATE_SHOP_POOL.some((cardId) => activeCardsById.get(cardId)?.tier === "SILVER")).toBe(true);
  });

  it("level-aware pools follow tier and quality progression", () => {
    expect(getShopPoolForLevel(1)).toBe(EARLY_SHOP_POOL);
    expect(getShopPoolForLevel(5)).toBe(MID_SHOP_POOL);
    expect(getShopPoolForLevel(9)).toBe(LATE_SHOP_POOL);
    expect(getRewardPoolForLevel(1)).toBe(EARLY_REWARD_POOL);
    expect(getRewardPoolForLevel(5)).toBe(MID_REWARD_POOL);
    expect(getRewardPoolForLevel(9)).toBe(LATE_REWARD_POOL);

    expect(poolTiers(EARLY_SHOP_POOL).every((tier) => EARLY_ALLOWED_TIERS.has(tier))).toBe(true);
    expect(poolTiers(EARLY_REWARD_POOL).every((tier) => EARLY_ALLOWED_TIERS.has(tier))).toBe(true);
    expect(poolTiers(MID_SHOP_POOL).every((tier) => MID_ALLOWED_TIERS.has(tier))).toBe(true);
    expect(poolTiers(MID_REWARD_POOL).every((tier) => MID_ALLOWED_TIERS.has(tier))).toBe(true);
    expect(poolTiers(LATE_SHOP_POOL).every((tier) => LATE_ALLOWED_TIERS.has(tier))).toBe(true);
    expect(poolTiers(LATE_REWARD_POOL).every((tier) => LATE_ALLOWED_TIERS.has(tier))).toBe(true);

    expect(averageQuality(LATE_REWARD_POOL)).toBeGreaterThan(averageQuality(EARLY_REWARD_POOL));
    expect(countRoleQualityOptions(LATE_REWARD_POOL)).toBeGreaterThan(countRoleQualityOptions(EARLY_REWARD_POOL));
    expect(LATE_REWARD_POOL.some((cardId) => BUILD_VITAL_SUPPORT_POOL.includes(cardId as typeof BUILD_VITAL_SUPPORT_POOL[number]))).toBe(true);
  });

  it("starter shop usually offers attack, defense, and connector roles", () => {
    const choices = createShopChoices({
      seed: "starter-role-shape",
      nodeIndex: 0,
      starter: true,
      cardDefinitionsById: activeCardsById
    });
    const roles = choices.map((choice) => getCardPoolMetadata(choice.cardDefinitionId)?.role);
    expect(roles).toContain("starter");
    expect(roles).toContain("defense");
    expect(roles.some((role) => role === "connector" || role === "starter")).toBe(true);
  });

  it("late reward choices trend toward stronger engine, payoff, and terminal cards", () => {
    const earlyRewards = Array.from({ length: 12 }, (_, index) =>
      createRewardChoices({
        seed: `quality-early-${index}`,
        nodeIndex: index,
        usedCardDefinitionIds: [],
        cardDefinitionsById: activeCardsById,
        level: 1
      })
    ).flatMap((choices) => choices.filter((choice) => choice.type === "REWARD_CARD").map((choice) => choice.cardDefinitionId ?? ""));
    const lateRewards = Array.from({ length: 12 }, (_, index) =>
      createRewardChoices({
        seed: `quality-late-${index}`,
        nodeIndex: index,
        usedCardDefinitionIds: [],
        cardDefinitionsById: activeCardsById,
        level: 9
      })
    ).flatMap((choices) => choices.filter((choice) => choice.type === "REWARD_CARD").map((choice) => choice.cardDefinitionId ?? ""));

    expect(averageQuality(lateRewards)).toBeGreaterThan(averageQuality(earlyRewards));
    expect(countRoleQualityOptions(lateRewards)).toBeGreaterThan(countRoleQualityOptions(earlyRewards));
  });

  it("level 8+ rewards include a terminal or high-quality build card when available", () => {
    for (let index = 0; index < 20; index += 1) {
      const choices = createRewardChoices({
        seed: `late-anchor-reward-${index}`,
        nodeIndex: index,
        defeatedMonsterId: "training-dummy",
        usedCardDefinitionIds: ["training-staff"],
        cardDefinitionsById: activeCardsById,
        level: 8
      });
      const rewardCardIds = choices
        .filter((choice) => choice.type === "REWARD_CARD")
        .map((choice) => choice.cardDefinitionId ?? "");
      expect(rewardCardIds.some(isTerminalOrHighQualityBuildCard), rewardCardIds.join(",")).toBe(true);
    }
  });

  it("level 8+ shops include at least one high-quality build card while starter shop stays unchanged", () => {
    const starterShopChoices = createShopChoices({
      seed: "late-shop-starter-unchanged",
      nodeIndex: 0,
      starter: true,
      level: 10,
      cardDefinitionsById: activeCardsById
    });
    expect(starterShopChoices.map((choice) => choice.cardDefinitionId)).toEqual([...STARTER_SHOP_POOL]);
    expect(starterShopChoices.some((choice) => activeCardsById.get(choice.cardDefinitionId)?.type === "ACTIVE")).toBe(true);

    for (let index = 0; index < 20; index += 1) {
      const choices = createShopChoices({
        seed: `late-anchor-shop-${index}`,
        nodeIndex: index + 10,
        level: 8,
        cardDefinitionsById: activeCardsById
      });
      expect(choices).toHaveLength(3);
      expect(choices.map((choice) => choice.cardDefinitionId).some(isHighQualityShopCard)).toBe(true);
    }
  });

  it("level 1-2 shops and rewards avoid late-game-only feel", () => {
    for (let index = 0; index < 20; index += 1) {
      const shopCards = createShopChoices({
        seed: `early-shop-${index}`,
        nodeIndex: index,
        level: 2,
        cardDefinitionsById: activeCardsById
      }).map((choice) => activeCardsById.get(choice.cardDefinitionId));
      expect(shopCards.every((card) => card && EARLY_ALLOWED_TIERS.has(card.tier))).toBe(true);
      expect(shopCards.every((card) => card && !isTerminalOrHighQualityBuildCard(card.id))).toBe(true);

      const rewardCards = createRewardChoices({
        seed: `early-reward-${index}`,
        nodeIndex: index,
        cardDefinitionsById: activeCardsById,
        level: 2
      })
        .filter((choice) => choice.type === "REWARD_CARD")
        .map((choice) => activeCardsById.get(choice.cardDefinitionId ?? ""));
      expect(rewardCards.every((card) => card && EARLY_ALLOWED_TIERS.has(card.tier))).toBe(true);
      expect(rewardCards.every((card) => card && !isTerminalOrHighQualityBuildCard(card.id))).toBe(true);
    }
  });

  it("early monsters generate simpler formations than elite and boss monsters", () => {
    const generator = new MonsterGenerator();
    const early = generator.generateByTemplateId({ templateId: "bandit-duelist", seed: "complexity", day: 2 });
    const elite = generator.generateByTemplateId({ templateId: "cinder-captain", seed: "complexity", day: 7 });
    const boss = generator.generateByTemplateId({ templateId: "siege-marshal", seed: "complexity", day: 10 });

    expect(early.cardInstances.length).toBeLessThanOrEqual(3);
    expect(elite.cardInstances.length).toBeGreaterThanOrEqual(early.cardInstances.length);
    expect(boss.cardInstances.length).toBeGreaterThanOrEqual(3);
  });

  it.each([
    ["Blade Tempo", ["rusty-blade", "field-drum", "vanguard-saber", "left-flank-blade"]],
    ["Burn Engine", ["oil-flask", "ember-banner", "fire-arrow-cart", "cinder-seal"]],
    ["Armor Counter", ["iron-guard", "counter-stance", "shield-wall"]],
    ["Drum Command", ["vanguard-saber", "war-drum", "battle-standard", "patrol-spear"]],
    ["Siege Fire", ["war-drum", "fire-cart-battery", "siege-brazier"]],
    ["Hybrid Bruiser", ["militia-spear", "burning-shield", "guard-captain", "frontline-banner"]],
    ["Armor Terminal", ["iron-guard", "shield-wall", "battle-standard", "iron-bastion-strike"]],
    ["Crit Execution", ["vanguard-saber", "left-flank-blade", "execution-halberd", "war-drum"]]
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

  it("terminal builds outperform a simple starter-only build", () => {
    const starter = simulatePlayerBuild(["rusty-blade", "militia-spear"], 720);
    const armorTerminal = simulatePlayerBuild(["iron-guard", "shield-wall", "battle-standard", "iron-bastion-strike"], 720);
    const critTerminal = simulatePlayerBuild(["vanguard-saber", "left-flank-blade", "execution-halberd", "war-drum"], 720);

    expect(armorTerminal.enemyHpLost).toBeGreaterThan(starter.enemyHpLost);
    expect(critTerminal.enemyHpLost).toBeGreaterThan(starter.enemyHpLost);
  });

  it("card summaries are readable seconds-only and hide internal hook names", () => {
    for (const card of ACTIVE_CARD_DEFINITIONS) {
      const summary = getCardDisplayInfo(card).summary;
      expect(summary, card.id).not.toMatch(/\d+t\b|tick|On[A-Z]|hook/i);
    }
  });
});

function validateEffect(effect: Readonly<Record<string, unknown>>, cardId: string): void {
  expect(
    ["DealDamage", "GainArmor", "ApplyBurn", "ApplyPoison", "HealHP", "ModifyCooldown", "ApplyHaste", "ApplySlow", "ApplyFreeze"],
    `${cardId}:command`
  ).toContain(effect["command"]);
  expect(JSON.stringify(effect), cardId).not.toMatch(/Barrier|Ward|EnergyShield|Energy Shield|absorb|Vulnerable|Silence|Mana|Spirit|Fate|Heat|morale|rage|random/i);
  if (effect["command"] === "DealDamage") {
    expect(effect["amount"], `${cardId}:amount`).toBeTypeOf("number");
    if (effect["damageType"] !== undefined) {
      expect(["DIRECT", "PHYSICAL", "FIRE", "POISON"], `${cardId}:damageType`).toContain(effect["damageType"]);
    }
    if (effect["ignoresArmor"] !== undefined) {
      expect(effect["ignoresArmor"], `${cardId}:ignoresArmor`).toBeTypeOf("boolean");
    }
    if (effect["critChancePercent"] !== undefined) {
      expect(effect["critChancePercent"], `${cardId}:critChancePercent`).toBeTypeOf("number");
      expect(effect["critChancePercent"], `${cardId}:critChancePercent`).toBeGreaterThanOrEqual(0);
      expect(effect["critChancePercent"], `${cardId}:critChancePercent`).toBeLessThanOrEqual(100);
      expect(effect["critMultiplier"], `${cardId}:critMultiplier`).toBeTypeOf("number");
    }
    if (effect["critMultiplier"] !== undefined) {
      expect(effect["critMultiplier"], `${cardId}:critMultiplier`).toBeTypeOf("number");
      expect(effect["critMultiplier"], `${cardId}:critMultiplier`).toBeGreaterThanOrEqual(1);
    }
    if (effect["scaling"] !== undefined) {
      expect(isRecord(effect["scaling"]), `${cardId}:scaling`).toBe(true);
      const scaling = effect["scaling"] as Readonly<Record<string, unknown>>;
      expect(["OWNER_ARMOR_PERCENT", "OWNER_MAX_HP_PERCENT", "TARGET_MISSING_HP_PERCENT"], `${cardId}:scaling.source`).toContain(scaling["source"]);
      expect(scaling["percent"], `${cardId}:scaling.percent`).toBeTypeOf("number");
      expect(scaling["percent"], `${cardId}:scaling.percent`).toBeGreaterThan(0);
    }
    if (effect["conditionalMultiplier"] !== undefined) {
      expect(isRecord(effect["conditionalMultiplier"]), `${cardId}:conditionalMultiplier`).toBe(true);
      const conditional = effect["conditionalMultiplier"] as Readonly<Record<string, unknown>>;
      expect(conditional["targetHpBelowPercent"], `${cardId}:conditionalMultiplier.targetHpBelowPercent`).toBeTypeOf("number");
      expect(conditional["multiplier"], `${cardId}:conditionalMultiplier.multiplier`).toBeTypeOf("number");
      expect(conditional["multiplier"], `${cardId}:conditionalMultiplier.multiplier`).toBeGreaterThanOrEqual(1);
    }
  }
  if (effect["command"] === "ApplyBurn") {
    expect(effect["durationTicks"], `${cardId}:durationTicks`).toBeTypeOf("number");
  }
  if (effect["command"] === "ApplyPoison") {
    expect(effect["amount"], `${cardId}:amount`).toBeTypeOf("number");
    if (effect["durationTicks"] !== undefined) {
      expect(effect["durationTicks"], `${cardId}:durationTicks`).toBeTypeOf("number");
    }
  }
  if (effect["command"] === "HealHP") {
    expect(effect["amount"], `${cardId}:amount`).toBeTypeOf("number");
  }
  if (effect["command"] === "ModifyCooldown") {
    expect(["SELF", "ADJACENT_ALLY", undefined], `${cardId}:target`).toContain(effect["target"]);
  }
  if (effect["command"] === "ApplyHaste") {
    expect(["SELF", "ADJACENT_ALLY", "OWNER_ALL_CARDS"], `${cardId}:target`).toContain(effect["target"]);
    expect(effect["percent"], `${cardId}:percent`).toBeTypeOf("number");
    expect(effect["durationTicks"], `${cardId}:durationTicks`).toBeTypeOf("number");
  }
  if (effect["command"] === "ApplySlow") {
    expect(["SELF", "OPPOSITE_ENEMY_CARD", "ENEMY_LEFTMOST_ACTIVE"], `${cardId}:target`).toContain(effect["target"]);
    expect(effect["percent"], `${cardId}:percent`).toBeTypeOf("number");
    expect(effect["durationTicks"], `${cardId}:durationTicks`).toBeTypeOf("number");
  }
  if (effect["command"] === "ApplyFreeze") {
    expect(["OPPOSITE_ENEMY_CARD", "ENEMY_LEFTMOST_ACTIVE"], `${cardId}:target`).toContain(effect["target"]);
    expect(effect["durationTicks"], `${cardId}:durationTicks`).toBeTypeOf("number");
  }
}

function validateTrigger(trigger: Readonly<Record<string, unknown>>, cardId: string): void {
  expect(
    [
      "OnCombatStart",
      "OnCardActivated",
      "OnDamageDealt",
      "OnDamageTaken",
      "OnStatusApplied",
      "OnStatusTicked",
      "OnBurnTick",
      "OnHealReceived",
      "OnCooldownModified",
      "OnCombatEnd"
    ],
    `${cardId}:hook`
  ).toContain(trigger["hook"]);
  expect(trigger["internalCooldownTicks"], `${cardId}:internalCooldownTicks`).toBeTypeOf("number");
  expect(trigger["internalCooldownTicks"], `${cardId}:internalCooldownTicks`).toBeGreaterThan(0);
  expect(trigger["maxTriggersPerTick"], `${cardId}:maxTriggersPerTick`).toBeTypeOf("number");
  expect(trigger["maxTriggersPerTick"], `${cardId}:maxTriggersPerTick`).toBeGreaterThan(0);
  if (trigger["conditions"] !== undefined) {
    expect(isRecord(trigger["conditions"]), `${cardId}:conditions`).toBe(true);
    const conditions = trigger["conditions"] as Record<string, unknown>;
    const conditionKeys = Object.keys(conditions);
    expect(conditionKeys.length, `${cardId}:conditions`).toBeGreaterThan(0);
    for (const key of conditionKeys) {
      expect(
        [
          "status",
          "appliedByOwner",
          "sourceHasTag",
          "cardIsAdjacent",
          "targetHasStatus",
          "ownerHasStatus",
          "healedAmountAtLeast",
          "ownerHpBelowPercent",
          "targetHpBelowPercent"
        ],
        `${cardId}:condition:${key}`
      ).toContain(key);
    }
    if (conditions["status"] !== undefined) {
      expect(["Burn", "Poison"], `${cardId}:conditions.status`).toContain(conditions["status"]);
    }
    if (conditions["targetHasStatus"] !== undefined) {
      expect(["Burn", "Poison"], `${cardId}:conditions.targetHasStatus`).toContain(conditions["targetHasStatus"]);
    }
    if (conditions["ownerHasStatus"] !== undefined) {
      expect(["Burn", "Poison"], `${cardId}:conditions.ownerHasStatus`).toContain(conditions["ownerHasStatus"]);
    }
    for (const booleanKey of ["appliedByOwner", "cardIsAdjacent"]) {
      if (conditions[booleanKey] !== undefined) {
        expect(conditions[booleanKey], `${cardId}:conditions.${booleanKey}`).toBeTypeOf("boolean");
      }
    }
    for (const numberKey of ["ownerHpBelowPercent", "targetHpBelowPercent", "healedAmountAtLeast"]) {
      if (conditions[numberKey] !== undefined) {
        expect(conditions[numberKey], `${cardId}:conditions.${numberKey}`).toBeTypeOf("number");
      }
    }
    if (conditions["sourceHasTag"] !== undefined) {
      expect(conditions["sourceHasTag"], `${cardId}:conditions.sourceHasTag`).toBeTypeOf("string");
      expect((conditions["sourceHasTag"] as string).trim().length, `${cardId}:conditions.sourceHasTag`).toBeGreaterThan(0);
    }
  }
  for (const effect of (trigger["effects"] as readonly Readonly<Record<string, unknown>>[] | undefined) ?? []) {
    validateEffect(effect, cardId);
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function poolTiers(cardIds: readonly string[]): string[] {
  return cardIds.map((cardId) => activeCardsById.get(cardId)?.tier ?? "UNKNOWN");
}

function averageQuality(cardIds: readonly string[]): number {
  return cardIds.reduce((total, cardId) => total + getCardQualityScore(cardId), 0) / Math.max(1, cardIds.length);
}

function countRoleQualityOptions(cardIds: readonly string[]): number {
  return cardIds.filter((cardId) => {
    const role = getCardPoolMetadata(cardId)?.role;
    return role === "engine" || role === "payoff" || role === "terminal";
  }).length;
}

function simulatePlayerBuild(cardIds: readonly string[], maxCombatTicks: number): { readonly enemyHpLost: number } {
  const enemyMaxHp = 80;
  const player = createFormation("player", "PLAYER", cardIds);
  const enemy = createFormation("enemy", "MONSTER", ["training-staff", "wooden-shield"]);
  const playerInstances = createInstances("player-card", cardIds);
  const enemyInstances = createInstances("enemy-card", ["training-staff", "wooden-shield"]);
  const result = new CombatEngine().simulate({
    playerFormation: player,
    enemyFormation: { ...enemy, maxHp: enemyMaxHp },
    cardInstancesById: new Map([...playerInstances, ...enemyInstances].map((card) => [card.instanceId, card])),
    cardDefinitionsById: activeCardsById,
    maxCombatTicks
  });

  return { enemyHpLost: enemyMaxHp - result.enemyFinalHp };
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
