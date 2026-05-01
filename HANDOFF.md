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
Phase 5 complete.
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
Burn runtime status is implemented, ticks every 60 logic ticks, stacks additively, and expires by integer tick duration.
MVP rule: Burn goes through DamageCalculator but ignores Armor so DOT keeps a clear tactical role.
Smoke, model export, validation, basic combat, ResolutionStack, and Armor/Burn tests pass.
Passive triggers, ModifierSystem, Freeze, Haste, Vulnerable, Barrier, Ward, Energy Shield, absorb layers, and UI are not implemented yet.
```



## Next Task

Phase 6:

```text
Implement Passive TriggerSystem.
```

## Rules For Next Agent

```text
1. Read docs/MVP_MASTER_DESIGN.md first.
2. Implement only the requested phase from docs/MVP_BUILD_SEQUENCE.md.
3. Do not build UI yet.
4. Use `effect.command`, not `effect.type`, for combat effect grammar.
5. Do not implement Barrier, Ward, Energy Shield, or absorb layers.
6. Add tests when code is implemented.
7. Update PROJECT_LOG.md.
8. Update HANDOFF.md.
9. Create a git commit after each completed phase so the phase is easy to review.
10. Stop after task completion.
```

## Recommended First Prompt

Use Phase 6 prompt from `docs/MVP_BUILD_SEQUENCE.md`.
