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
- CombatEngine supports only direct `{ type: "DealDamage", amount: number }` active card effects.
- No ResolutionStack, CombatCommand, Armor behavior, Burn behavior, triggers, ModifierSystem, or UI implemented yet.
- Combat ends immediately when a combatant reaches 0 HP during ordered same-tick resolution.
Next recommended task:
- Phase 4: CombatCommand and ResolutionStack.
