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
