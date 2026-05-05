import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getMonsterCardDefinitionsById } from "../../src/content/cards/monsterCards.js";
import { getActiveCardDefinitionsById } from "../../src/content/cards/activeCards.js";
import { createNewRun } from "../../src/run/RunManager.js";
import type { RunChoice } from "../../src/run/RunState.js";
import { createEventChoices } from "../../src/run/nodes/EventNode.js";
import { getEnchantmentEligibleCardIds, NodeActions } from "../../src/ui/App.js";
import { CardView } from "../../src/ui/components/CardView.js";
import { ChestPanel } from "../../src/ui/components/ChestPanel.js";
import { FormationEditor } from "../../src/ui/components/FormationEditor.js";
import { RunStatusBar } from "../../src/ui/components/RunStatusBar.js";
import { SkillPanel } from "../../src/ui/components/SkillPanel.js";
import { getChoiceDisplayInfo } from "../../src/ui/presentation/choiceDisplay.js";

const cardDefinitionsById = getMonsterCardDefinitionsById();
const activeCardsById = getActiveCardDefinitionsById();

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
    expect(display.summary).toContain("Burn: 2 per second for 2s (decays by 1/sec)");
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

  it("enhanced card display shows readable enhancement summary", () => {
    const definition = cardDefinitionsById.get("flame-spear");
    if (!definition) {
      throw new Error("Missing flame-spear.");
    }
    const html = renderToStaticMarkup(
      <CardView
        card={{
          instanceId: "flame",
          definitionId: "flame-spear",
          enhancements: [{
            id: "enh",
            sourceRewardCardDefinitionId: "ember-powder",
            type: "INCREASE_BURN",
            amount: 1
          }]
        }}
        definition={definition}
      />
    );

    expect(html).toContain("+1 Burn from Ember Powder");
    expect(html).not.toMatch(/tick|OnStatus|OnBurn|hook/i);
  });

  it("enchantment event targeting highlights eligible cards and shows attached enchantments", () => {
    const choices = createEventChoices({
      seed: "ui-enchantment-highlight",
      nodeIndex: 25,
      level: 7,
      cardDefinitionsById: activeCardsById
    });
    const ownedCards = [
      { instanceId: "blade", definitionId: "rusty-blade" },
      { instanceId: "oil", definitionId: "oil-flask" },
      { instanceId: "medic", definitionId: "field-medic" },
      { instanceId: "shield", definitionId: "wooden-shield" }
    ];
    const eligible = getEnchantmentEligibleCardIds({ currentChoices: choices, ownedCards }, activeCardsById);

    expect([...eligible].sort()).toEqual(["blade", "medic", "oil"]);

    const html = renderToStaticMarkup(
      <FormationEditor
        slots={[
          { slotIndex: 1, cardInstanceId: "blade" },
          { slotIndex: 2, cardInstanceId: "shield" }
        ]}
        cardInstancesById={new Map(ownedCards.map((card) => [card.instanceId, card]))}
        cardDefinitionsById={activeCardsById}
        enchantmentEligibleCardIds={eligible}
        onSlotClick={() => undefined}
        onRemove={() => undefined}
      />
    );

    expect(html).toContain("enchantment-eligible");
    expect(html).toContain("Eligible enchantment target");
    expect(html).toContain("Rusty Blade");
    expect(html).toContain("Wooden Shield");
  });

  it("attached enchantment card display is readable", () => {
    const definition = activeCardsById.get("rusty-blade")!;
    const html = renderToStaticMarkup(
      <CardView
        card={{
          instanceId: "blade",
          definitionId: "rusty-blade",
          enchantment: {
            id: "iron",
            enchantmentDefinitionId: "bronze-iron-edge",
            sourceEventChoiceId: "event-25-enchantment-0",
            attachedAtNodeIndex: 25
          }
        }}
        definition={definition}
      />
    );

    expect(html).toContain("Enchanted: Iron Edge");
    expect(html).toContain("+1 Armor");
    expect(html).toContain("enchanted");
  });

  it("level-up choices render directly without an extra post-battle continue prompt", () => {
    const manager = createNewRun("level-choice-direct");
    manager.gainExp(10, "test");
    const html = renderToStaticMarkup(
      <NodeActions
        state={manager.state}
        cardDefinitionsById={activeCardsById}
        onChoice={() => undefined}
        onStartBattle={() => undefined}
        onLeaveShop={() => undefined}
        onContinue={() => undefined}
      />
    );

    expect(html).toContain("Level Up!");
    expect(html).toContain("Choose one reward");
    expect(html).not.toContain("Review the battle summary");
  });

  it("learned skills render in a run status panel, not as chest or loot cards", () => {
    const html = renderToStaticMarkup(
      <SkillPanel skills={[{ instanceId: "skill-1", definitionId: "quick-hands" }]} />
    );

    expect(html).toContain("Run Status");
    expect(html).toContain("Learned Skills");
    expect(html).toContain("Quick Hands");
    expect(html).toContain("All your cards recharge twice as fast.");
    expect(html).not.toContain("Reward / Loot");
    expect(html).not.toContain("Chest");
  });

  it("chest panel consolidates loot cards and omits an empty reward section", () => {
    const baseProps = {
      cards: [],
      selectedCardId: undefined,
      enchantmentEligibleCardIds: new Set<string>(),
      cardDefinitionsById: activeCardsById,
      formationSlotCount: 4,
      chestCapacity: 16,
      ownedCardCount: 0,
      onCardClick: () => undefined,
      onSell: () => undefined
    };

    const empty = renderToStaticMarkup(<ChestPanel {...baseProps} />);
    const withLoot = renderToStaticMarkup(
      <ChestPanel
        {...baseProps}
        rewardCards={[{ instanceId: "loot", definitionId: "ember-powder" }]}
        ownedCards={[{ instanceId: "oil", definitionId: "oil-flask" }]}
        formationSlots={[{ slotIndex: 1, cardInstanceId: "oil" }]}
        onSellRewardCard={() => undefined}
      />
    );

    expect(empty).toContain("Chest");
    expect(empty).not.toContain("Reward / Loot");
    expect(empty).not.toContain("Loot Cards");
    expect(withLoot).toContain("Loot Cards");
    expect(withLoot).toContain("Ember Powder");
    expect(withLoot).not.toContain("Reward / Loot");
  });

  it("reward loot choice display uses loot name and sell effect", () => {
    const choice: RunChoice = {
      id: "loot",
      type: "REWARD_LOOT_CARD",
      label: "Take Ember Powder",
      rewardCardDefinitionId: "ember-powder",
      preview: "Sell: gain 1 gold and give the leftmost active Burn card +1 Burn."
    };

    const display = getChoiceDisplayInfo(choice, cardDefinitionsById);

    expect(display.title).toBe("Ember Powder");
    expect(display.subtitle).toBe("Loot reward");
    expect(display.meta).toContain("Sell: 1 gold");
    expect(display.summary).toContain("+1 Burn");
  });

  it("enchantment choice display hides internal target categories", () => {
    const display = getChoiceDisplayInfo(
      {
        id: "swift",
        type: "EVENT_ENCHANTMENT",
        label: "Study Swift",
        enchantmentDefinitionId: "bronze-swift-rhythm",
        targetRule: "COOLDOWN_CARD",
        description: "Choose a tempo enchantment."
      },
      activeCardsById
    );

    expect(display.meta).toContain("Eligible card");
    expect(display.meta.join(" ")).not.toMatch(/COOLDOWN|Cooldown|ENGINE|TERMINAL|CONTROL/);
  });

  it("reward upgrade display shows tier transition clearly", () => {
    const choice: RunChoice = {
      id: "upgrade",
      type: "REWARD_UPGRADE",
      label: "Upgrade Rusty Blade",
      cardInstanceId: "card-1",
      fromTier: "BRONZE",
      toTier: "SILVER",
      preview: "Damage 2 -> 3"
    };

    const display = getChoiceDisplayInfo(choice, cardDefinitionsById);
    expect(display.meta).toContain("Upgrade tier: BRONZE -> SILVER");
    expect(display.summary).toBe("Damage 2 -> 3");
  });
});
