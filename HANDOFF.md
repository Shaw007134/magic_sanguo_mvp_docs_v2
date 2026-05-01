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
Phase 11 RunState and RunManager are implemented under src/run and are intended to be serializable in Phase 12.
New runs start at level 1 with 0 exp, 10 gold, 0 owned cards, 4 formation slots, chest capacity 8, max HP 40, and current HP 40.
RunManager owns chest/owned card state, formation placement, selling, deterministic shop/event/reward choices, EXP, level-ups, HP, battle execution, battle completion, repeated node advancement, final boss, and run result.
Run node order begins with starter shop, starter event, easy battle, reward, shop, normal battle, reward, shop, elite battle, reward, then repeats shop/event -> battle -> reward cycles until level 10.
At level 10, the next generated battle node is the final boss; boss win sets VICTORY and boss loss/draw sets DEFEAT.
Shop and event resolution grant 1 EXP once. Battle wins grant 1 encounter EXP + 3 win EXP. Level-up threshold is 10 EXP.
Level-ups increase max HP by ceil(10%), heal current HP to max HP, and generate deterministic level-up reward choices.
Reward choices now support deterministic card, gold, and upgrade choices; battle rewards include a monster rewardPool card when available.
Card upgrades use a simple CardInstance tierOverride for runtime economy/reward purposes; combat card definitions remain unchanged.
Battle nodes use Phase 9 MonsterGenerator and existing CombatEngine; no separate monster battle system was added.
DRAW is treated as DEFEAT for MVP run completion.
Player-facing replay UI displays seconds via formatTicksAsSeconds; raw tick-style details remain allowed in dev logs.
Smoke, model export, validation, basic combat, ResolutionStack, Armor/Burn, TriggerSystem, ModifierSystem, ReplayTimeline, CombatResultSummary, MonsterGenerator, UI state, and expanded RunManager tests pass.
Formula rewriting, rollback/snapshot, Freeze, Haste, Vulnerable, Silence, Barrier, Ward, Energy Shield, absorb layers, random chance triggers/modifiers, final art, save/load, branching map, async PvP, and complex content expansion are not implemented yet.
```



## Next Task

Phase 12:

```text
Implement Save And Load.
```

Reminder: save/load is Phase 12 and should persist/restore the new RunState rather than introducing a separate inventory or map model.

## Manual Test Instructions

```text
1. Run pnpm dev.
2. Open the shown localhost URL.
3. Confirm the run starts at level 1, 0 EXP, 10 gold, 40/40 HP, 0 owned cards, and a starter shop.
4. Pick a starter shop card, then pick a starter event option, and confirm EXP increases by 1 per resolved node.
5. Select a chest card, click a formation slot, and confirm the card moves out of chest view.
6. Start battle, confirm Replay and Summary populate, then click Continue to reach reward or defeat.
7. Choose reward and continue through repeated shop/event, battle, and reward nodes.
8. Confirm level-up choices appear at 10 EXP, max HP increases by 10% rounded up, and current HP heals to max.
9. Continue until level 10, then confirm the next battle is the final boss and boss completion shows Victory or Defeat.
10. Toggle Dev CombatLog and confirm raw combat log is hidden until enabled; replay event times should show seconds, not T/tick labels.
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

Use Phase 12 prompt from `docs/MVP_BUILD_SEQUENCE.md`.
