import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getMonsterCardDefinitionsById } from "../../src/content/cards/monsterCards.js";
import { createNewRun } from "../../src/run/RunManager.js";
import type { RunChoice } from "../../src/run/RunState.js";
import { FormationEditor } from "../../src/ui/components/FormationEditor.js";
import { RunStatusBar } from "../../src/ui/components/RunStatusBar.js";
import { getChoiceDisplayInfo } from "../../src/ui/presentation/choiceDisplay.js";

const cardDefinitionsById = getMonsterCardDefinitionsById();

describe("run presentation", () => {
  it("new run status displays clear labels and values", () => {
    const manager = createNewRun("status-display");
    const html = renderToStaticMarkup(<RunStatusBar state={manager.state} />);

    expect(manager.state.level).toBe(1);
    expect(manager.state.exp).toBe(0);
    expect(manager.state.expToNextLevel).toBe(10);
    expect(manager.state.gold).toBe(10);
    expect(manager.state.currentHp).toBe(40);
    expect(manager.state.maxHp).toBe(40);
    expect(html).toContain("<dt>Gold</dt><dd>10</dd>");
    expect(html).toContain("<dt>Level</dt><dd>1</dd>");
    expect(html).toContain("<dt>EXP</dt><dd>0 / 10</dd>");
    expect(html).toContain("<dt>HP</dt><dd>40 / 40</dd>");
  });

  it("empty formation slots render slot label and Empty as separate elements", () => {
    const manager = createNewRun("empty-slots");
    const html = renderToStaticMarkup(
      <FormationEditor
        slots={manager.state.formationSlots}
        cardInstancesById={new Map()}
        cardDefinitionsById={cardDefinitionsById}
        onSlotClick={() => undefined}
        onRemove={() => undefined}
      />
    );

    expect(html).toContain('<span class="slot-label">Slot 1</span><span class="empty-slot-label">Empty</span>');
    expect(html).not.toContain("Slot 1Empty");
  });

  it("shop choice display uses card name instead of raw id when definition exists", () => {
    const manager = createNewRun("choice-display");
    const choice = manager.state.currentChoices.find((candidate) => candidate.type === "SHOP_CARD");
    if (!choice) {
      throw new Error("Missing shop choice.");
    }

    const display = getChoiceDisplayInfo(choice, cardDefinitionsById);

    expect(display.title).toBe("Rusty Blade");
    expect(display.title).not.toBe("rusty-blade");
    expect(display.meta).toContain("Cooldown 0.75s");
    expect(display.meta).toContain("Price: 0");
  });

  it("reward upgrade display shows tier transition clearly", () => {
    const choice: RunChoice = {
      id: "upgrade",
      type: "REWARD_UPGRADE",
      label: "Upgrade Rusty Blade",
      cardInstanceId: "card-1",
      fromTier: "BRONZE",
      toTier: "SILVER"
    };

    expect(getChoiceDisplayInfo(choice, cardDefinitionsById).meta).toContain("Upgrade tier: BRONZE -> SILVER");
  });
});
