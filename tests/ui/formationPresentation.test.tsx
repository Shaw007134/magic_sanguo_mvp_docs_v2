import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getMonsterCardDefinitionsById } from "../../src/content/cards/monsterCards.js";
import { MonsterGenerator } from "../../src/content/monsters/MonsterGenerator.js";
import { getMonsterTemplateById } from "../../src/content/monsters/monsterTemplates.js";
import { EnemyPreview } from "../../src/ui/components/EnemyPreview.js";
import { FormationEditor } from "../../src/ui/components/FormationEditor.js";
import {
  createEmptyFormationSlots,
  moveCardFromChestToFormation,
  type UiInventoryState
} from "../../src/ui/state/uiState.js";

const cardDefinitionsById = getMonsterCardDefinitionsById();

describe("formation presentation", () => {
  it("size 2 player card spans visually as one card block", () => {
    const state: UiInventoryState = {
      gold: 10,
      ownedCards: [{ instanceId: "spark", definitionId: "spark-drum" }],
      formationSlots: createEmptyFormationSlots()
    };
    const placed = moveCardFromChestToFormation(state, "spark", 2, cardDefinitionsById);
    const html = renderToStaticMarkup(
      <FormationEditor
        slots={placed.formationSlots}
        cardInstancesById={new Map(placed.ownedCards.map((card) => [card.instanceId, card]))}
        cardDefinitionsById={cardDefinitionsById}
        onSlotClick={() => undefined}
        onRemove={() => undefined}
      />
    );

    expect(html).toContain("size-two-card");
    expect(html).toContain("Spark Drum");
    expect(html).not.toContain("Size 2 footprint");
  });

  it("enemy preview uses the same size 2 presentation rule", () => {
    const template = getMonsterTemplateById("drum-tactician");
    if (!template) {
      throw new Error("Missing drum-tactician template.");
    }
    const monster = new MonsterGenerator().generate({
      template,
      seed: "presentation",
      day: 5,
      cardDefinitionsById
    });
    const html = renderToStaticMarkup(
      <EnemyPreview monster={monster} cardDefinitionsById={cardDefinitionsById} />
    );

    expect(html).toContain("size-two-card");
    expect(html).toContain("Spark Drum");
    expect(html).not.toContain("Size 2 footprint");
  });

  it("expanded 16 slot player formation renders without breaking slot labels", () => {
    const state: UiInventoryState = {
      gold: 10,
      ownedCards: [{ instanceId: "blade", definitionId: "rusty-blade" }],
      formationSlots: createEmptyFormationSlots(16)
    };
    const placed = moveCardFromChestToFormation(state, "blade", 16, cardDefinitionsById);
    const html = renderToStaticMarkup(
      <FormationEditor
        slots={placed.formationSlots}
        cardInstancesById={new Map(placed.ownedCards.map((card) => [card.instanceId, card]))}
        cardDefinitionsById={cardDefinitionsById}
        onSlotClick={() => undefined}
        onRemove={() => undefined}
      />
    );

    expect(html).toContain("16 slots");
    expect(html).toContain("Slot 16");
    expect(html).toContain("Rusty Blade");
  });
});
