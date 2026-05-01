# PROJECT_LOG

Update this after every Codex task.

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
