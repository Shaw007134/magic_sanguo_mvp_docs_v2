# Enchantment Design Notes

Phase 15E adds the content, event, targeting, and persistence foundation for enchantments. It intentionally does not add enchantment combat effects.

## Card Categories

`CardDefinition.type` remains the mechanical card type: `ACTIVE`, `PASSIVE`, `AURA`, `TACTIC`, or `RELIC`.

`CardDefinition.categories` is a separate content-control field for shop pools, merchant filters, future card targeting, and build-shaping effects. Current supported categories are:

```text
WEAPON, ARMOR, TOOL, RELIC, TACTIC, FIRE, POISON, HEAL, COOLDOWN, CONTROL, TERMINAL, ENGINE, DEFENSE, ECONOMY, STARTER, BOSS_REWARD
```

Categories are uppercase data labels. Tags remain lightweight descriptive/source labels used by existing skills and modifiers, such as `fire`.

## Event Probability Rules

Events now use `EventTemplate` data:

- `id`
- `name`
- `minLevel`
- optional `maxLevel`
- `weight`
- `tags`
- `choices`

Event selection is deterministic from run seed, node index, and level. Serialized `currentChoices` remain the source of truth after save/load and must not be regenerated while a choice is pending.

Current rules:

- Starter events use a starter supply template and cannot show enchantment choices.
- Level 1-3 random event pools exclude enchantment-tagged templates.
- Level 7+ random event pools can include enchantment-tagged templates when configured.
- The third non-starter major event can force the Bronze Enchantment Intro template after the early game.
- Choosing an enchantment event requires an eligible owned card target. Invalid targets fail before event EXP or node advancement.

## Planned Enchantment Types

Current definitions are data stubs only:

- `IRON`: weapon or physical-pressure support.
- `VITAL`: broad survival support.
- `FLAME`: fire and Burn build support.
- `VENOM`: Poison build support.
- `SWIFT`: cooldown and tempo support.
- `BINDING`: control support.
- `FROST`: late control payoff support.
- `OBSIDIAN`: high-risk terminal payoff support.

Each `EnchantmentDefinition` has `id`, `name`, `type`, `tier`, `rarity`, `minLevel`, `targetRule`, and `description`.

## Attachment Rules

Phase 15E-B stores one optional attachment on `CardInstance.enchantment`.

Attachment fields:

- `id`
- `enchantmentDefinitionId`
- `sourceEventChoiceId`
- `attachedAtNodeIndex`

Target rules are validated from the selected card definition:

- `ANY_CARD`: any owned card.
- `ANY_ACTIVE_CARD`: any `ACTIVE` card.
- `WEAPON_CARD`, `ARMOR_CARD`, `FIRE_CARD`, `POISON_CARD`, `COOLDOWN_CARD`, `CONTROL_CARD`, and `TERMINAL_CARD`: card must have the matching content category.

Only one enchantment can be attached to a card. Phase 15D reward-card enhancements remain separate in `CardInstance.enhancements`, so a card may have reward-card enhancements and one enchantment at the same time.

Attachments are persisted by save/load and displayed on card views. They do not alter effective card definitions, combat commands, cooldowns, statuses, targeting, replay, or balance report mechanics yet.

## Balance Risks

- Enchantments can multiply already-strong terminal and Armor-terminal builds if future effects are additive with Phase 15D enhancements.
- Cooldown enchantments can become invisible power if activation counts rise without readable replay summaries.
- Control enchantments risk making enemy formations feel inert if Freeze/Slow values stack too easily.
- Obsidian-style terminal payoffs should be introduced only after boss pacing and late-run burst warnings are under control.

## Future Phases

1. Improve targeting UX with eligible-card highlighting and clearer invalid-target messaging.
2. Add replay and summary text for applied enchantments once effects exist.
3. Implement one low-risk enchantment family at a time with balance reports before adding the next family.
4. Keep Obsidian, Freeze, Slow, and Haste enchantment effects deferred until boss and control pacing are stable.
