# Balance Notes

## Content Pack Summary

Phase 13A adds a large MVP content pack without adding engine mechanics, Phase 13B adds deterministic terminal mechanics for direct DealDamage effects, Phase 14B adds a small controlled Poison/Heal pack, Phase 14C adds a small Haste/Slow/Freeze control pack, Phase 14D adds a small status reaction pack, Phase 14E gives Burn its decay identity, and Phase 15A expands the build surface plus deterministic balance reports without adding new mechanics:

- 51 general cards in `data/cards/general/`.
- 30 Iron Warlord cards in `data/cards/class_iron_warlord/`.
- 8 modifier-only skills in `data/skills/mvp_skills.json`.
- 8 new normal/elite monster templates.
- 3 boss templates, with `gate-captain-elite` wired as the current final boss.
- Level-based player formation growth from 4 slots to 16 slots by level 10.
- Fixed run card capacity of 16 owned cards.
- Actual run battles and balance report simulations share `RUN_MAX_COMBAT_TICKS = 3600`.
- Save format version 2 is required after the fixed chest capacity change; version 1 local saves are intentionally unsupported until a migration is added.
- Deterministic critical hits for direct DealDamage effects.
- Limited terminal scaling from owner Armor, owner max HP, and target missing HP.
- Tier-aware curated shop, event, and reward pools.
- Persistent Poison and capped HP healing.
- Temporary Haste/Slow/Freeze card-control effects.
- Deterministic status reaction triggers for status damage and real healing.
- Burn as burst DOT that loses 1 Burn after each Burn damage event.
- `pnpm balance:report` writes deterministic JSON/Markdown reports under `debug/balance-reports/`.

All content uses only DealDamage, GainArmor, ApplyBurn, ApplyPoison, HealHP, ModifyCooldown, ApplyHaste, ApplySlow, ApplyFreeze, Armor, Burn, Poison, existing trigger hooks/conditions, and existing ModifierSystem operations. Phase 14E does not add new resources, lifesteal keywords, overheal, absorb layers, cleanse/silence, card movement/destruction, control payoff conditions, or new statuses.

## Iron Warlord Identity

Iron Warlord should feel like discipline, formation timing, armor-backed aggression, war drums, banners, and burning siege tools. The class fantasy is a commander arranging soldiers, weapons, shields, drums, banners, and siege engines correctly, not a generic warrior swinging harder.

## Archetype Overview

- Blade Tempo: fast Weapon activations and adjacent timing payoffs.
- Burn Engine: frequent Burn application, short-term pressure, and triggers when Burn is applied or deals damage.
- Poison Inevitable: low immediate pressure that keeps ticking through long fights and Armor-heavy enemies.
- Medic Support: capped HP recovery that buys time without creating overheal or absorb layers.
- Control Tempo: temporary Haste, Slow, and Freeze timing pressure without permanent lockouts.
- Status Reaction: small deterministic bridges between Burn, Poison, Heal, Armor, and card-control timing.
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
- General reactions: passive status combo connectors with explicit internal cooldowns.
- General Phase 15A combo tools: low-frequency enablers, Burn/Poison bridges, Heal/Armor bridges, and neutral terminals for report fixtures.
- Iron Warlord blade tempo: disciplined Weapon adjacency and finishers.
- Iron Warlord command armor: drums, banners, and Armor-backed aggression.
- Iron Warlord siege fire: size-2 fire engines and slow siege terminals.
- Iron Warlord Phase 15A archetypes: crit execution, cooldown engines, siege/burn bridges, Armor terminals, and late payoff cards.

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
| Venom Leech | connector | Poison Inevitable, Medic Support, Status Reaction | early | simple | Poison plus Heal loop risk |
| Toxic Flame Seal | payoff | Burn Engine, Poison Inevitable, Status Reaction | mid | medium | hybrid DOT burst risk |
| Fever Drum | engine | Burn Engine, Drum Command, Status Reaction | mid | medium | Burn tick plus Haste runaway risk |
| Field Triage | defense | Medic Support, Armor Counter, Status Reaction | early | simple | Heal plus Armor stall risk |
| Poisoned Net | connector | Poison Inevitable, Control Tempo, Status Reaction | mid | medium | Poison plus Slow stall risk |
| Burning Remedy | payoff | Medic Support, Burn Engine, Poison Inevitable, Status Reaction | mid | medium | HealReceived recursive loop risk |

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

- Burn ignores Armor and decays by 1 after each Burn damage event, so Burn should feel like burst pressure rather than long-term inevitability.
- Poison ignores Armor and does not naturally expire, so Poison values and application cadence stay very conservative.
- Heal is capped at max HP and has slow cooldowns so it buys time without resetting every fight.
- Haste is temporary acceleration only: it increases cooldown recovery while active, never instantly reduces current cooldown, and total Haste clamps to +100%.
- Slow is temporary soft disruption only: it reduces cooldown recovery while active, never increases current cooldown directly, and total Slow clamps to 75%.
- Freeze is short, card-targeted hard control only: it prevents cooldown recovery and activation while active, preserves current cooldown progress, and extends to the later expiration when reapplied.
- Haste, Slow, and Freeze never change Burn or Poison tick intervals, DOT durations, or status clocks.
- Status reactions never change Burn or Poison base tick intervals; reaction-created statuses start from their own normal one-second DOT clocks.
- Reaction hooks fire from actual DOT damage events only. Burn decay and Burn expiration do not fire extra status reactions.
- OnHealReceived reactions fire only for real HP restored and should always have explicit internal cooldowns in content.
- Passive control reactions can target active runtime cards only; passive cards can anchor adjacent/opposite targeting but cannot be Hasted, Slowed, or Frozen.
- Armor cards use larger numbers than damage cards because Armor does not end fights.
- Cooldown reduction is adjacency-limited and has long enough cooldowns to avoid self-sustaining loops.
- Size-2 cards should be powerful enough to justify formation space but slow enough to need support.
- Current fire support is tag-based. Fire Study checks `sourceHasTag: "fire"` and boosts direct damage from fire-tagged cards. DealDamage now supports explicit DIRECT, PHYSICAL, and FIRE damage types, but current Fire Study tuning has not migrated to damageType-based support.
- Burn tick damage is attributed to the applying card in replay/summary when source data exists, but fire-tagged skill support still does not increase Burn tick damage.
- Burn source contribution buckets decay with Burn amount: after each Burn damage event, reduce the largest source bucket by 1, tie-breaking by source combatant id, source card instance id, then source card definition id. Buckets at 0 are removed.

## Known Risky Combos

- Cinder Seal plus Ember Banner plus multiple Burn applicators could create too much passive pressure.
- Burn decay reduces long-tail pressure, but repeated Burn applicators can still produce high short-term spikes when stacked before the next damage event.
- Multiple Poison applicators plus healing could push fights toward timeout if Poison values are raised too quickly.
- Poison plus Heal plus Slow can create stall pressure if Slow uptime or Heal values are raised too quickly.
- Freeze chains can become hard locks if Freeze duration approaches the source card cooldown.
- Haste plus Rally Drummer/War Drum/Command Gong can become cooldown runaway if broad Haste values are pushed above modest tuning.
- Venom Leech plus Poison density plus Field Medic can create Poison + Heal loop pressure if healing or internal cooldowns are loosened.
- Fever Drum plus frequent Burn can become Burn damage + Haste runaway if adjacent haste values are raised.
- Poisoned Net plus persistent Poison can become Poison + Slow stall if Slow duration approaches its internal cooldown.
- Burning Remedy-like HealReceived effects can recurse if they create healing; Phase 14D content avoids recursive HealHP on OnHealReceived.
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
- Tune Burn after several decay-era Burn runs. Phase 14E only raised a few amount-1 Burn applications to amount 2 so they still read as meaningful after decay.
- Tune Poison only after long-fight playtests; its damage should feel inevitable, not explosive.
- Watch Heal cards in Armor builds to avoid immortal stall loops.
- Keep Freeze short, low-damage, and attached to longer cooldowns.
- Keep broad Haste modest; position-limited Haste can be a little stronger than OWNER_ALL_CARDS Haste.
- Keep Slow clamped and avoid permanent uptime on early cards.
- Do not haste DOT clocks. Burn and Poison should remain one-second clocks regardless of control effects.
- Keep reaction cards as connectors/payoffs rather than mandatory engines; every passive reaction should carry internalCooldownTicks and maxTriggersPerTick.
- Avoid adding control-status payoff conditions until the control kit has more playtest data.
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

## Phase 14D Status Reactions

Phase 14D adds only two new reaction hooks: OnStatusTicked and OnHealReceived. OnStatusTicked fires when Burn or Poison deals DOT damage. OnHealReceived fires only when HealHP restores more than 0 HP. Both hooks create existing CombatCommand objects through the existing ResolutionStack and inherit internal cooldown, maxTriggersPerTick, deterministic ordering, triggerDepth, and stack safety.

Status combo identity:

- Poison plus Heal buys time through small capped recovery, not lifesteal or overheal.
- Burn plus Poison creates hybrid pressure through tiny bonus direct Fire damage.
- Burn plus Haste turns status pressure into tempo, but only through active-card cooldown recovery.
- Heal plus Armor rewards survival builds without adding absorb layers.
- Poison plus Slow is intentionally modest because persistent DOT plus control is a stall risk.

Reaction safety rules:

- Reaction triggers do not change Burn or Poison tick intervals.
- Reaction-created Burn or Poison uses the same one-second DOT clock as normal.
- Reaction-created Haste, Slow, and Freeze still target active runtime cards only.
- Passive cards may own reaction triggers and anchor adjacent/opposite target lookup, but passive cards cannot be Hasted, Slowed, or Frozen.
- SELF Haste/Slow/Freeze from a passive source resolves to no active target.
- Every Phase 14D passive reaction card has internalCooldownTicks and maxTriggersPerTick.

OnStatusTicked is the preferred future hook for DOT reaction content. OnBurnTick remains accepted by TriggerDefinition and TriggerSystem only as legacy Burn-only compatibility; active runtime content should not use it.

Deferred systems include control-status payoff conditions such as "enemy card is Frozen", cleanse/silence, card movement/destruction, passive-card control behavior, new resources, and new statuses.

## Phase 14E Burn Decay Identity

Burn is burst DOT. It ticks every 60 logic ticks, deals the current Burn amount as FIRE damage, ignores Armor by the MVP DOT rule, then loses 1 Burn. Burn expires when its amount reaches 0 or when its expiresAtTick max lifetime is reached. Duration remains a max lifetime rather than a promise that every Burn will last for that many seconds.

Poison is persistent DOT. It ticks every 60 logic ticks, uses POISON damage, ignores Armor, stacks additively, and does not decay. This keeps Poison as long-fight inevitability while Burn stays high short-term pressure.

Burn stacking stays simple and deterministic: total amount adds, nextTickAt remains the earlier next damage time, expiresAtTick extends to the later expiration, and source contribution buckets merge. After each Burn damage event, one source contribution bucket decays by 1. The bucket chosen is the largest current contribution; ties are resolved by sourceCombatantId, then sourceCardInstanceId, then sourceCardDefinitionId. Buckets that reach 0 are removed, and when Burn reaches 0 all Burn source contributions clear with the expired status.

Reaction order after Phase 14E is: Burn is ready, Burn deals current amount, replay/summary attribution records damage, OnStatusTicked fires once, legacy OnBurnTick fires once for compatibility, the DOT clock advances, Burn decays by 1, then Burn expires if amount or duration says it should. Expiration itself does not fire OnStatusTicked, and decay never creates same-time DOT loops. Reaction-created Burn uses the same appliedAt + 60 first-damage timing as normal Burn.

Control statuses still affect active cards only. Haste, Slow, and Freeze do not speed, delay, pause, or extend Burn/Poison clocks, and reaction hooks do not change DOT clocks.

Phase 14E tuning was intentionally conservative: Guarded Torch, Burning Shield, Kindling Spear, and Cinder Seal moved from 1 Burn to 2 Burn so single-application Burn cards do not collapse into invisible one-damage effects after decay. Poison, Heal, control values, and new card count were not raised.

## Phase 15A Build Surface And Reports

Phase 15A expands build testing space without adding new commands, statuses, resources, hooks, targeting modes, defense layers, or combat timing rules.

Formation growth:

- Level 1-2: 4 player formation slots.
- Level 3-4: 6 slots.
- Level 5-6: 8 slots.
- Level 7: 10 slots.
- Level 8: 12 slots.
- Level 9: 14 slots.
- Level 10: 16 slots.

New slots are appended. Existing cards, size-2 locked footprints, owned cards, and chest state are preserved. Enemy formations may stay smaller and readable.

Chest capacity is fixed at 16 owned cards for the whole run. Formation cards and chest-view cards are both part of ownedCards; chest view remains derived as owned cards not referenced by formation slots. This gives enough board space for real combo builds while preserving a hard deckbuilding choice.

New Phase 15A card families:

| Family | Examples | Purpose | Risk to watch |
| --- | --- | --- | --- |
| Crit / Execution | Quick Jab, Iron Scout Saber, Flank Executioner, Redline Finisher, Last Order Halberd | Chip early, then convert missing HP and crit fields into a clear finisher | boss burst below 10 seconds |
| Cooldown / Haste | Cooling Fan, Command Runner, Battlefield Metronome, Drumline Captain | Test adjacent cooldown support and modest broad Haste | runaway activation counts |
| Frequency enablers | Ember Needle, Venom Prick, Quick Jab | Feed status reactions without being strong alone | low readability trigger spam |
| Status bridges | Ash and Venom Seal, Green Smoke Lantern, Mender's Sash, Toxin Brewer, Banner of Cinders, Venom Quartermaster | Test Burn/Poison/Heal/Armor bridges using existing OnStatusTicked and OnHealReceived | Poison + Heal + Slow stall |
| Terminals | Venom Pressure Cask, Steady Wall Engine, Siege Oil Chain, Bastion Foundry | Give expanded boards clear payoff cards | too much burst or no clear terminal |

Balance report command:

```text
pnpm balance:report
```

The command builds TypeScript, runs actual CombatEngine simulations using FormationSnapshot fixtures, and writes JSON plus Markdown to `debug/balance-reports/latest.json` and `debug/balance-reports/latest.md`. The debug folder is gitignored. Report simulations and actual RunManager battles both use the shared 3600 tick run combat cap, so report duration now matches real run battle duration.

Required sample builds:

| Build | Archetype | What it proves |
| --- | --- | --- |
| Starter Blade | Blade Tempo | baseline onboarding combat |
| Starter Burn | Burn Engine | decaying Burn early pressure |
| Starter Poison | Poison Inevitable | persistent Poison pacing |
| Armor Terminal | Armor Terminal | Armor payoff without immortal stall |
| Crit Execution | Crit Execution | direct-damage crit and missing-HP finishers |
| Siege Burn | Siege Fire | slow Burn siege pressure after decay |
| Poison + Heal | Poison / Medic | long-fight sustain and stall risk |
| Burn + Reaction | Status Reaction | Burn tick reactions stay bounded |
| Haste / Drum Tempo | Drum Command | cooldown engines do not run away |
| Control Slow / Freeze | Control Tempo | conservative control avoids lock chains |
| Frequency Status Soup | Frequency / Status Reaction | high-frequency trigger readability |
| Late 16-slot Combo Build | Mixed terminal combo | expanded-board stress test |

Report warnings are intentionally simple first-pass heuristics: near timeouts, fast deaths, stall risk, cooldown runaway risk, Freeze/Slow lock risk, Poison+Heal stall, weak Burn, overly strong Poison, bursty terminals, trigger spam, low card contribution, no clear terminal, and too many zero contributors.

## Phase 15B Balance Tuning And Readability

Phase 15B used the deterministic report to tune existing numbers only. No new commands, statuses, resources, hooks, targeting modes, defense layers, or combat timing rules were added.

Tuning changes:

| Area | Cards | Change | Reason |
| --- | --- | --- | --- |
| Frequency DOT enablers | Ember Needle, Venom Prick | Cooldowns increased from 1s to 1.5s | Keep Burn/Poison frequency cards useful with reactions without making starter DOT builds end boss fights too quickly |
| Cooldown engines | Cooling Fan, Command Runner, War Drum, Battlefield Metronome | Smaller cooldown reductions, slower Command Runner, shorter/lower broad Haste | Reduce runaway activation warnings while preserving 运转牌 identity |
| Slow control | Mud Trap, Heavy Net, Poisoned Net | Lower Slow percent/duration | Make Slow disruptive without reading as permanent stall |
| Armor terminals | Iron Bastion Strike, Bastion Foundry, Steady Wall Engine | Lower Armor scaling and Armor gain | Keep Armor terminal visible without boss deletion |
| Execution terminals | Redline Finisher, Last Order Halberd | Lower missing-HP scaling, crit chance, and execute multiplier where needed | Keep crit/execution exciting but less bursty |

Report readability changes:

- Markdown now has Executive Summary, Build Summary, Boss Summary, Warning Hotspots, Top Contributor Snapshot, Trigger / Activation Outliers, Tuning Notes, and Fight Detail.
- Warning thresholds now distinguish short harmless fights from real low-contribution noise.
- Slow stall and terminal burst flags are more timing-aware.
- Warning names are exported as a stable list for tests.

Phase 15B report snapshot before Phase 15C enemy tuning:

- Total fights: 72.
- Player win rate: about 93%.
- Timeout or near-timeout: 2 fights.
- Most common warnings: ENEMY_DEAD_TOO_FAST, RUNAWAY_COOLDOWN_RISK, STALL_RISK, TIMEOUT_OR_NEAR_TIMEOUT.
- Burn has no weak-pressure flags after decay.
- Poison + Heal has no long-fight stall or Poison-too-strong flags.
- 16-slot late build is promising but still very fast into current low-HP bosses, so future tuning should consider boss durability or stricter terminal pacing before adding mechanics.

Current strongest builds:

- Armor Terminal still kills bosses quickly even after scaling nerfs, but no longer trips terminal burst in the tuned report.
- Late 16-slot Combo Build is explosive and readable enough to show multiple endpoints, but boss fights remain short.
- Burn + Reaction and Frequency Status Soup are fast, readable pressure builds with bounded trigger counts.

Current weakest or riskiest builds:

- Haste / Drum Tempo still has cooldown outliers and can lose into Gate Captain Elite.
- Control Slow / Freeze can still trip one Slow stall warning and can lose into Siege Marshal.
- Starter Blade can still stall against Armor-heavy enemies because both sides generate substantial Armor over long fights.

## Phase 15C Enemy Challenge And Attribution Readability

Phase 15C tuned enemy and boss templates plus report readability only. No player mechanics, commands, statuses, hooks, targeting modes, resources, or combat timing rules were added.

Boss fight target:

- Strong late builds should usually beat bosses in roughly 12-25 seconds.
- Imperfect but viable builds should usually take 25-45 seconds or lose.
- Starter builds are diagnostic mismatch checks against bosses; if a starter build wins a boss fight, the report flags it as `STARTER_BEATS_BOSS`.
- Bosses should stay readable 4-8 card formations, not 16-slot enemy piles or anonymous HP sponges.

Boss and enemy tuning:

| Boss | Change | Design reason |
| --- | --- | --- |
| Gate Captain Elite | Increased max HP, starting Armor, slot count, and added War Drum, Battle Standard, Guard Captain support around Saber/Shield Wall | Tests Armor-backed Blade Tempo long enough for its engine to appear, and starters now lose the boss check |
| Siege Marshal | Increased max HP, starting Armor, slot count, and added War Drum/Siege Command support around Burning Trebuchet, Siege Brazier, and Flame Ram | Tests slow siege terminal race without dying before its siege cards matter |
| Cinder Strategist | Added to the report boss suite; changed to a durable Burn pressure boss using Fire Echo Seal, Fire Arrow Cart, Burning Shield, and Ember Banner | Tests Burn/status pressure while avoiding the previous Cinder Seal snowball spike |

Latest deterministic report snapshot after Phase 15C:

- Total fights: 84.
- Player wins: 56/84.
- Starter Blade, Starter Burn, and Starter Poison all lose the authored boss checks.
- Remaining common warnings are PLAYER_DEAD_TOO_FAST, TERMINAL_TOO_BURSTY, BOSS_TOO_FRAGILE, RUNAWAY_COOLDOWN_RISK, STALL_RISK, and TIMEOUT_OR_NEAR_TIMEOUT.
- Armor Terminal and Late 16-slot Combo Build remain the strongest boss killers and still create fast-kill warnings.
- Haste / Drum Tempo and Control Slow / Freeze remain weaker boss shells because they lack clear output endpoints.
- Poison + Heal is no longer dominating through stall in the report, but it remains a long-fight archetype to monitor.

Report readability changes:

- Markdown now includes Boss Challenge Summary with per-boss win rate, average time, fast-kill count, too-fast builds, and losing builds.
- Build Legitimacy Notes classify STARTER, MID, LATE, and STRESS sample builds and state expected boss viability/weakness.
- Outcome Attribution Snapshot separates Player Top Contributor from Enemy Top Contributor.
- Contributor ids are resolved to readable card names when possible; raw ids remain in JSON and only surface in Markdown if name lookup fails.
- Warning Hotspots now include a likely design cause column for serious flags such as fast boss kills, stalls, cooldown runaway, and player deaths.

It is safer to consider a small future mechanic only after manual playtests confirm Phase 15C boss pacing feels good. The report still says terminal burst and boss fragility need human review before raising player card numbers again.

## Phase 15D Sell-Triggered Reward Cards

Phase 15D adds reward cards as run economy/progression objects. Reward cards are not combat cards, do not enter `ownedCards`, do not count against the fixed 16 combat-card capacity, cannot be placed in formation, and never enter `FormationSnapshot` or `CombatEngine`.

Reward-card rules:

- Reward cards live in `ownedRewardCards`.
- `GOLD_ONLY` reward cards sell for gold and have no other effect.
- `SELL_TRIGGER_ENHANCEMENT` reward cards sell for gold and permanently enhance the leftmost placed active card if the target is valid.
- The only Phase 15D target rule is `LEFTMOST_FORMATION_ACTIVE_CARD`.
- Invalid enhancement sales fail clearly and do not grant gold, remove the reward card, or mutate enhancements.
- Reward cards are not offered in the starter shop or starter event.
- Battle rewards can include at most 1 reward card. Level 1-2 rewards do not offer reward cards. Later normal/elite/boss-style reward sets can offer at most 1.
- Boss loot preview slots are not implemented yet; if added later, they should remain visual/economy preview data and not enter combat snapshots.

Initial reward-card list:

| Reward card | Tier | Type | Sell / enhancement |
| --- | --- | --- | --- |
| Copper Coin Pouch | Bronze | Gold only | Sell for 2 gold |
| Silver Tax Seal | Silver | Gold only | Sell for 5 gold |
| Spoils Chest | Gold | Gold only | Sell for 9 gold |
| Jade Tribute | Jade | Gold only | Sell for 14 gold |
| Sharpened Edge | Bronze | Enhancement | +1 direct damage, sell for 1 gold |
| Ember Powder | Bronze | Enhancement | +1 Burn, sell for 1 gold |
| Venom Dust | Bronze | Enhancement | +1 Poison, sell for 1 gold |
| Oiled Gear | Bronze | Enhancement | -2% cooldown, sell for 1 gold |
| Tempered Edge | Silver | Enhancement | +2 direct damage, sell for 2 gold |
| Fire Resin | Silver | Enhancement | +2 Burn, sell for 2 gold |
| Toxin Flask | Silver | Enhancement | +2 Poison, sell for 2 gold |
| Balanced Gear | Silver | Enhancement | -4% cooldown, sell for 2 gold |
| General's Whetstone | Gold | Enhancement | +3 direct damage, sell for 4 gold |
| Siege Pitch | Gold | Enhancement | +3 Burn, sell for 4 gold |
| Black Venom | Gold | Enhancement | +3 Poison, sell for 4 gold |
| Precision Gear | Gold | Enhancement | -6% cooldown, sell for 4 gold |

Persistent enhancement rules:

- Enhancements attach to `CardInstance.enhancements` and persist through save/load.
- Flat damage/Burn/Poison enhancements stack additively.
- Cooldown reduction enhancements stack additively up to a 40% total cap.
- Enhanced cooldowns cannot go below 30 logic ticks / 0.5 seconds.
- Enhancements apply after tierOverride scaling.
- Enhancements affect active card effects only; they do not affect passive trigger internal cooldowns, DOT tick intervals, control status clocks, Haste/Slow/Freeze timing, or runtime modifiers.

Latest deterministic report snapshot after Phase 15D:

- Total fights: 98.
- Player wins: 66/98.
- Enhanced sample builds: Enhanced Burn Terminal and Enhanced Cooldown Tempo.
- Enhanced Burn Terminal uses Fire Cart Battery with +3 Burn from Siege Pitch.
- Enhanced Cooldown Tempo uses Vanguard Saber with -6% cooldown from Precision Gear.
- Remaining common warnings are TERMINAL_TOO_BURSTY, PLAYER_DEAD_TOO_FAST, BOSS_TOO_FRAGILE, RUNAWAY_COOLDOWN_RISK, STALL_RISK, and TIMEOUT_OR_NEAR_TIMEOUT.

Known reward-card risks:

- High-frequency damage cards can scale sharply with flat damage enhancements.
- Fast Burn/Poison applicators can become boss-bursty with +2/+3 status amount.
- Cooldown reduction stacks with Haste and Drum engines, so activation outliers remain a watch item.
- Leftmost targeting is intentionally restrictive but may need UX polish once players have larger 16-slot boards.
- A future gold-only cash-out action for enhancement cards could reduce feel-bad invalid-target moments; Phase 15D keeps invalid enhancement sales fail-fast for clarity.

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
- Level 8+ shops and rewards are expected to show at least one terminal/payoff/engine often enough to test expanded boards, while still preserving build-vital support and duplicate upgrade routes.

Quality progression is role-aware. Higher-level rewards should have more engine, payoff, terminal, and build-completion options than level 1 rewards, while early rewards remain onboarding-safe.

## Curated Pools

Pool definitions live in `src/content/cards/contentPools.ts` near the active card registry. They are intentionally TypeScript arrays rather than a risky JSON schema expansion.

- Starter shop: Rusty Blade, Wooden Shield, Oil Flask.
- Starter event: simple active cards including Rusty Blade, Wooden Shield, Oil Flask, Iron Guard, and Militia Spear.
- Early shop/reward: Bronze/Silver starter, defense, Burn, Poison, Heal, simple Haste/Slow, and low-risk reaction connector cards.
- Mid shop/reward: early cards plus stronger engines, payoffs, Poison/Heal support, control cards, reaction cards, and size-2 build-around cards.
- Late shop/reward: mid cards plus Iron Warlord terminals, strong drum/siege engines, and build-vital support.
- Terminal pool: Execution Halberd, Captain's Finisher, Iron Bastion Strike, Warlord's Mandate, Flame Ram, Burning Trebuchet, Siege Crossbow, Venom Pressure Cask, Redline Finisher, Steady Wall Engine, Siege Oil Chain, Bastion Foundry, and Last Order Halberd.
- Build-vital support pool: low/mid-tier enablers that keep builds coherent.
- Boss reward pool: terminal and late support cards for future boss reward tuning.
- Skill reward pool: the 8 MVP modifier-only skills.

Archetype pools are defined for Blade Tempo, Burn Engine, Poison Inevitable, Medic Support, Control Tempo, Status Reaction, Armor Counter, Drum Command, Siege Fire, Hybrid Bruiser, Armor Terminal, and Crit Execution. Monster reward generation prioritizes monster-used cards, then monster rewardPool cards, then curated/archetype-like fallbacks, support cards, terminals when level-appropriate, and finally skill/gold fallback.

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
- New Phase 15A bridge passives should be monitored for zero contribution because their value depends on adjacent status/heal density.

## Current Limitations

- No affixes or random stat rolls.
- No general rarity system beyond current tier fields and curated pool weighting.
- Burn/Poison source attribution powers replay/summary and status reaction ownership checks; DOT ticks still do not receive source-owned damage modifiers. Burn source buckets decay with Burn amount, while Poison source buckets do not decay.
- Haste/Slow/Freeze are cooldown/activation control only; there are no control-status payoff conditions, cleanse/silence, card movement, card destruction, or final control UI treatments.
- No boss rotation unless implemented later.
- No branching map, async PvP, cloud save/account system, or final art/Pixi/Phaser.
- Balance report thresholds are first-pass deterministic heuristics, not automatic balance verdicts.

## Intentionally Not Implemented Yet

- No new resources, modifier hooks, modifier conditions, or modifier operations beyond the explicit Phase 14B ApplyPoison/HealHP, Phase 14C ApplyHaste/ApplySlow/ApplyFreeze, and Phase 14D OnStatusTicked/OnHealReceived reaction additions.
- No non-deterministic random chance.
- No Barrier, Ward, Energy Shield, absorb layers, Vulnerable, Silence, Cleanse, MoveCard, DisableCard, card destruction, Mana, Command resource, Spirit, Fate, Heat, morale, or rage.
- No hand, deck, discard, branching map, async PvP, boss-selection system, or final art implementation.
