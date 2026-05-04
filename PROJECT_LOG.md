# PROJECT_LOG

Update this after every Codex task.

Rule: new phase log entries append only. Do not insert new phase entries above existing entries; if the log order ever needs repair, fix it explicitly in a dedicated maintenance edit and keep future updates append-only.

## Template

```text
Date:
Phase:
Task:
Files changed:
Tests added:
How to run:
Known issues:
Next recommended task:
```

---

## Initial Entry

Date: TBD
Phase: 0
Task: Created MVP design documentation.
Files changed:
- docs/MVP_MASTER_DESIGN.md
- docs/MVP_BUILD_SEQUENCE.md
- PROJECT_LOG.md
- HANDOFF.md

Known issues:
- No code implemented yet.
- Need to create TypeScript project skeleton next.

Next recommended task:
- Phase 1: TypeScript + pnpm + Vitest project skeleton.

---

Date: 2026-05-01
Phase: 1
Task: Created TypeScript + pnpm + Vitest project skeleton.
Files changed:
- .gitignore
- package.json
- pnpm-lock.yaml
- tsconfig.json
- vitest.config.ts
- data/.gitkeep
- src/index.ts
- tests/smoke.test.ts
- README.md
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- tests/smoke.test.ts
How to run:
- pnpm install
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- No gameplay, combat, card, data model, or UI code implemented yet.
Next recommended task:
- Phase 2: Core data model and validation.

---

Date: 2026-05-01
Phase: 2
Task: Implemented core data model and validation.
Files changed:
- src/index.ts
- src/model/card.ts
- src/model/combat.ts
- src/model/formation.ts
- src/model/index.ts
- src/model/result.ts
- src/validation/cardValidation.ts
- src/validation/formationValidation.ts
- src/validation/validationResult.ts
- tests/model/modelExports.test.ts
- tests/validation/cardValidation.test.ts
- tests/validation/formationValidation.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- tests/model/modelExports.test.ts
- tests/validation/cardValidation.test.ts
- tests/validation/formationValidation.test.ts
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- No combat simulation, ResolutionStack, commands, statuses, triggers, ModifierSystem, or UI implemented yet.
- Formation size validation checks size 2 placement when card instance and card definition lookup maps are provided.
Next recommended task:
- Phase 3: Basic CombatEngine without ResolutionStack.

---

Date: 2026-05-01
Phase: 3
Task: Implemented Basic CombatEngine without ResolutionStack.
Files changed:
- src/index.ts
- src/combat/CombatEngine.ts
- src/combat/CombatLog.ts
- src/combat/CooldownSystem.ts
- src/combat/TargetingSystem.ts
- tests/combat/basicCombat.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- tests/combat/basicCombat.test.ts
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- CombatEngine supports only direct `{ command: "DealDamage", amount: number }` active card effects.
- No ResolutionStack, CombatCommand, Armor behavior, Burn behavior, triggers, ModifierSystem, or UI implemented yet.
- Combat ends immediately when a combatant reaches 0 HP during ordered same-tick resolution.
Next recommended task:
- Phase 4: CombatCommand and ResolutionStack.

---

Date: 2026-05-01
Phase: Pre-4 patch
Task: Aligned Phase 3 direct effect grammar with MVP command grammar.
Files changed:
- src/combat/CombatEngine.ts
- tests/combat/basicCombat.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Updated existing combat tests to use `{ command: "DealDamage", amount: number }`.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Old `{ type: "DealDamage", amount: number }` effects are no longer supported.
Next recommended task:
- Phase 4: CombatCommand and ResolutionStack.

---

Date: 2026-05-01
Phase: 4
Task: Implemented CombatCommand and ResolutionStack.
Files changed:
- src/index.ts
- src/combat/CombatEngine.ts
- src/combat/CooldownSystem.ts
- src/combat/ResolutionStack.ts
- src/combat/TargetingSystem.ts
- src/combat/types.ts
- src/combat/commands/ApplyBurnCommand.ts
- src/combat/commands/CombatCommand.ts
- src/combat/commands/DealDamageCommand.ts
- src/combat/commands/GainArmorCommand.ts
- src/combat/commands/ModifyCooldownCommand.ts
- tests/combat/basicCombat.test.ts
- tests/combat/resolutionStack.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- tests/combat/resolutionStack.test.ts
- Added basic combat coverage for card effect order through ResolutionStack.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- CombatEngine now converts active card effects using `effect.command`.
- Supported command effects are DealDamage, GainArmor, ApplyBurn, and ModifyCooldown.
- ApplyBurnCommand records a deterministic application event only; Burn ticking/status behavior is not implemented.
- Passive triggers, ModifierSystem, Barrier, Ward, Energy Shield, absorb layers, and UI are not implemented.
Next recommended task:
- Phase 5: Armor and Burn.

---

Date: 2026-05-01
Phase: 4 patch
Task: Patched ResolutionStack freshness and ModifyCooldown card effect targeting before Phase 5.
Files changed:
- src/combat/CombatEngine.ts
- tests/combat/basicCombat.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Repeated CombatEngine simulations do not leak ResolutionStack command counters.
- ModifyCooldown card effects resolve SELF target.
- ModifyCooldown card effects resolve ADJACENT_ALLY target.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- GainArmorCommand updates runtime armor but DealDamageCommand does not consume armor until Phase 5.
- ModifyCooldown card effect targeting supports only SELF and ADJACENT_ALLY card JSON targets plus legacy concrete targetCardInstanceId.
- Burn ticking/status behavior is not implemented until Phase 5.
Next recommended task:
- Phase 5: Armor and Burn.

---

Date: 2026-05-01
Phase: 5
Task: Implemented Armor and Burn.
Files changed:
- src/index.ts
- src/combat/CombatEngine.ts
- src/combat/DamageCalculator.ts
- src/combat/commands/ApplyBurnCommand.ts
- src/combat/commands/DealDamageCommand.ts
- src/combat/status/Burn.ts
- src/combat/status/StatusEffect.ts
- src/combat/status/StatusEffectSystem.ts
- src/combat/types.ts
- tests/combat/armorBurn.test.ts
- tests/combat/resolutionStack.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- tests/combat/armorBurn.test.ts
- Updated ResolutionStack command replay expectations for DamageCalculator payloads.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Burn damage goes through DamageCalculator but ignores Armor by MVP rule.
- Damage modifiers are a placeholder only; ModifierSystem is not implemented.
- Freeze, Haste, Vulnerable, TriggerSystem, Barrier, Ward, Energy Shield, absorb layers, and UI are not implemented.
Next recommended task:
- Phase 6: Passive TriggerSystem.

---

Date: 2026-05-01
Phase: 5 patch
Task: Patched Burn timing to absolute ticks and merged additive stacking before Phase 6.
Files changed:
- src/combat/commands/ApplyBurnCommand.ts
- src/combat/status/Burn.ts
- src/combat/status/StatusEffect.ts
- src/combat/status/StatusEffectSystem.ts
- tests/combat/armorBurn.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Burn applied at tick 1 first ticks at tick 61.
- Burn duration 60 applied at tick 1 ticks once at tick 61 and then expires.
- Burn does not lose duration during the same tick it is applied.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Burn stacking is merged additive: repeated Burn applications merge into one Burn status with additive amount and the later expiresAtTick.
- Card activations resolve before status updates; status damage can end combat after same-tick card activations.
- Passive triggers, ModifierSystem, Freeze, Haste, Vulnerable, Barrier, Ward, Energy Shield, absorb layers, and UI are not implemented.
Next recommended task:
- Phase 6: Passive TriggerSystem.

---

Date: 2026-05-01
Phase: 6
Task: Implemented Passive TriggerSystem.
Files changed:
- src/index.ts
- src/combat/CombatCommandFactory.ts
- src/combat/CombatEngine.ts
- src/combat/commands/ApplyBurnCommand.ts
- src/combat/commands/CombatCommand.ts
- src/combat/commands/DealDamageCommand.ts
- src/combat/commands/ModifyCooldownCommand.ts
- src/combat/status/StatusEffectSystem.ts
- src/combat/triggers/TriggerDefinition.ts
- src/combat/triggers/TriggerRuntimeState.ts
- src/combat/triggers/TriggeredCombatCommand.ts
- src/combat/triggers/TriggerSystem.ts
- tests/combat/triggers.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- tests/combat/triggers.test.ts
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Trigger definitions use `hook`, optional `conditions`, optional `internalCooldownTicks`, optional `maxTriggersPerTick`, and `effects`.
- Supported trigger conditions are status Burn, appliedByOwner, sourceHasTag, cardIsAdjacent, ownerHpBelowPercent, and targetHpBelowPercent.
- TriggerSystem does not implement random chance triggers, ModifierSystem, new statuses, absorb layers, or UI.
Next recommended task:
- Phase 7: Minimal ModifierSystem / MBF.

---

Date: 2026-05-01
Phase: 6 patch
Task: Patched Passive TriggerSystem targeting, trigger depth safety, OnCombatEnd command restriction, and OnBurnTick ownership semantics.
Files changed:
- src/combat/ResolutionStack.ts
- src/combat/commands/ApplyBurnCommand.ts
- src/combat/commands/CombatCommand.ts
- src/combat/commands/DealDamageCommand.ts
- src/combat/commands/ModifyCooldownCommand.ts
- src/combat/status/StatusEffectSystem.ts
- src/combat/triggers/TriggeredCombatCommand.ts
- src/combat/triggers/TriggerSystem.ts
- tests/combat/triggers.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- OnDamageTaken trigger DealDamage targets the opposing attacker.
- OnDamageTaken trigger GainArmor affects the damaged trigger owner.
- Recursive trigger chain stops by maxTriggerDepth.
- OnCombatEnd trigger does not mutate final HP or winner.
- OnBurnTick appliedByOwner condition does not fire without Burn source ownership tracking.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- OnCombatEnd triggers are log/replay only in MVP and do not push combat commands.
- OnBurnTick does not support source ownership conditions until Burn source tracking is added.
Next recommended task:
- Phase 7: Minimal ModifierSystem / MBF.

---

Date: 2026-05-01
Phase: 7
Task: Implemented Minimal ModifierSystem / MBF.
Files changed:
- src/index.ts
- src/combat/CombatEngine.ts
- src/combat/CooldownSystem.ts
- src/combat/DamageCalculator.ts
- src/combat/commands/ApplyBurnCommand.ts
- src/combat/commands/CombatCommand.ts
- src/combat/commands/DealDamageCommand.ts
- src/combat/modifiers/Modifier.ts
- src/combat/modifiers/ModifierHooks.ts
- src/combat/modifiers/ModifierSystem.ts
- src/combat/status/StatusEffectSystem.ts
- tests/combat/modifiers.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- tests/combat/modifiers.test.ts
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- ModifierSystem supports only damage, cooldown recovery rate, and status duration operations.
- Formula rewriting, rollback/snapshot, random modifiers, Barrier, Ward, Energy Shield, absorb layers, and UI are not implemented.
Next recommended task:
- Phase 8: ReplayTimeline and CombatResultSummary.

---

Date: 2026-05-01
Phase: 7 patch
Task: Patched Minimal ModifierSystem owner scoping, integer math, and BurnTick modifier behavior before Phase 8.
Files changed:
- src/combat/modifiers/ModifierSystem.ts
- src/combat/status/StatusEffectSystem.ts
- tests/combat/modifiers.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Player-owned damage modifier does not modify enemy DealDamage.
- Enemy-owned damage modifier does not modify player DealDamage.
- Player-owned cooldown recovery modifier does not speed up enemy card cooldown.
- Decimal damage modifier result is rounded deterministically.
- Decimal cooldown recovery modifier result is rounded deterministically.
- BurnTick does not receive source-owned damage modifiers while Burn source tracking is absent.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Burn still does not track sourceCombatant/sourceCard, so source-owned damage modifiers and source ownership conditions do not apply to BurnTick.
Next recommended task:
- Phase 8: ReplayTimeline and CombatResultSummary.

---

Date: 2026-05-01
Phase: 8
Task: Implemented ReplayTimeline and CombatResultSummary.
Files changed:
- src/index.ts
- src/model/result.ts
- src/replay/ReplayEvent.ts
- src/replay/ReplayTimeline.ts
- src/combat/CombatEngine.ts
- src/combat/CombatResultSummaryBuilder.ts
- src/combat/DamageCalculator.ts
- src/combat/commands/ApplyBurnCommand.ts
- src/combat/commands/GainArmorCommand.ts
- src/combat/commands/ModifyCooldownCommand.ts
- src/combat/status/StatusEffectSystem.ts
- src/combat/triggers/TriggerSystem.ts
- tests/replay/replayTimeline.test.ts
- tests/combat/summary.test.ts
- tests/combat/armorBurn.test.ts
- tests/combat/basicCombat.test.ts
- tests/combat/resolutionStack.test.ts
- tests/combat/triggers.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- tests/replay/replayTimeline.test.ts
- tests/combat/summary.test.ts
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- ReplayTimeline remains player-facing; stack limit/debug detail stays in CombatLog.
- Stack viewer / modifier trace remain dev-only and UI is not implemented.
Next recommended task:
- Phase 9: Monster Templates.

---

Date: 2026-05-01
Phase: 9
Task: Implemented monster templates and deterministic monster formation generation.
Files changed:
- data/cards/monster_cards.json
- data/monsters/training_dummy.json
- data/monsters/rust_bandit.json
- data/monsters/burn_apprentice.json
- data/monsters/shield_guard.json
- data/monsters/drum_tactician.json
- data/monsters/fire_echo_adept.json
- data/monsters/gate_captain.json
- src/index.ts
- src/content/cards/monsterCards.ts
- src/content/monsters/MonsterTemplate.ts
- src/content/monsters/monsterTemplates.ts
- src/content/monsters/MonsterGenerator.ts
- tests/content/monsterGenerator.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- tests/content/monsterGenerator.test.ts
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Monster content uses existing MVP command/status/trigger grammar only.
- BurnTick damage remains summarized as `statusDamage.Burn` and is not attributed to the applying card until Burn source tracking is implemented later.
- Size 2 monster cards occupy a starting slot and mark the adjacent slot locked for readable FormationSnapshot output; CombatEngine behavior is unchanged.
Next recommended task:
- Phase 10: Minimal UI Prototype.

---

Date: 2026-05-01
Phase: 9 patch
Task: Clarified JSON source of truth for monster cards/templates and added content drift validation.
Files changed:
- tsconfig.json
- src/content/cards/monsterCards.ts
- src/content/monsters/monsterTemplates.ts
- tests/content/monsterGenerator.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- JSON monster card exports match runtime card content.
- JSON monster templates are exported through MONSTER_TEMPLATES.
- JSON monster cards validate with validateCardDefinition.
- Template card references and rewardPool ids exist in monster card definitions.
- Templates include non-empty engine, payoff, weakness, and rewardPool fields.
- Fixed templates are deterministic across different seeds.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Optional monster cards currently shuffle and fill all fitting slots.
- Future balancing may add maxOptionalCards/minOptionalCards/day scaling.
- Phase 10 UI must render locked adjacent slots as occupied by the size-2 card footprint.
Next recommended task:
- Phase 10: Minimal UI Prototype.

---

Date: 2026-05-01
Phase: 10
Task: Implemented Minimal UI prototype.
Files changed:
- index.html
- package.json
- pnpm-lock.yaml
- tsconfig.json
- vite.config.ts
- vitest.config.ts
- src/ui/main.tsx
- src/ui/App.tsx
- src/ui/styles.css
- src/ui/state/initialState.ts
- src/ui/state/uiState.ts
- src/ui/components/CardView.tsx
- src/ui/components/ChestPanel.tsx
- src/ui/components/FormationSlot.tsx
- src/ui/components/FormationEditor.tsx
- src/ui/components/EnemyPreview.tsx
- src/ui/components/CombatReplay.tsx
- src/ui/components/ResultSummary.tsx
- tests/ui/uiState.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- tests/ui/uiState.test.ts
How to run:
- pnpm dev
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- UI uses placeholder visuals only.
- UI state is local and temporary; persistent run inventory/economy belongs to Phase 11.
- No shop, event, reward, save/load, async PvP, animation polish, or final art is implemented.
Next recommended task:
- Phase 11: MVP Run Loop.

---

Date: 2026-05-01
Phase: 10 patch
Task: Improved UI layout/readability and size-2 card presentation before Phase 11.
Files changed:
- src/ui/App.tsx
- src/ui/styles.css
- src/ui/state/uiState.ts
- src/ui/components/CardView.tsx
- src/ui/components/EnemyPreview.tsx
- src/ui/components/FormationEditor.tsx
- src/ui/components/FormationSlot.tsx
- src/ui/presentation/cardDisplay.ts
- tests/ui/uiState.test.ts
- tests/ui/cardDisplay.test.ts
- tests/ui/formationPresentation.test.tsx
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Card removal from formation succeeds even when ownedCards length equals chest capacity.
- Size 2 placement still produces locked footprint in UI state.
- Card display summaries for Rusty Blade, Wooden Shield, Flame Spear, Spark Drum, and Fire Echo Seal.
- Player and enemy size 2 cards render as one wide visual block.
How to run:
- pnpm dev
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Layout and visuals remain placeholder MVP UI.
- Phase 10 initial owned cards are prototype-only for manual UI testing.
- Phase 11 RunManager must replace local UI state later and enforce chest capacity when adding cards through shop/event/reward.
Next recommended task:
- Phase 11: MVP Run Loop.

---

Date: 2026-05-01
Phase: 11
Task: Implemented deterministic MVP Run Loop.
Files changed:
- src/index.ts
- src/run/RunState.ts
- src/run/RunManager.ts
- src/run/deterministic.ts
- src/run/economy.ts
- src/run/nodes/ShopNode.ts
- src/run/nodes/EventNode.ts
- src/run/nodes/BattleNode.ts
- src/run/rewards/RewardGenerator.ts
- tests/run/runManager.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- tests/run/runManager.test.ts
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Run loop is headless only; Phase 10 UI still uses local prototype state until future integration.
- Linear node sequence is implemented without branching.
- DRAW is treated as DEFEAT for MVP.
- Save/load is not implemented yet.
Next recommended task:
- Phase 12: Save And Load.

Date: 2026-05-04
Phase: 11B run-control and choice readability patch
Task: Paused level-up progression until explicit reward selection, added duplicate card auto-upgrades across acquisition paths, and cleaned player-facing choice/passive/result summary text before Phase 12.
Files changed:
- src/content/cards/effectiveCardDefinition.ts
- src/run/RunManager.ts
- src/run/rewards/RewardGenerator.ts
- src/ui/App.tsx
- src/ui/components/EnemyPreview.tsx
- src/ui/components/ResultSummary.tsx
- src/ui/presentation/cardDisplay.ts
- src/ui/presentation/choiceDisplay.ts
- tests/run/runManager.test.ts
- tests/ui/cardDisplay.test.ts
- tests/ui/resultSummary.test.tsx
- tests/ui/runPresentation.test.tsx
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Level-up thresholds create deterministic pending choices and pause progression until selection.
- Level-up skill, upgrade, and gold choices apply through RunManager state.
- Shop, event, reward, and level-up card acquisition use duplicate auto-upgrade behavior.
- Event card choice display uses full readable card metadata.
- Passive trigger summaries hide code hook names such as OnStatusApplied.
- ResultSummary resolves raw source ids to readable card names, hides zero rows, and shows top contributors/status damage.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Save/load is not implemented; Phase 12 should persist/restore RunState, including pendingLevelUpChoices, shopStates, ownedSkills, tierOverride, and duplicate-upgrade messages/state as needed.
- Skills remain minimal standalone owned rewards, not a skill tree.
- Raw ids and ticks may still appear in dev CombatLog/debug JSON only.
Next recommended task:
- Phase 12: Save And Load.

---

Date: 2026-05-01
Phase: 11 playable loop completion
Task: Completed playable deterministic MVP run loop to level 10 and wired UI to RunManager.
Files changed:
- src/index.ts
- src/model/card.ts
- src/replay/time.ts
- src/run/RunState.ts
- src/run/RunManager.ts
- src/run/nodes/EventNode.ts
- src/run/rewards/RewardGenerator.ts
- src/ui/App.tsx
- src/ui/components/CombatReplay.tsx
- tests/replay/replayTimeline.test.ts
- tests/run/runManager.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Expanded tests/run/runManager.test.ts for run start, EXP/leveling, inventory/chest, battle/reward, deterministic progression, level 10 boss victory, loss/draw defeat.
- Added formatTicksAsSeconds coverage in tests/replay/replayTimeline.test.ts.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Save/load is not implemented; Phase 12 should persist the new RunState model.
- UI remains placeholder MVP presentation and does not add final art or animation polish.
- Card upgrade rewards use CardInstance.tierOverride for runtime rewards/economy; combat behavior still comes from base CardDefinition content.
- The run is deterministic and linear/repeating only; no branching map or async PvP.
Next recommended task:
- Phase 12: Save And Load.

---

Date: 2026-05-01
Phase: 11 UI/replay/debug patch
Task: Patched Phase 11 UI readability, player-facing replay formatting, and debug replay export before Phase 12.
Files changed:
- .gitignore
- package.json
- scripts/exportSampleCombatReplay.ts
- src/debug/sampleCombatReplayExport.ts
- src/index.ts
- src/ui/App.tsx
- src/ui/components/ChoiceCard.tsx
- src/ui/components/CombatReplay.tsx
- src/ui/components/EnemyPreview.tsx
- src/ui/components/FormationSlot.tsx
- src/ui/components/RunStatusBar.tsx
- src/ui/presentation/choiceDisplay.ts
- src/ui/presentation/replayDisplay.ts
- src/ui/presentation/runStatusDisplay.ts
- src/ui/styles.css
- tests/debug/sampleCombatReplayExport.test.ts
- tests/replay/replayTimeline.test.ts
- tests/ui/runPresentation.test.tsx
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Run status display labels Gold, Level, EXP, HP clearly.
- Empty formation slots render Slot N and Empty as separate elements.
- Shop choice display uses card names and cooldown seconds instead of raw ids.
- Upgrade reward display shows fromTier -> toTier.
- Player-facing replay formatting uses seconds and omits internal payload fields.
- Debug sample replay export returns serializable CombatResult/ReplayTimeline/Summary/CombatLog data.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
- pnpm export:sample-replay
Known issues:
- Save/load is not implemented; Phase 12 should persist/restore RunState.
- CardInstance.tierOverride affects run economy/display and reward presentation but does not scale combat stats or card effects yet.
- UI remains placeholder MVP presentation without final art or animation polish.
Next recommended task:
- Phase 12: Save And Load.

---

Date: 2026-05-04
Phase: 11 UI card summary readability patch
Task: Replaced player-facing card summary tick formatting with seconds without changing combat rules or card data.
Files changed:
- src/ui/presentation/cardDisplay.ts
- src/ui/components/CardView.tsx
- tests/ui/cardDisplay.test.ts
- tests/ui/runPresentation.test.tsx
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Burn duration displays seconds instead of raw ticks.
- ModifyCooldown displays signed seconds instead of raw ticks.
- Card summaries do not include raw tick suffixes for tick values.
- Card metadata cooldown display renders seconds.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Save/load is not implemented; Phase 12 should persist/restore RunState.
- Raw ticks may still appear in dev CombatLog/debug JSON only.
- CardInstance.tierOverride affects run economy/display and reward presentation but does not scale combat stats or card effects yet.
Next recommended task:
- Phase 12: Save And Load.

---

Date: 2026-05-04
Phase: 11B
Task: Patched run-loop correctness before Phase 12: shop leave flow, reward reveal/drop priority, minimal skill ownership, and effective upgrade scaling.
Files changed:
- src/content/cards/effectiveCardDefinition.ts
- src/index.ts
- src/model/formation.ts
- src/run/RunManager.ts
- src/run/RunState.ts
- src/run/rewards/RewardGenerator.ts
- src/run/skills/Skill.ts
- src/run/skills/skillDefinitions.ts
- src/debug/sampleCombatReplayExport.ts
- src/ui/App.tsx
- src/ui/components/CardView.tsx
- src/ui/components/ChoiceCard.tsx
- src/ui/components/ResultSummary.tsx
- src/ui/components/SkillPanel.tsx
- src/ui/presentation/choiceDisplay.ts
- src/ui/styles.css
- tests/run/runManager.test.ts
- tests/ui/runPresentation.test.tsx
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Shop purchase stays on shop node, supports multiple buys, marks purchased choices, and leaveShop grants EXP once.
- Event choice still auto-advances.
- Battle victory records reward reveal source and prioritizes monster-used cards before rewardPool/fallback.
- RunState includes ownedSkills, skill rewards can be selected, and player FormationSnapshot includes owned skills.
- Upgraded card tierOverride affects combat result through effective card definitions.
- Upgrade preview shows before/after values and cooldown seconds.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Save/load is not implemented; Phase 12 should persist/restore RunState including shopStates, ownedSkills, pending rewards, and tierOverride.
- Skills are minimal modifier-based rewards only; no skill tree or new skill hooks/statuses/resources were added.
- Raw ticks may still appear in dev CombatLog/debug JSON only.
Next recommended task:
- Phase 12: Save And Load.

---

Date: 2026-05-04
Phase: 11B reward upgrade/scaling patch
Task: Removed direct upgrade choices from normal battle rewards and made tier upgrades produce meaningful visible/combat stat changes before Phase 12.
Files changed:
- src/content/cards/effectiveCardDefinition.ts
- src/run/RunManager.ts
- src/run/rewards/RewardGenerator.ts
- src/ui/App.tsx
- tests/content/effectiveCardDefinition.test.ts
- tests/run/runManager.test.ts
- tests/ui/runPresentation.test.tsx
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Battle reward choices do not include REWARD_UPGRADE.
- Level-up choices can still include LEVEL_UPGRADE with a non-empty preview.
- Duplicate dropped card reward selection auto-upgrades the existing owned same-tier card.
- Rusty Blade SILVER -> GOLD changes an effective stat and combat damage event amount.
- Upgrade previews omit unchanged cooldown rows.
- Meaningful-upgrade helper rejects no-op tier comparisons.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Save/load is not implemented; Phase 12 should persist/restore RunState and tierOverride exactly.
- Normal battle rewards no longer offer direct upgrade choices; duplicate dropped cards can still auto-upgrade through RunManager acquisition rules.
- Skills remain minimal standalone owned rewards, not a skill tree.
Next recommended task:
- Phase 12: Save And Load.

---

Date: 2026-05-04
Phase: 12
Task: Implemented versioned Save and Load around RunState, including validation, exact state restoration, and minimal localStorage UI controls.
Files changed:
- src/run/save/SaveManager.ts
- src/run/RunManager.ts
- src/index.ts
- src/ui/App.tsx
- src/ui/styles.css
- tests/run/saveManager.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Save/load round trip preserves exact RunState, shop choices, sold-out state, event choices, reward choices, level-up choices, formation layout, owned cards, tierOverride, owned skills, gold, level, EXP, and HP.
- Battle node saves preserve serialized enemy FormationSnapshot/currentEnemyCardInstances and completed pending combat result without rerunning combat.
- Loading a battle node uses the serialized enemy snapshot when startBattle() is called.
- Restored RunManager continues generated card instance ids without collisions.
- Invalid save version, corrupt JSON, missing required fields, unknown node type, invalid card refs, invalid formation refs, and invalid enemy snapshots fail clearly.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Saves are local-only MVP saves; no cloud save, account system, or migration UI exists.
- Save format version is 1. Future schema changes should add explicit migration or fail clearly.
- Browser UI uses localStorage only and provides placeholder Save Run, Load Run, and Clear Save buttons.
Next recommended task:
- Continue post-MVP iteration or add explicit save migration only when the RunState schema changes.

---

Date: 2026-05-04
Phase: 13A
Task: Implemented Large MVP Content Expansion Pack with active content registry, expanded cards, skills, monsters, bosses, validation, and balance notes.
Files changed:
- data/cards/general/basic_kit.json
- data/cards/general/blade_armor.json
- data/cards/general/fire_support.json
- data/cards/class_iron_warlord/blade_tempo.json
- data/cards/class_iron_warlord/command_armor.json
- data/cards/class_iron_warlord/siege_fire.json
- data/cards/monster_cards.json
- data/skills/mvp_skills.json
- data/monsters/bandit_duelist.json
- data/monsters/oil_raider.json
- data/monsters/shield_sergeant.json
- data/monsters/drum_adept.json
- data/monsters/siege_trainee.json
- data/monsters/banner_guard.json
- data/monsters/cinder_captain.json
- data/monsters/iron_patrol.json
- data/monsters/gate_captain_elite.json
- data/monsters/siege_marshal.json
- data/monsters/cinder_strategist.json
- src/content/cards/activeCards.ts
- src/content/monsters/MonsterGenerator.ts
- src/content/monsters/monsterTemplates.ts
- src/run/RunManager.ts
- src/run/nodes/EventNode.ts
- src/run/nodes/ShopNode.ts
- src/run/save/SaveManager.ts
- src/run/skills/skillDefinitions.ts
- src/ui/App.tsx
- src/debug/sampleCombatReplayExport.ts
- src/index.ts
- tests/content/activeContentRegistry.test.ts
- tests/content/monsterGenerator.test.ts
- docs/BALANCE_NOTES.md
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Active content registry includes old MVP cards plus 18 general and 18 Iron Warlord cards.
- All active cards and skills load and validate against MVP-only grammar.
- Passive triggers require internalCooldownTicks and maxTriggersPerTick.
- Monster and boss templates reference known active cards and generate valid FormationSnapshot output.
- Shop, event, reward, and save/load paths use the active registry.
- Deterministic combat smoke tests cover Blade Tempo, Burn Engine, Armor Counter, Drum Command, Siege Fire, and Hybrid Bruiser.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Only Gate Captain Elite is wired into the current final boss flow; Siege Marshal and Cinder Strategist are available for future rotation/tests.
- Burn tick damage is still not source-attributed, so some fire skill tuning should wait for future Burn source tracking.
- Monster generation still fills all fitting optional cards; future balance may add tighter optional-card counts.
Next recommended task:
- Playtest Phase 13A content, tune early rewards/monster HP, then consider boss rotation only when the run flow explicitly supports it.

---

Date: 2026-05-04
Phase: 12 validation/content-registry patch
Task: Strengthened RunState save validation domains and formation footprint checks, and made save serialization accept the active card content registry.
Files changed:
- src/run/save/SaveManager.ts
- src/ui/App.tsx
- tests/run/saveManager.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Corrupt saves fail for slot indexes outside formationSlotCount.
- Corrupt saves fail for missing size-2 locked footprints.
- Corrupt saves fail when lockedByInstanceId points to a size-1 card.
- Corrupt saves fail when a locked slot is not adjacent to its size-2 owner.
- Corrupt saves fail for locked slots that also contain a card.
- Corrupt saves fail for negative/out-of-domain gold, HP, level, EXP, counters, classId, and chest capacity.
- serializeRunState accepts an injected cardDefinitionsById map for expanded content registries.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Save format version remains 1; future schema changes still need explicit migration or fail-fast unsupported-version handling.
- Saves remain local-only MVP saves with no cloud/account sync.
Next recommended task:
- Continue post-MVP iteration or add explicit save migration only when the RunState schema changes.

---

Date: 2026-05-04
Phase: 13A correctness patch
Task: Patched Phase 13A skill/content correctness before Phase 13B.
Files changed:
- data/skills/mvp_skills.json
- docs/BALANCE_NOTES.md
- tests/content/activeContentRegistry.test.ts
- tests/content/skillDefinitions.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Fire Study modifies fire-tagged direct card damage and safely no-ops on non-fire direct damage.
- All 8 MVP skills now have concrete effect or safe no-op coverage.
- Passive trigger validation now requires non-empty known conditions when present, internalCooldownTicks > 0, and maxTriggersPerTick > 0.
- Starter shop/event and first battle reward availability sanity checks cover active and early-tier cards.
- Phase 13A card availability is checked through shop, event, and monster reward routes.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Fire support remains tag-based until card DealDamage supports explicit damageType or Burn source attribution exists.
- Burn tick damage is still not attributed to applying cards.
Next recommended task:
- Phase 13B or playtest/tuning pass using the corrected Phase 13A content.

---

Date: 2026-05-04
Phase: 13B terminal mechanics and playability tuning
Task: Added deterministic critical hits, limited terminal scaling, curated tier-aware pools, monster optional-card tuning, and terminal/core content support.
Files changed:
- data/cards/class_iron_warlord/blade_tempo.json
- data/cards/class_iron_warlord/command_armor.json
- data/cards/class_iron_warlord/siege_fire.json
- docs/BALANCE_NOTES.md
- src/combat/CombatCommandFactory.ts
- src/combat/CombatResultSummaryBuilder.ts
- src/combat/DamageCalculator.ts
- src/combat/commands/DealDamageCommand.ts
- src/content/cards/contentPools.ts
- src/content/monsters/MonsterGenerator.ts
- src/content/monsters/MonsterTemplate.ts
- src/index.ts
- src/model/result.ts
- src/run/RunManager.ts
- src/run/nodes/EventNode.ts
- src/run/nodes/ShopNode.ts
- src/run/rewards/RewardGenerator.ts
- src/ui/components/ResultSummary.tsx
- src/ui/presentation/cardDisplay.ts
- src/ui/presentation/replayDisplay.ts
- tests/combat/criticalScaling.test.ts
- tests/combat/resolutionStack.test.ts
- tests/content/activeContentRegistry.test.ts
- tests/ui/cardDisplay.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- DealDamage without crit keeps direct damage/Armor behavior and emits non-critical replay data.
- Deterministic crits appear in replay payloads and summary crit counts/damage.
- OWNER_ARMOR_PERCENT, OWNER_MAX_HP_PERCENT, TARGET_MISSING_HP_PERCENT, and target-HP conditional multipliers are covered.
- Terminal/core Iron Warlord cards and their support cards are validated against active content.
- Curated starter, early, mid, late, terminal, build-vital, boss, skill, and archetype pools reference known cards.
- Starter shop/event remain active-card safe, early rewards avoid only late-game tiers, and late rewards trend toward better role quality.
- Monster optional-card scaling keeps early monsters simpler than elite/boss formations.
- Armor Terminal and Crit Execution deterministic combat smokes were added, plus terminal builds outperform starter-only builds.
- Card display covers crit, scaling, and conditional multiplier player-facing text.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Crit applies only to direct DealDamage effects and does not apply to Burn ticks.
- Terminal scaling is intentionally limited to current Armor, max HP, and target missing HP; Armor is not consumed.
- Fire support remains tag-based until DealDamage supports explicit damageType or Burn source attribution exists.
- Boss rotation is still not implemented; Gate Captain Elite remains the wired final boss.
Next recommended task:
- Playtest Phase 13B curves across several seeds, then tune card/monster numbers before adding any new mechanics.

---

Date: 2026-05-04
Phase: 13B terminal tuning patch
Task: Tightened deterministic crit seeding and improved late shop/reward terminal exposure before Phase 14.
Files changed:
- src/combat/commands/DealDamageCommand.ts
- src/content/cards/contentPools.ts
- src/run/nodes/ShopNode.ts
- src/run/rewards/RewardGenerator.ts
- tests/combat/criticalScaling.test.ts
- tests/content/activeContentRegistry.test.ts
- tests/run/saveManager.test.ts
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Same combat input still produces identical crit sequences.
- Different opponent formation ids can produce different deterministic crit sequences.
- Level 8+ rewards include at least one terminal or high-quality build card when valid terminal cards are available.
- Level 8+ shops include at least one high-quality terminal/payoff/engine/connector card when available.
- Level 1-2 shops and rewards stay Bronze/Silver and avoid late-game terminal feel.
- Saved shop and reward choices do not reroll through late-quality curation after save/load.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Crit seeding is still deterministic combat-state hashing, not nondeterministic randomness.
- Late anchors improve exposure but do not guarantee a perfect build or remove build-vital Bronze/Silver cards.
Next recommended task:
- Proceed to Phase 14 after manual playtest confirms late reward/shop surfaces feel stronger without becoming scripted.

---

Date: 2026-05-04
Phase: Phase 14 planning docs patch
Task: Replaced the old Phase 14 PvP snapshot export plan with the new status/damage foundation sequence.
Files changed:
- docs/MVP_BUILD_SEQUENCE.md
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- None; documentation-only patch.
How to run:
- Not run; no code changed.
Known issues:
- Async PvP and PvP snapshot export are intentionally deferred to a future phase after combat readability and mechanics are stronger.
- Phase 14 is now split into 14A damage type/source attribution, 14B Poison/Heal, 14C Haste/Slow/Freeze, 14D status reactions, and 14E Burn decay identity polish.
Next recommended task:
- Implement Phase 14A only: Damage type and source attribution foundation.

---

Date: 2026-05-04
Phase: 14A
Task: Implemented damage type and Burn source attribution foundation.
Files changed:
- src/combat/CombatCommandFactory.ts
- src/combat/CombatResultSummaryBuilder.ts
- src/combat/DamageCalculator.ts
- src/combat/commands/ApplyBurnCommand.ts
- src/combat/commands/DealDamageCommand.ts
- src/combat/status/Burn.ts
- src/combat/status/StatusEffect.ts
- src/combat/status/StatusEffectSystem.ts
- src/model/result.ts
- src/ui/components/ResultSummary.tsx
- src/ui/presentation/cardDisplay.ts
- src/validation/cardValidation.ts
- tests/combat/armorBurn.test.ts
- tests/combat/summary.test.ts
- tests/content/activeContentRegistry.test.ts
- tests/run/runManager.test.ts
- tests/run/saveManager.test.ts
- tests/ui/resultSummary.test.tsx
- tests/validation/cardValidation.test.ts
- docs/BALANCE_NOTES.md
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Existing DealDamage without damageType remains DIRECT and compatible with Armor/crit/scaling behavior.
- Explicit PHYSICAL and FIRE DealDamage damage types appear in replay payloads and remain Armor-reduced.
- ApplyBurn stores source combatant/card attribution and merged Burn source contribution buckets.
- Burn tick damage is attributed to the applying card in CombatResultSummary while total statusDamage.Burn remains present.
- Burn still ignores Armor.
- Save/load preserves attributed combat result payloads without persisting runtime status arrays into RunState.
- Same combat input produces identical attributed replay and summary.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Fire Study remains tag-based and has not migrated to damageType FIRE conditions.
- Burn attribution is replay/summary-only; Burn ticks still do not receive source-owned damage modifiers and no status reactions were added.
Next recommended task:
- Phase 14B: Poison and Heal pack, using the Phase 14A attribution foundation.

---

Date: 2026-05-04
Phase: 14B
Task: Implemented Poison and Heal pack.
Files changed:
- data/cards/general/poison_heal.json
- src/combat/CombatCommandFactory.ts
- src/combat/CombatResultSummaryBuilder.ts
- src/combat/DamageCalculator.ts
- src/combat/commands/ApplyBurnCommand.ts
- src/combat/commands/ApplyPoisonCommand.ts
- src/combat/commands/HealHPCommand.ts
- src/combat/modifiers/Modifier.ts
- src/combat/modifiers/ModifierSystem.ts
- src/combat/status/Burn.ts
- src/combat/status/Poison.ts
- src/combat/status/StatusEffect.ts
- src/combat/status/StatusEffectSystem.ts
- src/combat/triggers/TriggerDefinition.ts
- src/combat/triggers/TriggerSystem.ts
- src/content/cards/activeCards.ts
- src/content/cards/contentPools.ts
- src/content/cards/effectiveCardDefinition.ts
- src/index.ts
- src/model/result.ts
- src/replay/ReplayTimeline.ts
- src/ui/components/ResultSummary.tsx
- src/ui/presentation/cardDisplay.ts
- src/ui/presentation/replayDisplay.ts
- src/validation/cardValidation.ts
- tests/combat/poisonHeal.test.ts
- tests/content/activeContentRegistry.test.ts
- tests/replay/replayTimeline.test.ts
- tests/run/runManager.test.ts
- tests/run/saveManager.test.ts
- tests/ui/cardDisplay.test.ts
- tests/ui/resultSummary.test.tsx
- tests/validation/cardValidation.test.ts
- docs/BALANCE_NOTES.md
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Poison applies, ticks every 60 ticks, ignores Armor, stacks additively, keeps source attribution, and does not naturally expire.
- Poison summary total and by-card attribution are covered.
- HealHP restores HP, caps at max HP, emits replay events, and contributes healingByCard summary data.
- Invalid ApplyPoison effects are ignored by the command factory and malformed ApplyPoison/HealHP fields are validation-covered.
- Save/load preserves attributed Burn/Poison/heal combat result payloads without persisting runtime status arrays into RunState.
- Same combat input produces the same Poison replay and summary.
- Phase 14B content registry, card display, replay display, and curated pools are covered.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Poison has no decay in Phase 14B and can pressure timeout-style fights if tuned too high.
- HealHP has no lifesteal, overheal, or absorb behavior; it only restores HP to max HP.
- No Haste, Slow, Freeze, Burn decay, status reactions, or new resources were added.
Next recommended task:
- Phase 14C: Haste, Slow, and Freeze control pack.

---

Date: 2026-05-04
Phase: 14C
Task: Implemented Haste, Slow, and Freeze control pack.
Files changed:
- data/cards/general/control.json
- src/combat/CombatCommandFactory.ts
- src/combat/CombatEngine.ts
- src/combat/CombatResultSummaryBuilder.ts
- src/combat/CooldownSystem.ts
- src/combat/commands/ApplyControlStatusCommand.ts
- src/combat/commands/ApplyFreezeCommand.ts
- src/combat/commands/ApplyHasteCommand.ts
- src/combat/commands/ApplySlowCommand.ts
- src/combat/status/ControlStatus.ts
- src/combat/types.ts
- src/content/cards/activeCards.ts
- src/content/cards/contentPools.ts
- src/index.ts
- src/model/result.ts
- src/ui/components/ResultSummary.tsx
- src/ui/presentation/cardDisplay.ts
- src/validation/cardValidation.ts
- tests/combat/controlStatus.test.ts
- tests/content/activeContentRegistry.test.ts
- tests/replay/replayTimeline.test.ts
- tests/run/saveManager.test.ts
- tests/ui/cardDisplay.test.ts
- tests/ui/resultSummary.test.tsx
- tests/validation/cardValidation.test.ts
- docs/BALANCE_NOTES.md
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- Haste increases cooldown recovery while active and preserves 50% Haste partial-cooldown timing.
- Haste stacks additively, clamps to +100%, and cannot create same-tick runaway activations.
- Slow reduces cooldown recovery while active, expires back to normal recovery, and clamps at minimum 25% recovery.
- Freeze pauses cooldown recovery, preserves progress, blocks frozen ready cards from activating, expires deterministically, and extends to the later expiration when reapplied.
- Haste, Slow, and Freeze do not affect Burn or Poison tick intervals, durations, or Armor-ignoring DOT behavior.
- Haste/Slow/Freeze combine deterministically with existing cooldown recovery modifiers.
- Control replay events and CombatResultSummary control application attribution are deterministic.
- Poison + Heal + Slow remains bounded by maxCombatTicks, and conservative Freeze chains still allow enemy cards to act.
- ApplyHaste/ApplySlow/ApplyFreeze malformed fields and invalid command targets are validation/command-factory covered.
- Save/load preserves control replay/summary data without persisting combat-only controlStatuses into RunState.
- Phase 14C content registry, curated pools, card display, replay display, and ResultSummary UI readability are covered.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Haste/Slow/Freeze are card cooldown/activation controls only; no status reaction payoffs, cleanse, silence, card movement, or card destruction were added.
- Freeze-ready activation is gated at activation time when a higher-priority card applies Freeze earlier in the same tick; frozen cards activate on the next eligible tick after Freeze expires.
- Control application summary counts applications by source card but does not yet report uptime or prevented activations.
Next recommended task:
- Phase 14D: status reaction/combo support, keeping Phase 14A-C attribution and DOT safety rules intact.

---

Date: 2026-05-04
Phase: 14D
Task: Implemented status reaction/combo support.
Files changed:
- data/cards/general/control.json
- data/cards/general/reactions.json
- src/combat/CombatEngine.ts
- src/combat/commands/ApplyControlStatusCommand.ts
- src/combat/commands/HealHPCommand.ts
- src/combat/status/StatusEffectSystem.ts
- src/combat/triggers/TriggerDefinition.ts
- src/combat/triggers/TriggerSystem.ts
- src/content/cards/activeCards.ts
- src/content/cards/contentPools.ts
- src/ui/presentation/cardDisplay.ts
- src/validation/cardValidation.ts
- tests/combat/statusReactions.test.ts
- tests/content/activeContentRegistry.test.ts
- tests/run/saveManager.test.ts
- tests/ui/cardDisplay.test.ts
- tests/validation/cardValidation.test.ts
- docs/BALANCE_NOTES.md
- PROJECT_LOG.md
- HANDOFF.md
Tests added:
- OnStatusTicked fires for Burn and Poison DOT damage.
- OnHealReceived fires only when HealHP actually restores HP and does not fire for zero healing.
- Poison ticks can trigger HealHP reactions through ResolutionStack.
- Burn ticking on a Poisoned enemy can trigger bonus Fire damage.
- Heal received can trigger GainArmor.
- internalCooldownTicks and maxTriggersPerTick prevent reaction spam.
- triggerDepth and ResolutionStack safety still bound recursive OnHealReceived loops.
- Reaction-created status commands do not create same-tick DOT loops.
- Passive control reactions target active runtime cards only and never passive cards.
- Passive SELF Haste/Slow resolves to no target, while adjacent/opposite passive-slot anchoring works for active targets.
- Haste, Slow, and Freeze reactions do not affect Burn or Poison tick intervals.
- Same combat input produces identical reaction replay and summary.
- Save/load preserves reaction replay/result data without persisting combat-only reaction runtime state into RunState.
- Phase 14D content registry, validation, card display, and readable reaction summaries are covered.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- Reaction summaries count TriggerFired by card through existing summary data; they do not break down reaction uptime or prevented activations.
- Control-status payoff conditions such as "enemy card is Frozen" are deferred.
- OnBurnTick remains as legacy Burn-only trigger support; new reaction content uses OnStatusTicked.
- No Burn decay, Vulnerable, Silence, Cleanse, MoveCard, DisableCard, card destruction, lifesteal keyword, overheal, absorb layer, or new resource was added.
Next recommended task:
- Phase 14E: Burn decay identity polish, preserving Phase 14A-D status attribution, reaction safety, and DOT clock readability.

---

Date: 2026-05-04
Phase: 14E
Task: Implemented Burn decay identity polish.
Files changed:
- data/cards/monster_cards.json
- data/cards/general/basic_kit.json
- data/cards/general/fire_support.json
- data/cards/class_iron_warlord/siege_fire.json
- src/combat/status/Burn.ts
- src/combat/status/StatusEffectSystem.ts
- src/ui/presentation/cardDisplay.ts
- tests/combat/armorBurn.test.ts
- tests/combat/poisonHeal.test.ts
- tests/combat/statusReactions.test.ts
- tests/combat/controlStatus.test.ts
- tests/content/activeContentRegistry.test.ts
- tests/ui/cardDisplay.test.ts
- docs/BALANCE_NOTES.md
- PROJECT_LOG.md
- HANDOFF.md
Tests added/updated:
- Burn ticks every 60 ticks, deals current amount before decay, decays by 1 after each tick, and expires at amount 0.
- Burn duration remains a max lifetime and can expire Burn before decay reaches 0.
- Burn stacking adds amount, keeps the earlier nextTickAt, extends to the later expiresAtTick, and remains deterministic.
- Burn source contribution buckets decay with Burn amount, keep attribution sums aligned on later ticks, and remove zero buckets.
- The 4 Burn for 5s example now produces 4, 3, 2, 1 damage and expires before the 5s max lifetime tick.
- Poison remains persistent, additive, one-second, Armor-ignoring DOT and its source contributions do not decay.
- OnStatusTicked fires once per actual Burn tick and not for Burn decay or expiration.
- Reaction-created Burn uses the same decay rule and starts ticking at appliedAtTick + 60 rather than the same tick.
- Haste, Slow, and Freeze regression tests still prove control effects do not change Burn or Poison DOT clocks.
- Active runtime content is asserted to avoid legacy OnBurnTick while TriggerDefinition/TriggerSystem still accept it.
- Card display now distinguishes decaying Burn from non-decaying Poison without raw tick labels.
Tuning/content notes:
- Guarded Torch, Burning Shield, Kindling Spear, and Cinder Seal moved from 1 Burn to 2 Burn so single-application Burn remains readable after decay.
- Poison, Heal, Haste, Slow, and Freeze values were not raised.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
Known issues:
- OnBurnTick remains as deprecated legacy compatibility and should be removed only in a future save/content compatibility cleanup.
- Burn/Poison DOT source attribution is still replay/summary/reaction ownership data only; source-owned damage modifiers and Fire Study do not boost DOT ticks.
- No new statuses, trigger hooks, control payoff conditions, cleanse/silence, card movement/destruction, absorb layers, resources, or PvP work were added.
Next recommended task:
- Run a balance/readability playtest pass focused on Burn vs Poison identity, reaction clarity, and terminal build pacing before adding new mechanics.

---

Date: 2026-05-04
Phase: 15A
Task: Implemented build surface expansion and deterministic balance/readability report foundation.
Files changed:
- data/cards/general/phase15_combo_tools.json
- data/cards/class_iron_warlord/phase15_build_archetypes.json
- scripts/runBalanceReport.ts
- src/debug/BalanceReport.ts
- src/content/cards/activeCards.ts
- src/content/cards/contentPools.ts
- src/model/formation.ts
- src/run/RunManager.ts
- src/run/save/SaveManager.ts
- src/ui/App.tsx
- src/ui/components/ChestPanel.tsx
- src/ui/state/uiState.ts
- src/ui/styles.css
- tests/content/activeContentRegistry.test.ts
- tests/debug/balanceReport.test.ts
- tests/run/runManager.test.ts
- tests/run/saveManager.test.ts
- tests/ui/formationPresentation.test.tsx
- tests/ui/uiState.test.ts
- docs/BALANCE_NOTES.md
- PROJECT_LOG.md
- HANDOFF.md
Tests added/updated:
- New runs start with 4 formation slots and fixed chestCapacity 16.
- Formation slots grow by level to 6, 8, 10, 12, 14, and 16 while preserving existing placements and size-2 locked footprints.
- Save/load preserves grown formation slot count, exact formation layout, and fixed chestCapacity 16.
- Owned card capacity is capped at 16 and save validation rejects ownedCards beyond fixed capacity.
- UI state and formation presentation render expanded 16-slot formations without using the old slot-count x 2 chest rule.
- Phase 15A cards validate, are included in active content, appear in curated pools, and do not use legacy OnBurnTick.
- Starter pools remain simple while mid/late pools expose engines, bridges, and terminals.
- Balance report sample fixtures create valid FormationSnapshot values, required build ids exist, report output is deterministic for a seed, and report entries include warnings, damage, status damage, healing, armor, activations, triggers, crits, and contributors.
Content added:
- 14 general combo tools covering fast chip, Burn/Poison frequency, modest Haste/cooldown support, status bridges, Heal/Armor bridges, and neutral terminals.
- 10 Iron Warlord archetype cards covering crit execution, cooldown engines, Burn siege bridges, Poison/Heal support, Armor terminals, and late payoffs.
Report command:
- pnpm balance:report
- Outputs gitignored JSON and Markdown at debug/balance-reports/latest.json and debug/balance-reports/latest.md.
How to run:
- pnpm test
- pnpm typecheck
- pnpm build
- pnpm balance:report
Known issues:
- Balance report warning thresholds are first-pass deterministic heuristics, not final balance judgments.
- New Phase 15A numbers are intentionally conservative enough for combo testing but still need playtest tuning from report output.
- Enemy formations remain smaller/readable in this phase; only player formation growth reaches 16 slots.
- No new statuses, commands, hooks, targeting modes, resources, defense layers, combat timing rules, or progression/save models were added.
Next recommended task:
- Phase 15B: use balance report output and manual playtests to tune card numbers, report thresholds, and readability before adding mechanics.
