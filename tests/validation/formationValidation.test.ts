import { describe, expect, it } from "vitest";

import type { CardDefinition, CardInstance } from "../../src/model/card.js";
import type { FormationSnapshot } from "../../src/model/formation.js";
import { validateFormationSnapshot } from "../../src/validation/formationValidation.js";

function createValidFormation(overrides: Partial<FormationSnapshot> = {}): FormationSnapshot {
  return {
    id: "player-formation",
    kind: "PLAYER",
    displayName: "Player",
    level: 1,
    maxHp: 40,
    startingArmor: 0,
    slots: [
      { slotIndex: 1, cardInstanceId: "card-1" },
      { slotIndex: 2 },
      { slotIndex: 3 },
      { slotIndex: 4 }
    ],
    skills: [],
    relics: [],
    ...overrides
  };
}

describe("validateFormationSnapshot", () => {
  it("allows a valid FormationSnapshot", () => {
    const result = validateFormationSnapshot(createValidFormation());

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects duplicate slot indexes", () => {
    const result = validateFormationSnapshot(
      createValidFormation({
        slots: [{ slotIndex: 1 }, { slotIndex: 1 }, { slotIndex: 2 }, { slotIndex: 3 }]
      })
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      path: "slots[1].slotIndex",
      message: "Formation slot index 1 is duplicated."
    });
  });

  it("rejects a size 2 card that does not fit", () => {
    const cardDefinition: CardDefinition = {
      id: "war-drum",
      name: "War Drum",
      tier: "SILVER",
      type: "ACTIVE",
      size: 2,
      tags: ["support"],
      cooldownTicks: 120,
      effects: [{}],
      description: "A large active card."
    };
    const cardInstance: CardInstance = {
      instanceId: "card-1",
      definitionId: "war-drum"
    };

    const result = validateFormationSnapshot(
      createValidFormation({
        slots: [
          { slotIndex: 1 },
          { slotIndex: 2 },
          { slotIndex: 3 },
          { slotIndex: 4, cardInstanceId: "card-1" }
        ]
      }),
      {
        cardDefinitionsById: new Map([[cardDefinition.id, cardDefinition]]),
        cardInstancesById: new Map([[cardInstance.instanceId, cardInstance]])
      }
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      path: "slots[3].cardInstanceId",
      message: "Size 2 card card-1 must fit in adjacent slots."
    });
  });
});
