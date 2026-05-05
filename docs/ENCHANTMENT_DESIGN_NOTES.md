# Enchantment Design Notes

Phase 15E adds the content, event, targeting, persistence, and first bounded Bronze combat effects for enchantments. Higher-tier enchantment effects remain deferred.

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

- `IRON`: weapon or physical-pressure support.
- `VITAL`: broad survival support.
- `FLAME`: fire and Burn build support.
- `VENOM`: Poison build support.
- `SWIFT`: cooldown and tempo support.
- `BINDING`: control support.
- `FROST`: late control payoff support.
- `OBSIDIAN`: high-risk terminal payoff support.

Each `EnchantmentDefinition` has `id`, `name`, `type`, `tier`, `rarity`, `minLevel`, `targetRule`, and `description`.

## Bronze Combat Effects

Phase 15E-C implements only three Bronze effects through effective card definitions, before combat starts:

- Bronze `IRON`: eligible active damage or heal cards gain a small Armor command on activation.
- Bronze `FLAME`: eligible active Burn cards gain a small Burn amount bonus.
- Bronze `VITAL`: eligible active Heal cards gain a small Heal amount bonus.

Current magnitude is intentionally small:

```text
Iron: +1 Armor
Flame: +1 Burn
Vital: +1 Heal
```

These effects are deterministic, persisted through the attachment, and applied in the same pre-combat effective-definition layer as card tiers and Phase 15D reward-card enhancements. Reward-card enhancements remain separate and additive. For example, a Burn reward enhancement and Bronze Flame can both increase the same active Burn effect.

Not implemented yet:

- `VENOM`, `SWIFT`, `BINDING`, `FROST`, and `OBSIDIAN` combat effects.
- Obsidian damage doubling.
- Freeze, Slow, or Haste enchantment effects.
- Any new resource, absorb layer, or mid-combat choice.

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

Attachments are persisted by save/load and displayed on card views. Bronze Iron, Flame, and Vital may alter effective card definitions as described above. Other enchantments remain display/persistence only.

## UI Display

When an enchantment event is available, cards eligible for any shown enchantment are highlighted as eligible targets. Card views show attached enchantments with a concise effect preview, such as `Enchanted: Iron Edge (Bronze Iron) · +1 Armor`.

## Balance Risks

- Enchantments can multiply already-strong terminal and Armor-terminal builds if future effects are larger than the current +1 Bronze bonuses.
- Cooldown enchantments can become invisible power if activation counts rise without readable replay summaries.
- Control enchantments risk making enemy formations feel inert if Freeze/Slow values stack too easily.
- Obsidian-style terminal payoffs should be introduced only after boss pacing and late-run burst warnings are under control.

## Future Phases

1. Add richer per-choice target previews so the player sees which exact enchantment each highlighted card can receive.
2. Add replay and summary attribution text for enchantment-derived effects if readability needs it.
3. Implement one additional low-risk enchantment family at a time with balance reports before adding the next family.
4. Keep Obsidian, Freeze, Slow, and Haste enchantment effects deferred until boss and control pacing are stable.
