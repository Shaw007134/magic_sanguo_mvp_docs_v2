import { describe, expect, it } from "vitest";

import { getActiveCardDefinitionsById } from "../../src/content/cards/activeCards.js";
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

  it("pending enchantment event choices survive save/load without rerolling", () => {
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
      currentChoices: choices,
      pendingEnchantmentChoices: [
        {
          id: "pending-study",
          enchantmentDefinitionId: "bronze-iron-edge",
          targetRule: "WEAPON_CARD",
          label: "Study Iron Edge",
          description: "A planned weapon enchantment for steadier physical pressure."
        }
      ]
    };

    const save = serializeRunState(manager.state);
    expect(save.ok).toBe(true);
    const loaded = deserializeRunState(save.ok ? save.value : "");

    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.value.currentChoices).toEqual(choices);
      expect(loaded.value.pendingEnchantmentChoices).toEqual(manager.state.pendingEnchantmentChoices);
    }
  });

  it("choosing an enchantment event stores planned choice data without granting a combat card", () => {
    const manager = RunManager.createNewRun("choose-enchantment-event");
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

    const beforeCards = manager.state.ownedCards;
    const result = manager.chooseEventOption(choices[0]!.id);

    expect(result.ok).toBe(true);
    expect(manager.state.ownedCards).toEqual(beforeCards);
    expect(manager.state.pendingEnchantmentChoices?.[0]).toEqual(expect.objectContaining({
      enchantmentDefinitionId: "bronze-iron-edge",
      targetRule: "WEAPON_CARD"
    }));
  });
});
