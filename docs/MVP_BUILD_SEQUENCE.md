# Magic Sanguo MVP Build Sequence

This file contains complete Codex prompts for every MVP phase.

Codex should work phase by phase and stop after each phase.

Do not ask Codex to build the whole game at once.

---

## Global Prompt Header

Use this header at the top of every Codex task:

```text
You are working on Magic Sanguo, a The Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Critical rules:
- Work only on the requested phase.
- Keep combat deterministic.
- 1 second = 60 logic ticks.
- No mid-combat player input.
- Do not invent new commands, statuses, resources, or hooks beyond the MVP_MASTER_DESIGN.md scope.
- If a new primitive is needed, propose it in HANDOFF.md instead of implementing it silently.
- Add or update tests for code changes.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop after the requested phase and wait for review.
```

---

## Phase 0 — MVP Documentation

### Goal

Create the MVP documentation source of truth.

### Deliverables

```text
docs/MVP_MASTER_DESIGN.md
docs/MVP_BUILD_SEQUENCE.md
README.md
PROJECT_LOG.md
HANDOFF.md
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Task:
Create the initial MVP documentation files.

Create:
- docs/MVP_MASTER_DESIGN.md
- docs/MVP_BUILD_SEQUENCE.md
- README.md
- PROJECT_LOG.md
- HANDOFF.md

The MVP design must state:
- Player starts with 0 cards and initial gold/resources.
- First two nodes are shop/event nodes.
- First real combat happens only after the player can get at least one active card.
- Combat is automatic after Start Battle.
- No mid-combat player input.
- 1 second = 60 logic ticks.
- Same cooldown tick resolves left to right.
- No Barrier, Ward, Energy Shield, or temporary absorb layer in MVP.
- MVP defense uses HP + Armor only.
- All combatants use FormationSnapshot.
- Future async PvP will use FormationSnapshot but is not part of MVP.
- Codex must work phase by phase and stop.

Do not implement code.

After finishing:
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop.
```

---

## Phase 1 — TypeScript Project Skeleton

### Goal

Create the project foundation.

### Deliverables

```text
package.json
tsconfig.json
vitest.config.ts
src/
tests/
data/
docs/
README.md updated
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 1: TypeScript project skeleton.

Scope:
- Use TypeScript.
- Use pnpm.
- Use Vitest for tests.
- Create src/, tests/, data/, and docs/ folders if missing.
- Add package.json scripts:
  - "test"
  - "test:watch"
  - "typecheck"
  - "build"
- Add tsconfig.json.
- Add vitest.config.ts.
- Add a simple smoke test.
- Update README.md with local setup and test commands.

Hard constraints:
- Do not implement gameplay.
- Do not implement combat.
- Do not implement cards.
- Do not implement UI.
- Do not add dependencies beyond what is needed for TypeScript and Vitest.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md with files changed, tests added, and commands.
- Update HANDOFF.md with current state and next task.
- Stop and summarize changed files.
```

---

## Phase 2 — Core Data Model And Validation

### Goal

Implement data structures only.

### Deliverables

```text
src/model/formation.ts
src/model/card.ts
src/model/combat.ts
src/model/result.ts
src/validation/cardValidation.ts
src/validation/formationValidation.ts
tests/model/
tests/validation/
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 2: Core data model and validation.

Scope:
Create TypeScript types/interfaces for:
- CombatantKind
- FormationSnapshot
- FormationSlotSnapshot
- CardDefinition
- CardInstance
- CardRuntimeState
- CombatState
- CombatantState
- CombatResult
- CombatResultSummary
- ReplayTimeline
- ReplayEvent

Create validation helpers for:
- CardDefinition
- FormationSnapshot

Validation should check:
- Card id exists and is non-empty.
- Card tier is valid.
- Card type is valid.
- Card size is 1 or 2 only.
- Active cards must have cooldownTicks > 0.
- Passive cards must have triggers.
- Formation slot indexes are unique.
- Formation cannot contain invalid slot indexes.
- Size 2 cards must fit in adjacent slots.
- FormationSnapshot kind is valid.
- FormationSnapshot maxHp > 0.

Hard constraints:
- Do not implement combat simulation.
- Do not implement ResolutionStack.
- Do not implement commands.
- Do not implement statuses.
- Do not implement UI.
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.

Tests:
- Valid CardDefinition passes validation.
- Active card without cooldown fails validation.
- Invalid tier fails validation.
- Valid FormationSnapshot passes validation.
- Duplicate slot indexes fail validation.
- Size 2 card that does not fit fails validation.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 3 — Basic CombatEngine Without Stack

### Goal

Prove basic deterministic cooldown combat before adding stack complexity.

### Deliverables

```text
src/combat/CombatEngine.ts
src/combat/CooldownSystem.ts
src/combat/TargetingSystem.ts
src/combat/CombatLog.ts
tests/combat/basicCombat.test.ts
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 3: Basic CombatEngine without ResolutionStack.

Scope:
- Fixed deterministic simulation.
- 1 second = 60 logic ticks.
- Active cards recover cooldown over time.
- Active cards activate when cooldownRemainingTicks <= 0.
- If multiple cards are ready on the same tick, activate left to right by slot index.
- Implement only direct DealDamage effects.
- Use a simple targeting rule:
  - target enemy combatant directly.
- Track HP.
- End combat when one side HP <= 0.
- End combat at maxCombatTicks if neither side dies.
- If maxCombatTicks is reached, winner is:
  1. higher HP percentage
  2. if tied, higher absolute HP
  3. if tied, draw
- Output CombatResult with:
  - winner
  - ticksElapsed
  - final HP values
  - simple combat log
  - replay events for card activation and damage

Hard constraints:
- Do not implement ResolutionStack yet.
- Do not implement CombatCommand yet.
- Do not implement Armor yet.
- Do not implement Burn yet.
- Do not implement triggers yet.
- Do not implement ModifierSystem yet.
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.
- Do not implement UI.

Tests:
- Same input produces same output.
- Card activates after its cooldown.
- Two ready cards on same tick activate left to right.
- Combat ends when HP reaches 0.
- Max tick timeout chooses winner by HP percentage.
- Draw occurs if HP percentage and HP are equal at timeout.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 4 — CombatCommand And ResolutionStack

### Goal

Convert card effects into stack-resolved commands.

### Deliverables

```text
src/combat/commands/CombatCommand.ts
src/combat/commands/DealDamageCommand.ts
src/combat/commands/GainArmorCommand.ts
src/combat/commands/ApplyBurnCommand.ts
src/combat/commands/ModifyCooldownCommand.ts
src/combat/ResolutionStack.ts
tests/combat/resolutionStack.test.ts
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 4: CombatCommand and ResolutionStack.

Scope:
Create:
- CombatCommand interface
- CombatExecutionContext
- ResolutionStack
- DealDamageCommand
- GainArmorCommand
- ApplyBurnCommand
- ModifyCooldownCommand

Update CombatEngine so card effects are converted into CombatCommand objects and pushed to ResolutionStack.

Resolution rules:
- Stack is LIFO.
- Commands resolve from top of stack.
- A command may emit combat log events and replay events.
- A command may push additional commands later, but do not implement trigger-created commands yet.
- Preserve left-to-right activation ordering when pushing commands for same-tick cards.

Stack safety limits:
- max commands per tick: 200
- max commands per combat: 20,000
- max trigger depth: 50, even if triggers are not implemented yet

Hard constraints:
- Do not implement passive triggers yet.
- Do not implement ModifierSystem yet.
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.
- Do not implement UI.
- Do not create generic ICommand; use CombatCommand.

Tests:
- ResolutionStack resolves LIFO.
- DealDamageCommand reduces HP.
- GainArmorCommand increases Armor.
- ModifyCooldownCommand reduces target card cooldown.
- Commands generate deterministic log/replay events.
- Stack safety limit stops runaway command processing with a clear error/result.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 5 — Armor And Burn

### Goal

Add first defense and DOT systems.

### Deliverables

```text
src/combat/status/StatusEffect.ts
src/combat/status/StatusEffectSystem.ts
src/combat/status/Burn.ts
src/combat/DamageCalculator.ts
tests/combat/armorBurn.test.ts
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 5: Armor and Burn.

Scope:
- Add Armor as a combatant runtime value.
- GainArmorCommand increases Armor.
- DamageCalculator applies this pipeline:
  Base damage
  -> damage modifiers placeholder, no actual modifiers yet
  -> Armor reduction
  -> HP loss
  -> after-damage log/replay events
- Armor rule:
  Final direct damage = max(0, incoming damage - armor)
  Armor is reduced by the amount it blocked.
- Add StatusEffect runtime model.
- Implement Burn:
  - Burn has amount and durationTicks.
  - Burn ticks every 60 ticks.
  - Burn deals Fire damage.
  - Burn stacks additively.
  - Burn duration is tracked in integer ticks.
- ApplyBurnCommand applies Burn to target.
- Burn tick damage should go through DamageCalculator, but it may ignore Armor only if explicitly documented. For MVP, choose one rule and document it in code and tests.

Recommended MVP rule:
- Burn ignores Armor to keep DOT role clear.

Hard constraints:
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.
- Do not implement Freeze/Haste/Vulnerable yet.
- Do not implement TriggerSystem yet.
- Do not implement ModifierSystem yet.
- Do not implement UI.

Tests:
- GainArmorCommand increases Armor.
- Armor reduces direct damage.
- Armor is consumed by blocked damage.
- Burn ticks every 60 ticks.
- Burn expires after duration.
- Burn stacking works deterministically.
- Same seed/input produces same Burn result.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 6 — Passive TriggerSystem

### Goal

Allow passive cards to listen to hooks and push commands.

### Deliverables

```text
src/combat/triggers/TriggerSystem.ts
src/combat/triggers/TriggerDefinition.ts
src/combat/triggers/TriggerRuntimeState.ts
tests/combat/triggers.test.ts
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 6: Passive TriggerSystem.

Scope:
- Implement TriggerSystem for passive cards.
- Supported MVP hooks:
  - OnCombatStart
  - OnCardActivated
  - OnDamageDealt
  - OnDamageTaken
  - OnStatusApplied
  - OnBurnTick
  - OnCooldownModified
  - OnCombatEnd
- Passive triggers may create CombatCommand objects.
- Implement internalCooldownTicks for triggers.
- Implement maxTriggersPerTick for safety, default 1 if not specified.
- TriggerSystem must be deterministic.
- Add trigger events to combat log and replay timeline.

Supported trigger conditions for MVP:
- status equals Burn
- appliedByOwner true/false
- sourceHasTag
- cardIsAdjacent
- ownerHpBelowPercent
- targetHpBelowPercent

Hard constraints:
- Do not implement ModifierSystem yet.
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.
- Do not implement new statuses beyond Burn.
- Do not implement UI.
- Do not implement random chance triggers.

Tests:
- Passive trigger fires on OnStatusApplied.
- Internal cooldown prevents repeated trigger spam.
- maxTriggersPerTick is enforced.
- Trigger-created command is pushed to ResolutionStack.
- Trigger order is deterministic.
- A passive card with no valid condition does not trigger.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 7 — Minimal ModifierSystem / MBF

### Goal

Add small, controlled ModifierSystem.

### Deliverables

```text
src/combat/modifiers/Modifier.ts
src/combat/modifiers/ModifierSystem.ts
src/combat/modifiers/ModifierHooks.ts
tests/combat/modifiers.test.ts
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 7: Minimal ModifierSystem / MBF.

Scope:
Implement ModifierSystem with only these supported modifier areas:
- Damage modifiers
- Cooldown recovery modifiers
- Status duration modifiers

Supported MVP hooks:
- BeforeDealDamage
- AfterDealDamage
- BeforeCooldownRecover
- AfterCardActivated
- OnStatusApplied

Modifier fields:
- id
- sourceId
- ownerId
- hook
- priority
- condition
- operation
- expiresAtTick optional

Priority rule:
- Lower priority number executes first.
- If same priority, sort by modifier id for deterministic order.

Supported MVP conditions:
- sourceHasTag
- targetHasStatus
- ownerHasStatus
- damageType
- cardInSlot
- always

Supported MVP operations:
- ADD_DAMAGE
- MULTIPLY_DAMAGE
- ADD_COOLDOWN_RECOVERY_RATE
- MULTIPLY_COOLDOWN_RECOVERY_RATE
- ADD_STATUS_DURATION
- MULTIPLY_STATUS_DURATION

Hard constraints:
- Do not implement formula rewriting yet.
- Do not implement rollback/snapshot yet.
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.
- Do not implement random modifiers.
- Do not implement UI.

Tests:
- Modifiers execute in priority order.
- Same priority uses modifier id deterministic order.
- ADD_DAMAGE modifies damage.
- MULTIPLY_DAMAGE modifies damage.
- Cooldown recovery modifier changes activation timing.
- Status duration modifier changes Burn duration.
- Expired modifier no longer applies.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 8 — ReplayTimeline And CombatResultSummary

### Goal

Make combat understandable and replayable.

### Deliverables

```text
src/replay/ReplayTimeline.ts
src/replay/ReplayEvent.ts
src/combat/CombatResultSummaryBuilder.ts
tests/replay/
tests/combat/summary.test.ts
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 8: ReplayTimeline and CombatResultSummary.

Scope:
- Create ReplayTimeline as clean player-facing replay data.
- Keep raw CombatLog as dev/debug data.
- Add ReplayEvent types for:
  - CombatStarted
  - CardActivated
  - DamageDealt
  - ArmorGained
  - ArmorBlocked
  - StatusApplied
  - StatusTicked
  - CooldownModified
  - TriggerFired
  - CombatEnded
- Build CombatResultSummary with:
  - damage by card
  - Burn/status damage
  - Armor gained by card
  - Armor blocked
  - activations by card
  - trigger count by card
  - top contributors
  - winner
  - ticks elapsed
- Keep stack viewer / modifier trace dev-only.

Hard constraints:
- Do not implement UI yet.
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.
- Do not add new combat mechanics.
- Do not change deterministic simulation rules.

Tests:
- ReplayTimeline events are ordered by tick.
- CombatLog can contain debug detail not shown in ReplayTimeline.
- Summary correctly aggregates card damage.
- Summary correctly aggregates Burn damage.
- Summary correctly aggregates Armor gained and blocked.
- Summary is deterministic for same combat.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 9 — Monster Templates

### Goal

Generate enemy formations using same FormationSnapshot interface.

### Deliverables

```text
src/content/monsters/MonsterTemplate.ts
src/content/monsters/MonsterGenerator.ts
data/monsters/*.json
tests/content/monsterGenerator.test.ts
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 9: Monster templates and monster formation generation.

Scope:
- Create MonsterTemplate schema.
- Create MonsterGenerator.
- MonsterGenerator outputs FormationSnapshot.
- Tutorial monsters are fixed.
- Normal monsters are template-generated.
- Boss is fixed.
- Use deterministic seed for generated monsters.
- Monster templates define:
  - id
  - name
  - difficulty
  - slotCount
  - requiredCards
  - optionalCards
  - defenseStyle
  - weakness
  - rewardPool
  - minDay
  - maxDay
- Create MVP templates:
  1. Training Dummy
  2. Rust Bandit
  3. Burn Apprentice
  4. Shield Guard
  5. Drum Tactician
  6. Fire Echo Adept
  7. First Boss: Gate Captain

Hard constraints:
- Do not create a separate monster combat system.
- Monsters must use FormationSnapshot.
- Do not implement async PvP yet.
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.
- Do not implement UI.
- Do not create pure random monster formations without templates.

Tests:
- Same seed creates same monster formation.
- Generated monster uses valid cards.
- Required cards are always included.
- Slot count is respected.
- Size 2 cards fit correctly.
- Monster FormationSnapshot passes validation.
- Boss generation is fixed and deterministic.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 10 — Minimal UI Prototype

### Goal

Build a functional placeholder UI on top of the headless engine.

### Deliverables

Implementation depends on selected frontend. Recommended first UI:

```text
React + Vite + TypeScript
```

Example files:

```text
src/ui/App.tsx
src/ui/components/CardView.tsx
src/ui/components/FormationSlot.tsx
src/ui/components/FormationEditor.tsx
src/ui/components/EnemyPreview.tsx
src/ui/components/CombatReplay.tsx
src/ui/components/ResultSummary.tsx
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 10: Minimal UI prototype.

Scope:
- Use placeholder visuals only.
- Use the existing headless CombatEngine.
- Add a formation editor.
- Show owned cards.
- Allow dragging cards into limited slots.
- Allow moving cards between slots.
- Normal dragging does not trigger effects.
- Show enemy formation preview.
- Add Start Battle button.
- On Start Battle, run deterministic simulation.
- Show ReplayTimeline in a simple replay/log panel.
- Show CombatResultSummary after battle.
- Include dev-only toggle for CombatLog.
- Do not show raw ResolutionStack to normal player view by default.

Hard constraints:
- Do not change combat rules to fit UI.
- Do not implement animation polish.
- Do not implement final art.
- Do not implement mid-combat input.
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.
- Do not implement save/load yet unless absolutely needed for local UI state.
- Do not implement shop/run loop yet.

Tests:
- Add component or integration tests if the selected frontend supports them.
- At minimum, keep engine tests passing.
- Manual test instructions must be added to HANDOFF.md.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 11 — MVP Run Loop

### Goal

Connect starting resources, shop/events, battles, rewards, elite, and boss.

### Deliverables

```text
src/run/RunState.ts
src/run/RunManager.ts
src/run/nodes/ShopNode.ts
src/run/nodes/EventNode.ts
src/run/nodes/BattleNode.ts
src/run/rewards/RewardGenerator.ts
tests/run/
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 11: MVP Run Loop.

Scope:
- Player starts with:
  - Gold: 10
  - Owned cards: 0
  - Formation slots: 4
- First two nodes are always shop/event nodes.
- The player must be able to obtain at least one active card before first combat.
- Implement linear MVP run:
  1. Choose class placeholder
  2. Starter shop/event
  3. Starter shop/event
  4. Easy monster
  5. Reward
  6. Normal monster
  7. Reward
  8. Shop/event
  9. Elite monster
  10. Reward
  11. Boss
  12. Run result
- Shop shows 3 cards.
- At least 1 starter shop card is free or affordable.
- Event can grant a free attack card, free defense card, or gold.
- Reward choice shows 3 options.
- Owned cards can be placed in formation before battle.

Hard constraints:
- Do not implement branching map yet.
- Do not implement save/load yet unless required as local temporary state.
- Do not implement async PvP.
- Do not implement final art.
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.
- Do not create many cards beyond the MVP test pool.

Tests:
- New run starts with 0 cards and 10 gold.
- First two nodes are shop/event.
- Player can obtain active card before first combat.
- Reward adds selected card to owned cards.
- Run can progress to boss.
- Boss win produces run victory.
- Player death produces run defeat.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 12 — Save And Load

### Goal

Save exact selection state and resume without rerolling.

### Deliverables

```text
src/save/SaveGame.ts
src/save/SaveManager.ts
src/save/serialization.ts
tests/save/
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 12: Save and Load.

Scope:
- Save and load MVP RunState.
- Save exact current node.
- Save current choices.
- Save shop offers without rerolling.
- Save event choices without rerolling.
- Save pending reward choices without rerolling.
- Save owned cards.
- Save formation layout.
- Save gold.
- Save current enemy FormationSnapshot.
- Save run seed and node index.
- Save format should be versioned.
- Add serialization and deserialization validation.

Hard constraints:
- Do not implement cloud save.
- Do not implement account system.
- Do not implement async PvP.
- Do not save temporary combat-only statuses into persistent run state unless they are explicitly run-persistent.
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.

Tests:
- Save/load round trip preserves RunState.
- Shop choices remain identical after load.
- Reward choices remain identical after load.
- Formation layout remains identical after load.
- Enemy snapshot remains identical after load.
- Invalid save version is handled clearly.
- Corrupt save data fails gracefully.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 13 — MVP Content Expansion

### Goal

Add enough content to test fun, without expanding engine scope.

### Deliverables

```text
data/cards/general/*.json
data/cards/class_iron_warlord/*.json
data/skills/*.json
data/monsters/*.json
docs/BALANCE_NOTES.md
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 13: MVP content expansion.

Scope:
Add content using only existing commands, statuses, hooks, and modifiers from MVP_MASTER_DESIGN.md.

Create:
- 20 general cards
- 20 Iron Warlord starter/MVP cards
- 8 MVP skills
- 8 monster templates
- 2 bosses

Card content rules:
- Use only existing commands:
  - DealDamage
  - GainArmor
  - ApplyBurn
  - ModifyCooldown
- Use only existing statuses:
  - Armor
  - Burn
- Use only existing hooks from TriggerSystem.
- Use only existing ModifierSystem hooks and operations.
- Do not add new resources.
- Do not add Barrier, Ward, Energy Shield, or absorb layers.
- Do not add new damage layers.
- Do not add formula rewriting yet.
- Every card must have:
  - id
  - name
  - tier
  - type
  - size
  - tags
  - effects or triggers
  - description
- Every card should have a clear role:
  - starter
  - engine
  - terminal
  - defense
  - connector
  - disruptor
  - scaler
  - payoff

Monster content rules:
- Monsters must be readable builds.
- Each monster must have:
  - engine
  - payoff
  - defense style
  - weakness
  - reward pool
- Monsters must output FormationSnapshot through the existing MonsterGenerator.

Also create docs/BALANCE_NOTES.md with:
- card role table
- early balance assumptions
- known risky combos
- future tuning notes

Tests:
- All card JSON files validate.
- All monster templates validate.
- Generated monster snapshots validate.
- No card references unknown command/status/hook.
- No content uses Barrier/Ward/EnergyShield/absorb.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 14 — PvP-Ready Snapshot Export, Local Only

### Goal

Prepare architecture for future async PvP without building online PvP.

### Deliverables

```text
src/pvp/PvpSnapshot.ts
src/pvp/PvpSnapshotExporter.ts
tests/pvp/
```

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 14: PvP-ready snapshot export, local only.

Scope:
- Export current player build as a clean FormationSnapshot.
- Include:
  - run id
  - day/node index
  - class id
  - power score
  - owned relevant card instances
  - current formation layout
  - skills
  - relics
  - max HP
  - starting Armor if it is persistent
- Exclude:
  - temporary combat-only statuses
  - current combat cooldowns
  - Burn currently ticking from previous combat
  - any non-persistent temporary effect
- Add local test that exported player snapshot can be loaded as enemy/opponent snapshot in CombatEngine.
- Add simple deterministic power score function.

Hard constraints:
- Do not implement matchmaking.
- Do not implement server.
- Do not implement account system.
- Do not implement real online PvP.
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.

Tests:
- Exported snapshot validates.
- Exported snapshot can fight another FormationSnapshot.
- Temporary combat statuses are excluded.
- Same run state exports same snapshot.
- Power score is deterministic.

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 15 — Polish Gate Before Art

### Goal

Check whether the MVP core is worth expanding before creating final art.

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Perform an MVP polish gate review.

Scope:
- Do not add new features.
- Review implementation against MVP_MASTER_DESIGN.md.
- Identify missing tests.
- Identify unclear combat logs.
- Identify unreadable replay events.
- Identify balance risks.
- Identify any implementation that violates:
  - no Barrier/Ward/EnergyShield
  - no mid-combat input
  - deterministic combat
  - FormationSnapshot for all combatants
  - phase-by-phase design
- Create docs/MVP_REVIEW_REPORT.md.

Hard constraints:
- Do not refactor code unless a bug prevents tests from running.
- Do not add new mechanics.
- Do not add art.

Report must include:
- Current status
- What works
- What is broken
- What is risky
- Recommended next phase
- Whether art production should start yet

After finishing:
- Run tests if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize findings.
```
