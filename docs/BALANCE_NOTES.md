# Balance Notes

## Content Pack Summary

Phase 13A adds a large MVP content pack without adding engine mechanics, Phase 13B adds deterministic terminal mechanics for direct DealDamage effects, Phase 14B adds a small controlled Poison/Heal pack, and Phase 14C adds a small Haste/Slow/Freeze control pack:

- 31 general cards in `data/cards/general/`.
- 20 Iron Warlord cards in `data/cards/class_iron_warlord/`.
- 8 modifier-only skills in `data/skills/mvp_skills.json`.
- 8 new normal/elite monster templates.
- 3 boss templates, with `gate-captain-elite` wired as the current final boss.
- Deterministic critical hits for direct DealDamage effects.
- Limited terminal scaling from owner Armor, owner max HP, and target missing HP.
- Tier-aware curated shop, event, and reward pools.
- Persistent Poison and capped HP healing.
- Temporary Haste/Slow/Freeze card-control effects.

All content uses only DealDamage, GainArmor, ApplyBurn, ApplyPoison, HealHP, ModifyCooldown, ApplyHaste, ApplySlow, ApplyFreeze, Armor, Burn, Poison, existing trigger hooks/conditions, and existing ModifierSystem operations. Phase 14C does not add new resources, lifesteal, overheal, absorb layers, cleanse/silence, card movement/destruction, or new status reactions.

## Iron Warlord Identity

Iron Warlord should feel like discipline, formation timing, armor-backed aggression, war drums, banners, and burning siege tools. The class fantasy is a commander arranging soldiers, weapons, shields, drums, banners, and siege engines correctly, not a generic warrior swinging harder.

## Archetype Overview

- Blade Tempo: fast Weapon activations and adjacent timing payoffs.
- Burn Engine: frequent Burn application plus triggers when Burn is applied.
- Poison Inevitable: low immediate pressure that keeps ticking through long fights and Armor-heavy enemies.
- Medic Support: capped HP recovery that buys time without creating overheal or absorb layers.
- Control Tempo: temporary Haste, Slow, and Freeze timing pressure without permanent lockouts.
- Armor Counter: repeatable Armor with small damage payoffs, avoiding pure stall.
- Drum Command: cooldown modification through adjacent formation puzzles.
- Siege Fire: slower size-2 siege cards with large damage or Burn payoffs.
- Hybrid Bruiser: simple damage, Armor, and Burn cards for stable beginner builds.

## Card Family Overview

- General basic kit: simple weapons, Armor, Burn, and a small drum connector.
- General blade and armor: neutral tempo, defensive anchors, and survivability payoffs.
- General fire support: neutral Burn and siege tools that plug into multiple builds.
- General poison and heal: persistent Poison applicators plus conservative HP recovery tools.
- General control: temporary Haste connectors, Slow disruption, and short Freeze effects.
- Iron Warlord blade tempo: disciplined Weapon adjacency and finishers.
- Iron Warlord command armor: drums, banners, and Armor-backed aggression.
- Iron Warlord siege fire: size-2 fire engines and slow siege terminals.

## Card Role Table

| Card | Role | Archetype | Intended phase | Complexity | Risk note |
| --- | --- | --- | --- | --- | --- |
| Militia Spear | starter | Hybrid Bruiser | starter | simple | safe |
| Oil Flask | starter | Burn Engine | starter | simple | safe |
| Iron Guard | defense | Armor Counter | starter | simple | too much Armor stall |
| Patrol Spear | starter | Blade Tempo | early | simple | safe |
| Field Drum | connector | Drum Command | early | medium | infinite cooldown loop risk |
| Guarded Torch | starter | Hybrid Bruiser | early | simple | safe |
| Twin Hook | payoff | Blade Tempo | mid | simple | too much burst |
| Shield Wall | defense | Armor Counter | mid | simple | too much Armor stall |
| Counter Stance | payoff | Armor Counter | mid | medium | unclear trigger readability |
| Veteran Plate | defense | Armor Counter | mid | simple | too much Armor stall |
| Duelist's Dao | terminal | Blade Tempo | late | simple | too much burst |
| Frontline Bulwark | defense | Armor Counter | mid | simple | too much Armor stall |
| Fire Arrow Cart | engine | Burn Engine | mid | simple | safe |
| Ember Banner | engine | Burn Engine | early | medium | unclear trigger readability |
| Cinder Seal | scaler | Burn Engine | late | advanced | infinite cooldown loop risk |
| Siege Crossbow | terminal | Siege Fire | mid | simple | too much burst |
| Rallying Beat | connector | Drum Command | mid | advanced | infinite cooldown loop risk |
| Burning Shield | defense | Hybrid Bruiser | mid | simple | safe |
| Vanguard Saber | starter | Blade Tempo | early | simple | safe |
| Execution Halberd | terminal | Blade Tempo | late | simple | too much burst |
| Left Flank Blade | payoff | Blade Tempo | mid | medium | unclear trigger readability |
| Discipline Drill | connector | Drum Command | mid | advanced | infinite cooldown loop risk |
| Spear and Shield Line | starter | Hybrid Bruiser | early | simple | safe |
| Captain's Finisher | terminal | Blade Tempo | late | advanced | too much burst |
| War Drum | connector | Drum Command | early | medium | infinite cooldown loop risk |
| Command Gong | engine | Drum Command | late | medium | infinite cooldown loop risk |
| Battle Standard | defense | Drum Command | mid | medium | unclear trigger readability |
| Frontline Banner | defense | Hybrid Bruiser | early | simple | safe |
| Guard Captain | payoff | Hybrid Bruiser | mid | simple | safe |
| Signal Tower | engine | Drum Command | late | advanced | infinite cooldown loop risk |
| Kindling Spear | starter | Burn Engine | early | simple | safe |
| Siege Brazier | payoff | Siege Fire | mid | medium | unclear trigger readability |
| Flame Ram | terminal | Siege Fire | late | simple | too much burst |
| Burning Trebuchet | terminal | Siege Fire | boss | simple | too much burst |
| Fire Cart Battery | engine | Siege Fire | late | medium | too much burst |
| Siege Command | connector | Siege Fire | late | advanced | infinite cooldown loop risk |
| Poison Needle | starter | Poison Inevitable | early | simple | too slow if unsupported |
| Venom Jar | engine | Poison Inevitable | mid | simple | too strong in timeout fights |
| Rotting Wine | payoff | Poison Inevitable | late | simple | long-fight inevitability risk |
| Field Medic | defense | Medic Support | early | simple | stall risk |
| Herbal Poultice | defense | Medic Support, Armor Counter | mid | simple | stall risk |
| Toxic Lance | starter | Poison Inevitable, Hybrid Bruiser | early | simple | safe |
| War Chant | connector | Control Tempo, Drum Command | early | simple | Haste tempo risk |
| Mud Trap | connector | Control Tempo | early | simple | Slow stall risk |
| Command Banner | connector | Control Tempo, Drum Command | mid | simple | broad Haste runaway risk |
| Frost Chain | payoff | Control Tempo | mid | simple | Freeze chain lock risk |
| Cold Spear | starter | Control Tempo, Hybrid Bruiser | mid | simple | control plus damage risk |
| Rally Drummer | engine | Control Tempo, Drum Command | mid | simple | Haste plus drum runaway risk |
| Heavy Net | connector | Control Tempo | mid | simple | Slow stall risk |

## Skill Role Table

| Skill | Role | Archetype support | Complexity | Risk note |
| --- | --- | --- | --- | --- |
| Weapon Drill | scaler | Blade Tempo, Hybrid Bruiser | simple | too much burst |
| Fire Study | scaler | Burn Engine, Siege Fire | simple | tag-based direct damage only |
| Lasting Embers | scaler | Burn Engine, Siege Fire | simple | too much Burn pressure |
| Quick Hands | engine | All cooldown builds | simple | infinite cooldown loop risk |
| Shield Craft | defense | Armor Counter | simple | too much Armor stall |
| Drumline Training | engine | Drum Command | simple | infinite cooldown loop risk |
| Siege Engineering | payoff | Siege Fire | simple | too much burst |
| Disciplined Formation | scaler | Blade Tempo | medium | positioning may be easy to miss |

## Monster Build Table

| Monster | Archetype taught | Engine | Payoff | Weakness | Reward lesson |
| --- | --- | --- | --- | --- | --- |
| Bandit Duelist | Blade Tempo | fast weapons | repeated small Physical damage | Armor and burst | Blade Tempo cards |
| Oil Raider | Burn Engine | Burn application plus banner trigger | Burn pressure | fast burst | Burn Engine cards |
| Shield Sergeant | Armor Counter | Armor cycling | survives and chips down | Burn pressure | Armor Counter cards |
| Drum Adept | Drum Command | War Drum adjacency | accelerated attacker | race the engine | Drum cards and Saber |
| Siege Trainee | Siege Fire | slow size-2 weapon | large hits | fast tempo | Siege and drum connectors |
| Banner Guard | Hybrid Bruiser | defensive banner plus captain | stable Armor-backed offense | scaling Burn or terminal | Hybrid/Armor cards |
| Cinder Captain | Burn + Drum | cooldown support into Burn | repeated Burn application | burst or Armor timing | Burn and Drum cards |
| Iron Patrol | Hybrid onboarding | simple blade and shield | readable mixed formation | specialized builds | simple starter cards |

## Boss Notes

- Gate Captain Elite is the wired MVP final boss. It tests Blade Tempo plus Armor-backed Drum Command using 4 slots.
- Siege Marshal is available for future boss rotation. It tests slow Siege Fire pressure supported by a drum and Burn payoff.
- Cinder Strategist is available for future boss rotation. It tests Burn Engine pressure with defensive support.

## Starter And Onboarding Cards

Starter shop currently favors Rusty Blade, Wooden Shield, and Oil Flask when the active registry is available. Starter event cards stay simple and active, preserving the rule that the first two nodes allow at least one active card before the first combat.

Simple onboarding cards include Militia Spear, Oil Flask, Iron Guard, Patrol Spear, Guarded Torch, Vanguard Saber, Spear and Shield Line, Kindling Spear, Frontline Banner, and Guard Captain.

## Early Balance Assumptions

- Burn ignores Armor, so Burn values stay conservative.
- Poison ignores Armor and does not naturally expire, so Poison values and application cadence stay very conservative.
- Heal is capped at max HP and has slow cooldowns so it buys time without resetting every fight.
- Haste is temporary acceleration only: it increases cooldown recovery while active, never instantly reduces current cooldown, and total Haste clamps to +100%.
- Slow is temporary soft disruption only: it reduces cooldown recovery while active, never increases current cooldown directly, and total Slow clamps to 75%.
- Freeze is short, card-targeted hard control only: it prevents cooldown recovery and activation while active, preserves current cooldown progress, and extends to the later expiration when reapplied.
- Haste, Slow, and Freeze never change Burn or Poison tick intervals, DOT durations, or status clocks.
- Armor cards use larger numbers than damage cards because Armor does not end fights.
- Cooldown reduction is adjacency-limited and has long enough cooldowns to avoid self-sustaining loops.
- Size-2 cards should be powerful enough to justify formation space but slow enough to need support.
- Current fire support is tag-based. Fire Study checks `sourceHasTag: "fire"` and boosts direct damage from fire-tagged cards. DealDamage now supports explicit DIRECT, PHYSICAL, and FIRE damage types, but current Fire Study tuning has not migrated to damageType-based support.
- Burn tick damage is attributed to the applying card in replay/summary when source data exists, but fire-tagged skill support still does not increase Burn tick damage.

## Known Risky Combos

- Cinder Seal plus Ember Banner plus multiple Burn applicators could create too much passive pressure.
- Multiple Poison applicators plus healing could push fights toward timeout if Poison values are raised too quickly.
- Poison plus Heal plus Slow can create stall pressure if Slow uptime or Heal values are raised too quickly.
- Freeze chains can become hard locks if Freeze duration approaches the source card cooldown.
- Haste plus Rally Drummer/War Drum/Command Gong can become cooldown runaway if broad Haste values are pushed above modest tuning.
- Herbal Poultice plus high Armor density could increase stall risk.
- Quick Hands plus War Drum plus Command Gong could over-accelerate large cards.
- Shield Craft plus Shield Wall plus Veteran Plate could push fights toward timeout.
- Siege Engineering plus Burning Trebuchet may make boss-scale siege cards too bursty after upgrades.

## Known Readability Risks

- Size-2 adjacency is based on the card's starting slot, not the visual footprint.
- Passive trigger summaries are readable, but players may still need to learn that adjacent ally means formation adjacency.
- Cinder Seal's extra Burn application is legal but may read like a loop; internal cooldown is required to keep it controlled.
- Drum cards modify cooldowns in seconds, but the payoff is easier to feel in replay than in static text.

## Future Tuning Notes

- Add monster rotation once the run supports it cleanly.
- Consider better enemy preview grouping by archetype after UI scope expands.
- Tune Burn after several attributed Burn runs, because summaries can now separate direct damage from Burn damage by applying card.
- Tune Poison only after long-fight playtests; its damage should feel inevitable, not explosive.
- Watch Heal cards in Armor builds to avoid immortal stall loops.
- Keep Freeze short, low-damage, and attached to longer cooldowns.
- Keep broad Haste modest; position-limited Haste can be a little stronger than OWNER_ALL_CARDS Haste.
- Keep Slow clamped and avoid permanent uptime on early cards.
- Do not haste DOT ticks. Burn and Poison should remain one-second clocks regardless of control effects.
- Revisit damageType-based fire support later now that DealDamage supports explicit damageType and Burn source attribution exists.
- Consider explicit size-2 adjacency UI hints before adding more large cards.

## Phase 13B Terminal Mechanics

Critical hits are deterministic and apply only to direct DealDamage effects. A card may define `critChancePercent` from 0 to 100 and `critMultiplier` of at least 1. The combat seed/state, tick, card instance, activation count, source definition, and trigger depth determine the crit roll, so identical combat input produces identical results. Crits do not apply to Burn ticks.

Terminal scaling is limited to direct DealDamage:

- OWNER_ARMOR_PERCENT: damage based on the owner's current Armor.
- OWNER_MAX_HP_PERCENT: damage based on the owner's max HP.
- TARGET_MISSING_HP_PERCENT: damage based on the enemy's missing HP.

Conditional multipliers are limited to `targetHpBelowPercent` plus `multiplier`. Scaling damage is rounded to an integer, remains direct damage, and is still reduced by Armor. Phase 13B does not consume Armor for scaling attacks.

Current fire support is tag-based, not damageType-based. Fire Study checks `sourceHasTag: "fire"` and boosts direct damage from fire-tagged cards. Burn tick damage is attributed for replay/summary readability, but it is not boosted by Fire Study or other card-source damage modifiers yet.

## Phase 14A Damage Type And Attribution

DealDamage effects may explicitly declare `damageType: "DIRECT"`, `"PHYSICAL"`, `"FIRE"`, or `"POISON"`. Omitted damageType preserves the previous DIRECT behavior. DIRECT, PHYSICAL, FIRE, and POISON card-hit damage are reduced by Armor unless a command explicitly sets `ignoresArmor`; DOT ticks keep the MVP rule and ignore Armor.

ApplyBurn stores source attribution on the merged Burn runtime state: source combatant id, source card instance id when available, and source card definition id when available. Combat behavior still uses one merged total Burn amount/duration, while replay and CombatResultSummary use per-source buckets to show Burn damage by applying card.

## Phase 14B Poison And Heal

Poison is persistent inevitability, not green Burn. ApplyPoison amount 1 means the target takes 1 Poison damage every 1 second until combat ends. Poison stacks additively, ticks every 60 logic ticks, uses POISON damage type, ignores Armor by MVP DOT rule, and has no natural decay or expiration in Phase 14B.

HealHP restores HP to the source combatant by default, caps at max HP, and cannot overheal. It never creates Armor, Barrier, Ward, Energy Shield, or absorb layers. Healing appears in replay and CombatResultSummary as healing by card.

## Phase 14C Haste, Slow, And Freeze

Haste is temporary acceleration. It increases card cooldown recovery while active using `baseRecovery * (1 + hastePercent - slowPercent)` after existing cooldown recovery modifiers. It does not instantly reduce current cooldown. Multiple Haste effects stack additively and clamp to +100%.

Slow is temporary soft disruption. It reduces card cooldown recovery while active, does not directly add cooldown, and clamps total Slow to 75%, leaving a minimum 25% recovery rate.

Freeze is short, card-targeted hard control. Frozen cards do not recover cooldown and cannot activate while frozen, including ready cards frozen earlier in the same tick by side priority. Freeze does not remove cooldown progress or reset cooldown. Reapplying Freeze extends to the later expiration rather than creating duplicate Freeze states.

DOT safety rule: Haste, Slow, and Freeze affect card cooldown recovery and activation only. They do not speed up, delay, pause, or extend Burn/Poison ticks or durations. Burn and Poison remain one-second clocks.

Phase 14C target support is intentionally small:

- Haste: SELF, ADJACENT_ALLY, OWNER_ALL_CARDS.
- Slow: SELF, OPPOSITE_ENEMY_CARD, ENEMY_LEFTMOST_ACTIVE.
- Freeze: OPPOSITE_ENEMY_CARD, ENEMY_LEFTMOST_ACTIVE.

## Iron Warlord Terminal/Core Cards

| Terminal | Mechanic | Support cards | Weakness |
| --- | --- | --- | --- |
| Iron Bastion Strike | Size-2 Armor terminal; deals flat damage plus 100% of current Armor | Iron Guard, Shield Wall, Veteran Plate, Battle Standard | Slow 5s cooldown and needs Armor before it fires |
| Warlord's Mandate | Max HP body terminal; deals 20% of max HP and can crit | Frontline Banner, Guard Captain, Burning Shield, Spear and Shield Line | Slow 6s cooldown and needs HP/survivability growth |
| Execution Halberd | Size-2 crit execution terminal; crits and doubles below 35% enemy HP | Vanguard Saber, Left Flank Blade, War Drum, Duelist's Dao | Needs chip damage first and uses 2 slots |
| Burning Trebuchet | Size-2 Siege Fire terminal; missing-HP scaling, Burn, and crit | War Drum, Command Gong, Siege Command, Fire Arrow Cart, Oil Flask | Very slow without drum acceleration |

Build-vital Bronze/Silver cards that should remain useful even late include Rusty Blade, Wooden Shield, Oil Flask, Iron Guard, Field Drum, Ember Banner, Shield Wall, Fire Arrow Cart, War Drum, and Battle Standard. These cards are included in curated support pools so late rewards can still offer enablers, duplicates, and connectors instead of only high-tier raw power.

## Tier And Quality Progression

Tier controls baseline reward excitement; mechanism controls build identity. Bronze and Silver cards are allowed to remain valuable when they are starters, connectors, trigger enablers, upgrade targets, or monster-relevant rewards.

- Level 1-2: early pools are mostly Bronze/Silver, with no Jade/Celestial cards.
- Level 3-4: mid pools begin introducing Silver/Gold with Bronze support still present.
- Level 5-7: mid rewards more often contain engines, payoffs, and terminals; rare Jade cards can appear through pool composition.
- Level 8-10: late pools contain Gold/Jade terminal options plus build-vital Bronze/Silver support and duplicates.
- Boss/late contexts bias toward terminal, payoff, and strong support cards without guaranteeing a perfect build.

Quality progression is role-aware. Higher-level rewards should have more engine, payoff, terminal, and build-completion options than level 1 rewards, while early rewards remain onboarding-safe.

## Curated Pools

Pool definitions live in `src/content/cards/contentPools.ts` near the active card registry. They are intentionally TypeScript arrays rather than a risky JSON schema expansion.

- Starter shop: Rusty Blade, Wooden Shield, Oil Flask.
- Starter event: simple active cards including Rusty Blade, Wooden Shield, Oil Flask, Iron Guard, and Militia Spear.
- Early shop/reward: Bronze/Silver starter, defense, Burn, Poison, Heal, simple Haste/Slow, and connector cards.
- Mid shop/reward: early cards plus stronger engines, payoffs, Poison/Heal support, control cards, and size-2 build-around cards.
- Late shop/reward: mid cards plus Iron Warlord terminals, strong drum/siege engines, and build-vital support.
- Terminal pool: Execution Halberd, Captain's Finisher, Iron Bastion Strike, Warlord's Mandate, Flame Ram, Burning Trebuchet, Siege Crossbow.
- Build-vital support pool: low/mid-tier enablers that keep builds coherent.
- Boss reward pool: terminal and late support cards for future boss reward tuning.
- Skill reward pool: the 8 MVP modifier-only skills.

Archetype pools are defined for Blade Tempo, Burn Engine, Poison Inevitable, Medic Support, Control Tempo, Armor Counter, Drum Command, Siege Fire, Hybrid Bruiser, Armor Terminal, and Crit Execution. Monster reward generation prioritizes monster-used cards, then monster rewardPool cards, then curated/archetype-like fallbacks, support cards, terminals when level-appropriate, and finally skill/gold fallback.

## Monster Scaling Model

Monster difficulty now scales by build completeness as well as existing HP/Armor values. Early monsters use required identity cards and only a small number of optional cards. Mid monsters can add an engine plus payoff. Elites can add more support/defense and closer-to-complete formations. Bosses remain fixed, readable tests of one or two archetypes.

Optional-card count is capped in `MonsterGenerator`: tutorial monsters add no optional cards, early normal monsters add fewer optional cards, later normal monsters add more, and elites can be closer to complete builds. Fixed bosses still use their authored formations.

## Boss Tuning Notes

- Gate Captain Elite remains the wired final boss and tests Blade Tempo plus Armor-backed Drum support.
- Siege Marshal now has a stronger future-facing Siege Fire terminal template through Burning Trebuchet scaling.
- Cinder Strategist remains a Burn Engine pressure boss for future rotation.
- Bosses should be readable and beatable by a reasonable terminal/core build, not require perfect reward RNG.

## Known Underpowered Cards

- Training Staff remains intentionally plain as legacy onboarding content.
- Patrol Spear and Militia Spear are simple early cards and may need upgrade tuning if they fall off too quickly.
- Some passive payoffs are harder to feel without richer replay grouping.

## Current Limitations

- No affixes or random stat rolls.
- No general rarity system beyond current tier fields and curated pool weighting.
- Burn/Poison source attribution is replay/summary-only; it does not add Burn decay, status reactions, or DOT damage modifiers.
- Haste/Slow/Freeze are cooldown/activation control only; there are no status reaction payoffs, cleanse/silence, card movement, card destruction, or final control UI treatments.
- No boss rotation unless implemented later.
- No branching map, async PvP, cloud save/account system, or final art/Pixi/Phaser.

## Intentionally Not Implemented Yet

- No new resources, trigger hooks, trigger conditions, modifier hooks, modifier conditions, or modifier operations beyond the explicit Phase 14B ApplyPoison/HealHP and Phase 14C ApplyHaste/ApplySlow/ApplyFreeze command additions.
- No non-deterministic random chance.
- No Barrier, Ward, Energy Shield, absorb layers, Vulnerable, Silence, Cleanse, MoveCard, DisableCard, card destruction, Mana, Command resource, Spirit, Fate, Heat, morale, or rage.
- No hand, deck, discard, branching map, async PvP, boss-selection system, or final art implementation.
