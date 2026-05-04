# Balance Notes

## Content Pack Summary

Phase 13A adds a large MVP content pack without adding engine mechanics:

- 18 general cards in `data/cards/general/`.
- 18 Iron Warlord cards in `data/cards/class_iron_warlord/`.
- 8 modifier-only skills in `data/skills/mvp_skills.json`.
- 8 new normal/elite monster templates.
- 3 boss templates, with `gate-captain-elite` wired as the current final boss.

All content uses only DealDamage, GainArmor, ApplyBurn, ModifyCooldown, Armor, Burn, existing trigger hooks/conditions, and existing ModifierSystem operations.

## Iron Warlord Identity

Iron Warlord should feel like discipline, formation timing, armor-backed aggression, war drums, banners, and burning siege tools. The class fantasy is a commander arranging soldiers, weapons, shields, drums, banners, and siege engines correctly, not a generic warrior swinging harder.

## Archetype Overview

- Blade Tempo: fast Weapon activations and adjacent timing payoffs.
- Burn Engine: frequent Burn application plus triggers when Burn is applied.
- Armor Counter: repeatable Armor with small damage payoffs, avoiding pure stall.
- Drum Command: cooldown modification through adjacent formation puzzles.
- Siege Fire: slower size-2 siege cards with large damage or Burn payoffs.
- Hybrid Bruiser: simple damage, Armor, and Burn cards for stable beginner builds.

## Card Family Overview

- General basic kit: simple weapons, Armor, Burn, and a small drum connector.
- General blade and armor: neutral tempo, defensive anchors, and survivability payoffs.
- General fire support: neutral Burn and siege tools that plug into multiple builds.
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

## Skill Role Table

| Skill | Role | Archetype support | Complexity | Risk note |
| --- | --- | --- | --- | --- |
| Weapon Drill | scaler | Blade Tempo, Hybrid Bruiser | simple | too much burst |
| Fire Study | scaler | Burn Engine, Siege Fire | simple | Burn source tracking currently limits some value |
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
- Armor cards use larger numbers than damage cards because Armor does not end fights.
- Cooldown reduction is adjacency-limited and has long enough cooldowns to avoid self-sustaining loops.
- Size-2 cards should be powerful enough to justify formation space but slow enough to need support.

## Known Risky Combos

- Cinder Seal plus Ember Banner plus multiple Burn applicators could create too much passive pressure.
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
- Tune Burn after source attribution is implemented, because fire skills currently affect direct Fire damage more reliably than Burn ticks.
- Consider explicit size-2 adjacency UI hints before adding more large cards.

## Intentionally Not Implemented Yet

- No new commands, statuses, resources, trigger hooks, trigger conditions, modifier hooks, modifier conditions, or modifier operations.
- No random chance.
- No Barrier, Ward, Energy Shield, absorb layers, Freeze, Haste, Vulnerable, Silence, Mana, Command resource, Spirit, Fate, Heat, morale, or rage.
- No hand, deck, discard, branching map, async PvP, boss-selection system, or final art implementation.
