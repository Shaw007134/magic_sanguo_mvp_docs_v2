import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getMonsterCardDefinitionsById } from "../../src/content/cards/monsterCards.js";
import { createNewRun } from "../../src/run/RunManager.js";
import type { RunChoice } from "../../src/run/RunState.js";
import { CardView } from "../../src/ui/components/CardView.js";
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

  it("event card display uses full card detail instead of a terse card label", () => {
    const display = getChoiceDisplayInfo(
      {
        id: "event-card",
        type: "EVENT_CARD",
        label: "Take a Flame Spear",
        cardDefinitionId: "flame-spear"
      },
      cardDefinitionsById
    );

    expect(display.title).toBe("Flame Spear");
    expect(display.meta).toEqual(expect.arrayContaining(["Active", "Bronze", "Size 1", "Cooldown 1.25s"]));
    expect(display.meta).not.toContain("Card: Flame Spear");
    expect(display.summary).toContain("Burn: 2 damage/sec for 2s");
  });

  it("card metadata cooldown display uses seconds instead of raw ticks", () => {
    const card = { instanceId: "rusty", definitionId: "rusty-blade" };
    const definition = cardDefinitionsById.get("rusty-blade");
    if (!definition) {
      throw new Error("Missing rusty-blade.");
    }
    const html = renderToStaticMarkup(<CardView card={card} definition={definition} />);

    expect(html).toContain("0.75s");
    expect(html).not.toContain("45t");
    expect(html).not.toMatch(/tick/i);
  });

  it("upgraded card display keeps base name as primary title", () => {
    const definition = cardDefinitionsById.get("rusty-blade");
    if (!definition) {
      throw new Error("Missing rusty-blade.");
    }
    const html = renderToStaticMarkup(
      <CardView card={{ instanceId: "rusty", definitionId: "rusty-blade", tierOverride: "SILVER" }} definition={definition} />
    );

    expect(html).toContain("Rusty Blade");
    expect(html).not.toContain("Rusty Blade (SILVER)");
    expect(html).toContain("Silver");
  });

  it("reward upgrade display shows tier transition clearly", () => {
    const choice: RunChoice = {
      id: "upgrade",
      type: "REWARD_UPGRADE",
      label: "Upgrade Rusty Blade",
      cardInstanceId: "card-1",
      fromTier: "BRONZE",
      toTier: "SILVER",
      preview: "Damage 2 -> 3, Cooldown 0.75s -> 0.75s"
    };

    const display = getChoiceDisplayInfo(choice, cardDefinitionsById);
    expect(display.meta).toContain("Upgrade tier: BRONZE -> SILVER");
    expect(display.summary).toBe("Damage 2 -> 3, Cooldown 0.75s -> 0.75s");
  });
});
