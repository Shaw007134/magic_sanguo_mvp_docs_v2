import { describe, expect, it } from "vitest";

import { CombatEngine } from "../../src/combat/CombatEngine.js";
import { getActiveCardDefinitionsById } from "../../src/content/cards/activeCards.js";
import {
  createEffectiveCardDefinitionMap,
  createEffectiveCardInstances
} from "../../src/content/cards/effectiveCardDefinition.js";
import type { CardInstance } from "../../src/model/card.js";
import type { FormationSnapshot } from "../../src/model/formation.js";
import {
  BRONZE_ENCHANTMENT_INTRO_TEMPLATE,
  getEventPoolForLevel
} from "../../src/run/nodes/EventGenerator.js";
import { createEventChoices } from "../../src/run/nodes/EventNode.js";
import { RunManager } from "../../src/run/RunManager.js";
import { deserializeRunState, serializeRunState } from "../../src/run/save/SaveManager.js";

const activeCardsById = getActiveCardDefinitionsById();

describe("event generation", () => {
  it("is deterministic for the same run seed and state", () => {
    const first = createEventChoices({
      seed: "same-event",
      nodeIndex: 19,
      level: 7,
      cardDefinitionsById: activeCardsById
    });
    const second = createEventChoices({
      seed: "same-event",
      nodeIndex: 19,
      level: 7,
      cardDefinitionsById: activeCardsById
    });

    expect(second).toEqual(first);
  });

  it("starter events and level 1-3 random pools exclude enchantment events", () => {
    const starterChoices = createEventChoices({
      seed: "starter-event",
      nodeIndex: 1,
      level: 1,
      starter: true,
      cardDefinitionsById: activeCardsById
    });
    expect(starterChoices.some((choice) => choice.type === "EVENT_ENCHANTMENT")).toBe(false);

    for (const level of [1, 2, 3]) {
      const pool = getEventPoolForLevel({ level, includeEnchantmentEvents: level >= 7 });
      expect(pool.some((template) => template.tags.includes("enchantment")), `level ${level}`).toBe(false);
      for (let index = 0; index < 12; index += 1) {
        const choices = createEventChoices({
          seed: `early-event-${level}-${index}`,
          nodeIndex: 13 + index * 6,
          level,
          cardDefinitionsById: activeCardsById
        });
        expect(choices.some((choice) => choice.type === "EVENT_ENCHANTMENT"), `level ${level} seed ${index}`).toBe(false);
      }
    }
  });

  it("level 7+ event pools can include enchantment-tagged events", () => {
    const pool = getEventPoolForLevel({ level: 7, includeEnchantmentEvents: true });

    expect(pool).toContain(BRONZE_ENCHANTMENT_INTRO_TEMPLATE);
  });

  it("forces the third major event into the Bronze Enchantment Intro", () => {
    const choices = createEventChoices({
      seed: "third-major-event",
      nodeIndex: 25,
      level: 7,
      cardDefinitionsById: activeCardsById
    });

    expect(choices).toHaveLength(3);
    expect(choices.every((choice) => choice.type === "EVENT_ENCHANTMENT")).toBe(true);
    expect(choices.map((choice) => choice.eventTemplateId)).toEqual([
      "bronze-enchantment-intro",
      "bronze-enchantment-intro",
      "bronze-enchantment-intro"
    ]);
  });

  it("enchantment event choices survive save/load without rerolling", () => {
    const manager = RunManager.createNewRun("save-enchantment-event");
    const choices = createEventChoices({
      seed: manager.state.seed,
      nodeIndex: 25,
      level: 7,
      cardDefinitionsById: activeCardsById
    });
    manager.state = {
      ...manager.state,
      currentNodeIndex: 25,
      level: 7,
      currentNode: { id: "cycle-event-15", type: "EVENT", day: 11, label: "Event" },
      currentChoices: choices
    };

    const save = serializeRunState(manager.state);
    expect(save.ok).toBe(true);
    const loaded = deserializeRunState(save.ok ? save.value : "");

    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.value.currentChoices).toEqual(choices);
    }
  });

  it("choosing an enchantment event attaches the enchantment to the selected card", () => {
    const manager = RunManager.createNewRun("choose-enchantment-event");
    expect(manager.addCardToChest("rusty-blade").ok).toBe(true);
    const target = manager.state.ownedCards[0]!;
    const choices = createEventChoices({
      seed: manager.state.seed,
      nodeIndex: 25,
      level: 7,
      cardDefinitionsById: activeCardsById
    });
    manager.state = {
      ...manager.state,
      currentNodeIndex: 25,
      level: 7,
      currentNode: { id: "cycle-event-15", type: "EVENT", day: 11, label: "Event" },
      currentChoices: choices
    };

    const result = manager.chooseEventOption(choices[0]!.id, target.instanceId);

    expect(result.ok).toBe(true);
    expect(manager.state.ownedCards).toHaveLength(1);
    expect(manager.state.ownedCards[0]?.enchantment).toEqual(expect.objectContaining({
      enchantmentDefinitionId: "bronze-iron-edge",
      sourceEventChoiceId: choices[0]!.id,
      attachedAtNodeIndex: 25
    }));
  });

  it("Bronze Enchantment Intro cannot attach to invalid cards or already-enchanted cards", () => {
    const manager = RunManager.createNewRun("invalid-enchantment-target");
    expect(manager.addCardToChest("wooden-shield").ok).toBe(true);
    expect(manager.addCardToChest("rusty-blade").ok).toBe(true);
    const shield = manager.state.ownedCards.find((card) => card.definitionId === "wooden-shield")!;
    const blade = manager.state.ownedCards.find((card) => card.definitionId === "rusty-blade")!;
    const choices = createEventChoices({
      seed: manager.state.seed,
      nodeIndex: 25,
      level: 7,
      cardDefinitionsById: activeCardsById
    });
    manager.state = {
      ...manager.state,
      currentNodeIndex: 25,
      level: 7,
      currentNode: { id: "cycle-event-15", type: "EVENT", day: 11, label: "Event" },
      currentChoices: choices
    };

    expect(manager.chooseEventOption(choices[0]!.id, shield.instanceId).ok).toBe(false);
    expect(manager.state.exp).toBe(0);
    expect(manager.state.ownedCards.find((card) => card.instanceId === shield.instanceId)?.enchantment).toBeUndefined();

    expect(manager.chooseEventOption(choices[0]!.id, blade.instanceId).ok).toBe(true);
    manager.state = {
      ...manager.state,
      currentNode: { id: "cycle-event-15b", type: "EVENT", day: 11, label: "Event" },
      currentChoices: choices
    };
    expect(manager.chooseEventOption(choices[1]!.id, blade.instanceId).ok).toBe(false);
    expect(manager.state.ownedCards.find((card) => card.instanceId === blade.instanceId)?.enchantment?.enchantmentDefinitionId)
      .toBe("bronze-iron-edge");
  });

  it("Bronze enchantments apply only to effect-eligible cards", () => {
    const manager = RunManager.createNewRun("effect-eligible-enchantment-target");
    expect(manager.addCardToChest("oil-flask").ok).toBe(true);
    expect(manager.addCardToChest("field-medic").ok).toBe(true);
    expect(manager.addCardToChest("rusty-blade").ok).toBe(true);
    const oil = manager.state.ownedCards.find((card) => card.definitionId === "oil-flask")!;
    const medic = manager.state.ownedCards.find((card) => card.definitionId === "field-medic")!;
    const blade = manager.state.ownedCards.find((card) => card.definitionId === "rusty-blade")!;
    const choices = createEventChoices({
      seed: manager.state.seed,
      nodeIndex: 25,
      level: 7,
      cardDefinitionsById: activeCardsById
    });
    manager.state = {
      ...manager.state,
      currentNodeIndex: 25,
      level: 7,
      currentNode: { id: "cycle-event-15", type: "EVENT", day: 11, label: "Event" },
      currentChoices: choices
    };

    expect(manager.chooseEventOption(choices[1]!.id, blade.instanceId).ok).toBe(false);
    expect(manager.chooseEventOption(choices[1]!.id, oil.instanceId).ok).toBe(true);

    manager.state = {
      ...manager.state,
      currentNode: { id: "cycle-event-15b", type: "EVENT", day: 11, label: "Event" },
      currentChoices: choices
    };
    expect(manager.chooseEventOption(choices[2]!.id, blade.instanceId).ok).toBe(false);
    expect(manager.chooseEventOption(choices[2]!.id, medic.instanceId).ok).toBe(true);
  });

  it("save/load round trip preserves attached enchantments", () => {
    const manager = RunManager.createNewRun("save-attached-enchantment");
    expect(manager.addCardToChest("rusty-blade").ok).toBe(true);
    const target = manager.state.ownedCards[0]!;
    const choices = createEventChoices({
      seed: manager.state.seed,
      nodeIndex: 25,
      level: 7,
      cardDefinitionsById: activeCardsById
    });
    manager.state = {
      ...manager.state,
      currentNodeIndex: 25,
      level: 7,
      currentNode: { id: "cycle-event-15", type: "EVENT", day: 11, label: "Event" },
      currentChoices: choices
    };
    expect(manager.chooseEventOption(choices[0]!.id, target.instanceId).ok).toBe(true);

    const save = serializeRunState(manager.state);
    expect(save.ok).toBe(true);
    const loaded = deserializeRunState(save.ok ? save.value : "");

    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.value.ownedCards).toEqual(manager.state.ownedCards);
      expect(loaded.value.ownedCards[0]?.enchantment?.enchantmentDefinitionId).toBe("bronze-iron-edge");
      const effective = createEffectiveCardDefinitionMap({
        cardInstances: loaded.value.ownedCards,
        baseDefinitionsById: activeCardsById
      }).get(createEffectiveCardInstances(loaded.value.ownedCards)[0]!.definitionId);
      expect(effective?.effects).toEqual([
        { command: "DealDamage", amount: 2 },
        { command: "GainArmor", amount: 1 }
      ]);
    }
  });

  it("attached Bronze enchantment combat effects apply deterministically", () => {
    const baseCard: CardInstance = { instanceId: "blade", definitionId: "rusty-blade" };
    const enchantedCard: CardInstance = {
      ...baseCard,
      enchantment: {
        id: "run-enchantment-test",
        enchantmentDefinitionId: "bronze-iron-edge",
        sourceEventChoiceId: "event-test",
        attachedAtNodeIndex: 25
      }
    };
    const playerBase = formationWith(baseCard);
    const playerEnchanted = formationWith(enchantedCard);
    const enemy = enemyFormation();
    const engine = new CombatEngine();
    const enemyCard = { instanceId: "enemy-card", definitionId: "training-staff" };
    const effectiveCards = createEffectiveCardInstances([enchantedCard]);
    const effectiveDefinitionsById = createEffectiveCardDefinitionMap({
      cardInstances: [enchantedCard],
      baseDefinitionsById: activeCardsById
    });

    const base = engine.simulate({
      playerFormation: playerBase,
      enemyFormation: enemy,
      maxCombatTicks: 240,
      cardDefinitionsById: activeCardsById,
      cardInstancesById: new Map([
        [baseCard.instanceId, baseCard],
        [enemyCard.instanceId, enemyCard]
      ])
    });
    const firstEnchanted = engine.simulate({
      playerFormation: playerEnchanted,
      enemyFormation: enemy,
      maxCombatTicks: 240,
      cardDefinitionsById: effectiveDefinitionsById,
      cardInstancesById: new Map([
        [effectiveCards[0]!.instanceId, effectiveCards[0]!],
        [enemyCard.instanceId, enemyCard]
      ])
    });
    const secondEnchanted = engine.simulate({
      playerFormation: playerEnchanted,
      enemyFormation: enemy,
      maxCombatTicks: 240,
      cardDefinitionsById: effectiveDefinitionsById,
      cardInstancesById: new Map([
        [effectiveCards[0]!.instanceId, effectiveCards[0]!],
        [enemyCard.instanceId, enemyCard]
      ])
    });

    expect(firstEnchanted).toEqual(secondEnchanted);
    expect(firstEnchanted.replayTimeline.events).toContainEqual(expect.objectContaining({
      type: "ArmorGained",
      sourceId: "blade",
      payload: expect.objectContaining({ amount: 1 })
    }));
    expect(firstEnchanted.replayTimeline.events).not.toEqual(base.replayTimeline.events);
  });
});

function formationWith(card: CardInstance): FormationSnapshot {
  return {
    id: "player",
    kind: "PLAYER",
    displayName: "Player",
    level: 1,
    maxHp: 40,
    startingArmor: 0,
    slots: [{ slotIndex: 1, cardInstanceId: card.instanceId }],
    skills: [],
    relics: []
  };
}

function enemyFormation(): FormationSnapshot {
  return {
    id: "enemy",
    kind: "MONSTER",
    displayName: "Enemy",
    level: 1,
    maxHp: 40,
    startingArmor: 0,
    slots: [{ slotIndex: 1, cardInstanceId: "enemy-card" }],
    skills: [],
    relics: []
  };
}
