# HANDOFF

Use this file when starting a new Codex chat.

## Current Project State

Magic Sanguo is a Bazaar-like ARPG-inspired roguelike formation card-builder.

Current source of truth:

```text
docs/MVP_MASTER_DESIGN.md
```

Current implementation status:

```text
Phase 11 playable MVP run loop complete.
TypeScript + pnpm + Vitest project skeleton exists.
Core data model interfaces added.
CardDefinition and FormationSnapshot validation helpers added.
Basic deterministic CombatEngine added and routed through ResolutionStack.
Active cards start at cooldownMaxTicks unless an explicit initial runtime state is provided.
Same-tick card ordering is deterministic: ready tick, side priority, slotIndex, cardInstanceId.
Card effects use `effect.command`, not `effect.type`.
Supported command effects are DealDamage, GainArmor, ApplyBurn, and ModifyCooldown.
Card effect JSON order is preserved by pushing commands onto the LIFO stack in reverse order.
CombatEngine creates a fresh ResolutionStack for each simulate() call.
ModifyCooldown card JSON supports `target: "SELF"` and `target: "ADJACENT_ALLY"`; ModifyCooldownCommand remains concrete and receives targetCardInstanceId.
Armor mitigation is implemented through DamageCalculator.
Tick order: card activations resolve before status updates; status damage can end combat after same-tick card activations.
Burn runtime status uses absolute tick fields: appliedAtTick, nextTickAt, expiresAtTick.
Burn first ticks at appliedAtTick + 60, stacks as one merged additive Burn status, and expires by integer tick duration.
MVP rule: Burn goes through DamageCalculator but ignores Armor so DOT keeps a clear tactical role.
Passive TriggerSystem is implemented for OnCombatStart, OnCardActivated, OnDamageDealt, OnDamageTaken, OnStatusApplied, OnBurnTick, OnCooldownModified, and OnCombatEnd.
Passive triggers support internalCooldownTicks, maxTriggersPerTick (default 1), deterministic order, and trigger-created CombatCommand objects pushed to ResolutionStack.
Supported trigger conditions are status Burn, appliedByOwner, sourceHasTag, cardIsAdjacent, ownerHpBelowPercent, and targetHpBelowPercent.
Trigger-created commands always use the trigger owner as sourceCombatant and the opposing combatant as default targetCombatant.
Recursive trigger-created commands carry triggerDepth through ResolutionStack; maxTriggerDepth stops recursive chains with StackLimitReached internal/debug output and CombatLog detail.
OnCombatEnd is log/replay only in MVP and must not push or resolve combat commands or mutate HP, armor, statuses, cooldowns, or winner.
OnBurnTick currently supports status and HP conditions only; appliedByOwner/source ownership conditions do not fire until Burn source tracking is added.
Minimal ModifierSystem / MBF is implemented for damage, cooldown recovery rate, and status duration modifiers.
Modifiers are owner-scoped by default: modifier.ownerId must match sourceCombatant.formation.id, and modifiers do not apply when sourceCombatant is absent.
Modifier priority: lower priority number executes first; same priority sorts by modifier id.
Supported modifier conditions are sourceHasTag, targetHasStatus, ownerHasStatus, damageType, cardInSlot, and always.
Supported modifier operations are ADD_DAMAGE, MULTIPLY_DAMAGE, ADD_COOLDOWN_RECOVERY_RATE, MULTIPLY_COOLDOWN_RECOVERY_RATE, ADD_STATUS_DURATION, and MULTIPLY_STATUS_DURATION.
Damage, cooldown recovery, and status duration modifier outputs are clamped to 0+ and rounded to integer MVP combat values for deterministic replay/readability.
BurnTick still does not track sourceCombatant/sourceCard; source-owned damage modifiers therefore do not apply to BurnTick damage until Burn source tracking is added later.
ReplayTimeline is the clean player-facing replay data. Raw CombatLog remains dev/debug data and can include stack-limit/debug detail not shown in ReplayTimeline.
ReplayTimeline currently uses CombatStarted, CardActivated, DamageDealt, ArmorGained, ArmorBlocked, StatusApplied, StatusTicked, CooldownModified, TriggerFired, CombatEnded, and StatusExpired events.
CombatResultSummary is built from ReplayTimeline and aggregates damage by card, Burn/status damage, armor gained by card, armor blocked, activations by card, trigger count by card, top contributors, winner, and ticks elapsed.
MonsterTemplate and MonsterGenerator are implemented. MonsterGenerator outputs FormationSnapshot plus deterministic CardInstance data for the existing CombatEngine interface.
MVP monster templates exist for Training Dummy, Rust Bandit, Burn Apprentice, Shield Guard, Drum Tactician, Fire Echo Adept, and First Boss: Gate Captain.
Monster card content exists for Training Staff, Rusty Blade, Flame Spear, Wooden Shield, Spark Drum, Fire Echo Seal, and Gate Captain Saber.
Monster card runtime content is loaded from data/cards/monster_cards.json; monster template runtime content is loaded from data/monsters/*.json.
Tutorial and boss monsters are fixed; normal/elite monsters use deterministic seeded optional card layout.
Optional monster cards currently shuffle and fill all fitting slots. Future balancing may add maxOptionalCards/minOptionalCards/day scaling.
Monster battles use the same FormationSnapshot combat path as player and future async PvP opponents; no separate monster combat system was added.
Size 2 monster cards occupy a starting slot and mark the adjacent slot locked in FormationSnapshot output; CombatEngine behavior is unchanged.
Phase 10 UI must render locked adjacent slots as occupied by the size-2 card footprint.
BurnTick damage remains summarized as statusDamage.Burn and is not attributed back to the applying card because Burn source tracking is still intentionally deferred.
Minimal React + Vite UI prototype is implemented under src/ui.
UI state helpers live under src/ui/state and own only local gold, chest, formation, and selling state.
Chest capacity is formation slot count x 2. With 4 formation slots, the MVP chest capacity is 8.
Selling from chest uses MVP prices: BRONZE 1, SILVER 2, GOLD 4, JADE 8, CELESTIAL 12. Formation cards cannot be sold until removed back to chest.
The UI builds a player FormationSnapshot from final pre-combat formation state and passes it to CombatEngine. React components do not calculate combat results.
Enemy preview uses Phase 9 MonsterGenerator and renders locked adjacent slots as size-2 footprints.
Post-combat UI shows ReplayTimeline and CombatResultSummary, with raw CombatLog behind a dev-only toggle.
Phase 10 cleanup switched the UI to a top-down encounter layout: Enemy Formation, encounter action bar, Your Formation, then Chest.
Visible cards use src/ui/presentation/cardDisplay.ts for type, tier, size, cooldown, and compact effect/trigger summaries.
Size 2 cards render as one wide visual block in player and enemy formations, while the state/FormationSnapshot still keeps the adjacent locked slot.
removeCardFromFormation no longer checks chest capacity, because ownedCards already contains placed cards and chestCards is derived from ownedCards minus placed cards.
Phase 10 prototype-only owned cards have been replaced in the main UI by real RunManager state.
Phase 12 versioned save/load is implemented around RunState under src/run/save/SaveManager.ts.
RunState remains the source of truth for persistence; save/load wraps and validates RunState rather than creating another inventory/map/progression model.
Save format version 1 stores runId, seed, node/current phase state, gold, level/EXP/HP, owned cards including tierOverride, ownedSkills, formation layout, shopStates, currentChoices, pendingRewardChoices, pendingLevelUpChoices, current enemy snapshot/card instances, pending combat result, reward reveal source, and completed counters.
RunManager.restoreFromState restores a validated RunState without calling node choice generation, reward generation, MonsterGenerator, or CombatEngine.
Restored RunManager recomputes the next generated card/skill instance counters from saved instance ids to avoid collisions after load.
Battle nodes materialize and store their enemy FormationSnapshot/currentEnemyCardInstances when the node is entered, and startBattle() uses the serialized enemy if present.
Loading a battle node therefore uses saved enemy state and does not reroll through MonsterGenerator.
Loading shop/event/reward/level-up nodes uses serialized currentChoices and pending choices, not regenerated choices.
If a completed battle result is waiting for Continue, pendingCombatResult/pendingBattleResult are serialized so replay/summary UI resumes without rerunning combat.
SaveManager returns typed SaveLoadResult values for success/failure and fails corrupt JSON, unsupported versions, missing required fields, unknown node types, invalid numeric domains, invalid classId, invalid card refs, invalid formation refs, invalid enemy snapshots, and bad combat-result shapes with clear errors.
RunState save validation now enforces currentNodeIndex >= 0, level >= 1, exp >= 0, expToNextLevel > 0, gold >= 0, maxHp > 0, currentHp between 0 and maxHp, formationSlotCount > 0, chestCapacity >= formationSlotCount, and nonnegative completed/defeated counters.
Saved RunFormationSlot validation enforces exact slot indexes 1..formationSlotCount, no gaps/duplicates, owned-card references, no card inside locked slots, and correct size-2 adjacent locked footprints.
createRunSaveData() and serializeRunState() accept an optional active cardDefinitionsById registry; the UI passes its active registry so expanded content can serialize without falling back to the MVP monster-card registry.
Phase 13A active content registry lives at src/content/cards/activeCards.ts and combines legacy MVP monster cards, general cards, and Iron Warlord cards.
RunManager, ShopNode, EventNode, RewardGenerator through RunManager, MonsterGenerator, SaveManager defaults, UI App cardDefinitionsById, debug replay export, and content tests now use the active registry.
Expanded card content exists under data/cards/general/ and data/cards/class_iron_warlord/. Legacy ids in data/cards/monster_cards.json remain available for saves/tests.
Expanded skill content is data-driven through data/skills/mvp_skills.json and still instantiates only existing ModifierSystem modifiers.
Fire Study is intentionally tag-based in Phase 13A patch: it uses sourceHasTag "fire" to boost direct damage from fire-tagged cards. It does not use damageType FIRE because DealDamageCommand currently emits DIRECT damage for card effects and Burn tick source attribution is deferred.
Quick Hands and Drumline Training use ADD_COOLDOWN_RECOVERY_RATE instead of a small multiplier because cooldown recovery modifiers round to integer MVP values; a 1.25x multiplier on base recovery 1 is effectively a no-op.
Phase 13A monster templates include Bandit Duelist, Oil Raider, Shield Sergeant, Drum Adept, Siege Trainee, Banner Guard, Cinder Captain, and Iron Patrol.
Phase 13A boss templates include Gate Captain Elite, Siege Marshal, and Cinder Strategist. Only Gate Captain Elite is wired as the current final boss.
docs/BALANCE_NOTES.md documents the content pack, Iron Warlord identity, card roles, skills, monsters, bosses, risky combos, readability risks, and intentionally deferred systems.
The browser UI has minimal localStorage controls: Save Run, Load Run, and Clear Save. No cloud save, account system, or migration UI exists.
New runs start at level 1 with 0 exp, 10 gold, 0 owned cards, 4 formation slots, chest capacity 8, max HP 40, and current HP 40.
RunManager owns chest/owned card state, ownedSkills, formation placement, selling, deterministic shop/event/reward choices, shop offer state, EXP, level-ups, HP, battle execution, battle completion, repeated node advancement, final boss, and run result.
Run node order begins with starter shop, starter event, easy battle, reward, shop, normal battle, reward, shop, elite battle, reward, then repeats shop/event -> battle -> reward cycles until level 10.
At level 10, the next generated battle node is the final boss; boss win sets VICTORY and boss loss/draw sets DEFEAT.
Shop and event resolution grant 1 EXP once. Battle wins grant 1 encounter EXP + 3 win EXP. Level-up threshold is 10 EXP.
Level-ups increase max HP by ceil(10%), heal current HP to max HP, and generate deterministic level-up reward choices.
Level-up progression now pauses on LEVEL_UP_REWARD until the player explicitly chooses one deterministic pending level-up reward, then returns to the interrupted node/progression.
Level-up choices prioritize skill, upgrade, and gold options so the MVP reward surface always includes real run-control decisions when available.
Shop purchases no longer auto-advance; bought shop choices are marked purchased/sold out and leaveShop() grants shop EXP once.
All player-facing card acquisition paths use RunManager.gainCardOrUpgradeDuplicate(): same-card same-effective-tier duplicates upgrade the existing owned card when possible instead of adding another copy.
Duplicate auto-upgrade messages include before/after tier and key stat preview; max-tier duplicates can still be added if chest capacity allows.
Reward reveal state records defeated monster name plus used monster card definition ids before reward choice selection.
Battle reward choices now support deterministic dropped cards, skill, gold, and fallback cards; direct REWARD_UPGRADE choices are intentionally excluded from normal battle rewards.
Battle reward cards still prioritize used monster cards, then monster rewardPool, then generic fallback.
Level-up rewards still support LEVEL_UPGRADE choices when an owned card has a meaningful visible/combat stat change available.
Minimal skills exist under src/run/skills and are owned through RunState. Skills currently instantiate existing ModifierSystem modifiers only.
Owned skills stay separate from ownedCards, render near formation, and are included in player FormationSnapshot creation without going through chest inventory.
Card upgrades use CardInstance.tierOverride plus effective card definitions so upgraded tiers scale combat values/cooldowns and normal UI display.
Effective upgrade scaling guarantees upgraded DealDamage, GainArmor, and ApplyBurn amounts increase by at least 1 over the previous effective tier; previews and messages show only changed stats and omit unchanged cooldowns.
Battle nodes use Phase 9 MonsterGenerator and existing CombatEngine; no separate monster battle system was added.
DRAW is treated as DEFEAT for MVP run completion.
Player-facing replay UI displays seconds via formatTicksAsSeconds and event-specific friendly text instead of raw payload fields.
RunStatusBar renders labeled Gold, Level, EXP, and HP values with spacing so Level 1 and 0 / 10 EXP cannot visually merge.
Choice UI renders readable shop/event/reward cards using card names, metadata, cooldown seconds, prices, gold/heal amounts, and upgrade tier transitions.
Event card choices use the same readable card metadata as shop/reward cards rather than short raw card labels.
Card summaries and card metadata are player-facing seconds-only: Burn duration and ModifyCooldown amounts no longer show raw tick suffixes in normal UI.
Passive trigger summaries are player-facing phrases, such as "When you apply Burn", and do not expose internal hook names such as OnStatusApplied.
ResultSummary resolves card/source ids to readable card names, hides zero-value rows, and shows top contributors plus readable Burn/status damage.
Empty player/enemy slots render separate Slot N and Empty labels.
Debug replay export helper exists at scripts/exportSampleCombatReplay.ts. Run `pnpm export:sample-replay` to build TS and write JSON under debug/combat-replays/.
The root debug/ folder is gitignored; browser UI does not write to the local filesystem.
Known limitation: MVP skills are minimal modifier-based rewards only; no skill tree or new trigger hook/status/resource system exists yet.
Known limitation: Burn tick damage is not attributed to applying cards, so fire-tagged skills affect direct damage from fire-tagged card effects but not Burn ticks.
Known limitation: CardInstance.tierOverride now scales supported combat values/cooldowns and is persisted by save/load; future schema changes must preserve it exactly.
Known limitation: save format version is 1 with fail-fast validation; future RunState schema changes need explicit migration or a clear unsupported-version failure.
Smoke, model export, validation, basic combat, ResolutionStack, Armor/Burn, TriggerSystem, ModifierSystem, ReplayTimeline, CombatResultSummary, MonsterGenerator, active content registry, skill definition, UI state, expanded RunManager, and SaveManager tests pass.
Formula rewriting, rollback/snapshot, Freeze, Haste, Vulnerable, Silence, Barrier, Ward, Energy Shield, absorb layers, random chance triggers/modifiers, final art, branching map, async PvP, cloud save/account sync, and boss rotation are not implemented yet.
```



## Next Task

Post-Phase 13A:

```text
Playtest expanded MVP content, tune card/monster numbers, and add explicit save migration only when the RunState schema changes.
```

Reminder: save/load now persists/restores RunState directly. Future schema changes should add explicit migration instead of creating a second progression model.

## Manual Test Instructions

```text
1. Run pnpm dev.
2. Open the shown localhost URL.
3. Confirm the run starts at level 1, 0 EXP, 10 gold, 40/40 HP, 0 owned cards, and a starter shop.
4. Buy one or more starter shop cards, confirm the shop stays open, then click Leave Shop and confirm shop EXP is granted once.
5. Select a chest card, click a formation slot, and confirm the card moves out of chest view.
6. Start battle, confirm Replay and Summary populate, then click Continue to reach reward or defeat.
7. Choose reward and continue through repeated shop/event, battle, and reward nodes.
8. Confirm level-up choices appear at 10 EXP, max HP increases by 10% rounded up, and current HP heals to max.
9. Continue until level 10, then confirm the next battle is the final boss and boss completion shows Victory or Defeat.
10. Toggle Dev CombatLog and confirm raw combat log is hidden until enabled; replay event times should show seconds, not T/tick labels.
11. Click Save Run, make a visible change such as New Run, then click Load Run and confirm the saved node, shop/reward choices, formation, skills, HP, gold, and pending replay/reward state return.
12. Click Clear Save, then Load Run and confirm the UI reports that no saved run exists.
13. Optional debug export: run pnpm export:sample-replay and inspect debug/combat-replays/*.json.
14. Start a new run and verify the shop shows a mix of simple and synergy cards.
15. Verify the first two nodes still let the player get at least one active card before first combat.
16. Build at least one Burn Engine run.
17. Build at least one Armor/Blade run.
18. Build at least one Drum/Siege run.
19. Confirm rewards sometimes show cards related to defeated monsters.
20. Confirm card summaries are readable and show seconds, not raw ticks.
21. Confirm passive trigger summaries do not expose internal hook names.
22. Confirm no skills appear in chest.
23. Confirm save/load still works after obtaining new cards, upgraded duplicates, skills, and pending rewards.
24. Confirm enemy formations are readable and not random piles.
```

## Rules For Next Agent

```text
1. Read docs/MVP_MASTER_DESIGN.md first.
2. Implement only the requested phase from docs/MVP_BUILD_SEQUENCE.md.
3. Do not expand UI beyond the requested phase scope.
4. Use `effect.command`, not `effect.type`, for combat effect grammar.
5. Do not implement Barrier, Ward, Energy Shield, or absorb layers.
6. Add tests when code is implemented.
7. Update PROJECT_LOG.md.
8. Update HANDOFF.md.
9. Create a git commit after each completed phase so the phase is easy to review.
10. Stop after task completion.
11. New phase log entries in PROJECT_LOG.md append only.
```

## Recommended First Prompt

Use the next requested prompt from the product owner; Phase 13A content expansion is complete.
