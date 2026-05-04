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
owned cards / chest
+ formation editing
+ enemy preview
+ Start Battle
+ replay timeline
+ result summary
= playable combat prototype

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
## Phase 11 - Run Loop
You are working on Magic Sanguo, a The Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- docs/MVP_BUILD_SEQUENCE.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 11: MVP Run Loop.

Goal:
Connect starting resources, chest/owned cards, formation editing state, shop/events, battles, rewards, elite, boss, and run result into a deterministic linear MVP run.

Deliverables:
- src/run/RunState.ts
- src/run/RunManager.ts
- src/run/nodes/ShopNode.ts
- src/run/nodes/EventNode.ts
- src/run/nodes/BattleNode.ts
- src/run/rewards/RewardGenerator.ts
- tests/run/

Core run rules:
- Player starts with:
  - Gold: 10
  - Owned cards: 0
  - Formation slots: 4
  - Chest capacity: formation slot count × 2
  - With 4 formation slots, chest capacity = 8
- First two nodes are always safe growth nodes.
- The player must be able to obtain at least one active card before first combat.
- No branching map yet.
- MVP run is linear.

Linear MVP run:
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

RunState requirements:
Define a clear RunState model that can later be saved in Phase 12.

RunState should include at minimum:
- runId
- seed
- status: IN_PROGRESS | VICTORY | DEFEAT
- currentNodeIndex
- gold
- ownedCards
- formationSlots
- formationSlotCount
- chestCapacity
- currentNode
- currentChoices
- currentEnemySnapshot if on battle node
- pendingBattleResult if applicable
- classId placeholder
- defeatedMonsters / completedNodes if useful for tests

Important ownership model:
- ownedCards contains every CardInstance the player owns.
- formationSlots references CardInstance ids from ownedCards.
- Chest cards are derived:
  chestCards = ownedCards not referenced by formationSlots.
- Do not duplicate card instances into separate chest and formation inventories.
- A card may be either in formation or in chest view, not both.
- Formation must never reference a card that is not in ownedCards.

Chest capacity:
- MVP rule: chestCapacity = formationSlotCount × 2.
- Chest capacity limits total ownedCards count.
- With 4 formation slots, player can own at most 8 cards total.
- Cannot add a card if ownedCards.length >= chestCapacity.
- If reward/shop would add a card when chest is full, return a clear failure result. Do not silently discard unless explicitly selected as a future rule.

Selling economy:
- Cards in chest can be sold.
- Cards currently placed in formation cannot be sold directly.
- Player must remove a card from formation back to chest before selling.
- Selling removes the CardInstance from ownedCards.
- Selling grants gold based on the sold card definition tier.
- Selling does not trigger combat effects, passive triggers, modifiers, replay events, or combat log events.

MVP sell prices:
- BRONZE: 1 gold
- SILVER: 2 gold
- GOLD: 4 gold
- JADE: 8 gold
- CELESTIAL: 12 gold

RunManager should support:
- createNewRun(seed)
- getCurrentNode()
- getChestCards()
- addCardToChest(cardDefinitionId)
- moveCardFromChestToFormation(cardInstanceId, slotIndex)
- removeCardFromFormationToChest(cardInstanceId)
- moveCardBetweenFormationSlots(cardInstanceId, targetSlotIndex)
- sellCardFromChest(cardInstanceId)
- chooseShopOption(optionId)
- chooseEventOption(optionId)
- chooseRewardOption(optionId)
- startBattle()
- completeBattle()
- advanceToNextNode()

Shop rules:
- Shop shows 3 card choices.
- Starter shop/event must allow the player to obtain at least one active card before first combat.
- At least 1 starter shop card must be free or affordable.
- Shop choices should be deterministic from run seed + node index.
- Buying a card:
  - checks gold
  - checks chest capacity
  - subtracts gold
  - adds CardInstance to ownedCards
- Do not implement refresh/reroll yet unless already documented.

Event rules:
- MVP event can offer choices such as:
  - gain a free attack card
  - gain a free defense card
  - gain gold
- Event choices should be deterministic from run seed + node index.
- Free card event still respects chest capacity.

Reward rules:
- Reward choice shows 3 card options.
- Reward choices should be deterministic from run seed + node index + defeated monster.
- Selecting a reward adds the selected card to ownedCards if capacity allows.
- Do not implement relics/skills yet unless already in existing MVP scope.

Battle rules:
- Battle nodes use Phase 9 MonsterGenerator.
- Monsters must use FormationSnapshot.
- Do not create a separate battle system for monsters.
- startBattle() should:
  - validate player has at least one active card in formation
  - validate formation references owned cards
  - generate/use current enemy FormationSnapshot
  - call existing CombatEngine
  - store CombatResult
- completeBattle() should:
  - if player wins non-boss battle, advance to reward node
  - if player wins boss battle, set run status VICTORY
  - if player loses/draws where loss condition applies, set run status DEFEAT for MVP
- For MVP, treat DRAW as DEFEAT unless explicitly documented otherwise.

Formation rules:
- Owned cards can be placed in formation before battle.
- Cards in chest do not participate in combat.
- Normal moving/dragging cards before combat does not trigger effects.
- Only final formation position matters when combat starts.
- Size 2 cards must occupy adjacent slots and lock/cover the adjacent slot.
- Cannot place a card if it does not fit.
- Cannot place a card that is not owned.
- Cannot place the same card in multiple slots.

Determinism rules:
- Do not use Math.random().
- Use deterministic seed helpers for:
  - shop choices
  - event choices
  - reward choices
  - monster generation
- Same seed and same choices should produce the same run state and battle setup.

Hard constraints:
- Do not implement branching map.
- Do not implement save/load yet.
- Do not implement async PvP.
- Do not implement final art.
- Do not implement UI changes in this phase unless absolutely necessary for compilation.
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.
- Do not implement Freeze, Haste, Vulnerable, Silence, or new statuses.
- Do not implement new combat commands.
- Do not implement new resources beyond Gold.
- Do not create a huge card pool beyond the MVP test/content pool.
- Do not change CombatEngine rules to make run loop work.
- Do not implement cloud/account/profile systems.
- If a new primitive seems necessary, document it in HANDOFF.md instead of implementing it silently.

Tests:
Add tests for:

Run start:
- New run starts with 0 cards and 10 gold.
- New run starts with 4 formation slots.
- New run starts with chest capacity 8.
- First two nodes are shop/event safe growth nodes.
- Run node sequence is deterministic for same seed.

Chest / inventory:
- Reward adds selected card to ownedCards.
- Shop purchase adds selected card to ownedCards and subtracts gold.
- Cannot exceed chest capacity.
- Chest cards are derived from ownedCards not in formation.
- Moving card from chest to formation removes it from chest view.
- Removing card from formation returns it to chest view.
- Cannot place unowned card in formation.
- Cannot place same card in multiple slots.
- Cannot sell a card currently placed in formation.
- Selling BRONZE card from chest adds 1 gold and removes card.
- Selling SILVER card from chest adds 2 gold.
- Selling GOLD card from chest adds 4 gold.
- Formation card references remain valid after selling another card.

Pre-first-combat:
- Player can obtain at least one active card before first combat.
- First combat cannot start with no active card in formation.
- First combat can start after placing an owned active card.

Battle/run progression:
- Battle uses Phase 9 MonsterGenerator output.
- Generated enemy uses FormationSnapshot.
- Battle result includes ReplayTimeline and CombatResultSummary.
- Run can progress to boss.
- Boss win produces run victory.
- Player defeat produces run defeat.
- DRAW is treated as defeat for MVP if that rule is chosen.

Determinism:
- Same seed and same choices produce same shop choices.
- Same seed and same choices produce same reward choices.
- Same seed and same choices produce same monster battle setup.

After finishing:
- Run:
  - pnpm test
  - pnpm typecheck
  - pnpm build
- Update PROJECT_LOG.md with a new append-only Phase 11 entry.
- Update HANDOFF.md with current state and next recommended task.
- Create a git commit for Phase 11.
- Stop and summarize changed files, tests, and known issues.
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
You are working on Magic Sanguo, a The Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- docs/MVP_BUILD_SEQUENCE.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 12: Save and Load.

Goal:
Save and restore the exact MVP run state so the player can resume without rerolling shops, events, rewards, level-up rewards, enemies, or current node state.

Scope:
- Add a versioned save format.
- RunState remains the source of truth.
- SaveManager/serialization should wrap and validate RunState; do not create a second inventory/map/progression model.
- Save and load:
  - run id
  - save format version
  - run seed
  - node index / current node
  - current node phase/state
  - gold
  - level / EXP / HP / max HP
  - owned card instances, including instanceId, definitionId, and tierOverride
  - owned skills
  - chest / inventory state if represented separately in RunState
  - formation layout
  - shop offers and sold/sold-out state
  - event choices and resolved/unresolved state
  - pending battle reward choices
  - pending level-up reward choices
  - current enemy FormationSnapshot
  - current battle/reward reveal source fields if they affect reward generation or UI
- Loading a battle node must use the serialized enemy FormationSnapshot, not call MonsterGenerator again.
- Loading shop/event/reward/level-up nodes must use serialized choices, not regenerate choices.
- If RunState contains a completed battle result waiting for Continue, save/load enough data to restore the same visible state without rerunning combat.
- Add serialization and deserialization validation with clear errors.
- Add a small, typed SaveLoadResult or equivalent so callers can distinguish success/failure without crashing.
- Export the save/load APIs from src/index.ts.

Optional UI scope:
- Add minimal placeholder UI buttons:
  - Save Run
  - Load Run
  - Clear Save
- Use localStorage only.
- UI must call SaveManager / RunManager APIs and must not duplicate run logic.

Hard constraints:
- Do not implement cloud save.
- Do not implement account system.
- Do not implement async PvP.
- Do not implement branching map.
- Do not add new combat commands, statuses, resources, hooks, or card effects.
- Do not implement Barrier, Ward, Energy Shield, or absorb layers.
- Do not save temporary combat-only statuses into persistent run state unless they are already explicitly run-persistent.
- Do not rerun combat or regenerate choices during load.
- Do not change CombatEngine timing rules.
- Internal timing remains 1 second = 60 logic ticks.

Validation requirements:
- Invalid save version fails clearly.
- Missing required fields fail clearly.
- Unknown current node type fails clearly.
- Invalid card instance reference fails clearly.
- Invalid formation slot/card reference fails clearly.
- Invalid enemy FormationSnapshot fails clearly.
- Corrupt JSON fails gracefully.

Tests:
- Save/load round trip preserves RunState.
- Shop choices remain identical after load, including sold/sold-out state.
- Event choices remain identical after load.
- Reward choices remain identical after load.
- Level-up reward choices remain identical after load.
- Formation layout remains identical after load.
- Owned card instance ids and tierOverride remain identical after load.
- Owned skills remain identical after load.
- Gold/level/EXP/HP remain identical after load.
- Enemy FormationSnapshot remains identical after load.
- Loading a battle node does not call MonsterGenerator or reroll enemy.
- Loading shop/reward/event/level-up states does not reroll choices.
- Invalid save version is handled clearly.
- Corrupt save data fails gracefully.
- If UI localStorage buttons are added, add minimal tests or manual HANDOFF instructions.

After finishing:
- Run pnpm test if possible.
- Run pnpm typecheck if possible.
- Run pnpm build if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Create a git commit.
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

## Phase 14 — Status And Damage Foundation Sequence

### Goal

Strengthen combat readability, source attribution, and status/damage foundations before adding future async PvP or broader meta systems.

Phase 14 replaces the old PvP snapshot export plan. PvP-ready snapshot export remains useful, but it is now a future phase after combat readability and mechanics are stronger. Async PvP is future-only and is not part of Phase 14.

### Phase 14 Hard Constraints

- Keep combat deterministic.
- Keep 1 second = 60 logic ticks.
- No mid-combat player input.
- Do not add Barrier, Ward, Energy Shield, or absorb layers.
- RunManager remains the run source of truth.
- All combatants continue to use FormationSnapshot.
- Do not implement matchmaking, server, account system, real online PvP, or async PvP.
- Do not create a second save/progression model.
- Player-facing UI should show seconds and readable text, not raw ticks/internal ids.

---

## Phase 14A — Damage Type And Source Attribution Foundation

### Goal

Make direct damage, status damage, crits, modifiers, and replay summaries easier to reason about before adding new status packs.

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 14A: Damage type and source attribution foundation.

Scope:
- Add explicit, deterministic source attribution for damage and status application where the current engine needs it.
- Preserve existing DealDamage DIRECT behavior unless a card explicitly declares a supported damage type.
- Make Burn tick source attribution possible without changing Burn balance identity yet.
- Ensure replay and CombatResultSummary can attribute status damage to the applying card when source data exists.
- Keep Fire Study/tag-based support working; document any transition path from tag-based fire support to damageType-based support.
- Update validation so damageType/source fields use only documented values.
- Update player-facing summaries only where needed for readability.

Hard constraints:
- Do not add Poison, Heal, Haste, Slow, Freeze, Burn decay, or status reactions in Phase 14A.
- Do not add Barrier, Ward, Energy Shield, or absorb layers.
- Do not add nondeterministic randomness.
- Do not change combat timing rules.
- Do not create a second save/progression model.
- RunManager remains source of truth.
- All combatants use FormationSnapshot.
- Async PvP is not part of this phase.

Tests:
- Existing direct DealDamage behavior remains unchanged when damageType is omitted.
- Explicit supported damageType validates and appears in replay/summary.
- Burn tick damage can be attributed to the applying card when source attribution exists.
- Fire Study/tag-based behavior remains compatible.
- Save/load still works with attributed combat result payloads.
- No forbidden mechanics are introduced.

After finishing:
- Run pnpm test if possible.
- Run pnpm typecheck if possible.
- Run pnpm build if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 14B — Poison And Heal Pack

### Goal

Add the first post-MVP status/resource-like gameplay extensions in a controlled, readable way: Poison pressure and Heal recovery.

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 14B: Poison and Heal pack.

Scope:
- Add Poison as a deterministic damage-over-time status using the Phase 14A attribution foundation.
- Add Heal as a deterministic command/effect with clear HP clamping.
- Add only the minimum content needed to test Poison and Heal readability.
- Update validation, replay, summary, and card display for Poison and Heal.
- Keep Poison and Heal interactions simple; do not add reaction combos yet.

Hard constraints:
- Do not add Haste, Slow, Freeze, Burn decay, or status reactions in Phase 14B.
- Do not add Barrier, Ward, Energy Shield, absorb layers, or temporary HP layers.
- Heal restores HP only and must not create overheal shields.
- Do not add nondeterministic randomness.
- Do not change combat timing rules.
- Do not create a second save/progression model.
- RunManager remains source of truth.
- All combatants use FormationSnapshot.
- Async PvP is not part of this phase.

Tests:
- Poison applies, ticks deterministically, expires, and is attributed.
- Poison does not use Armor unless the design explicitly says otherwise.
- Heal restores HP, clamps at max HP, and appears in replay/summary.
- Poison and Heal card summaries are readable and seconds-only.
- Save/load validation accepts only documented Poison/Heal data.
- No forbidden mechanics are introduced.

After finishing:
- Run pnpm test if possible.
- Run pnpm typecheck if possible.
- Run pnpm build if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 14C — Haste, Slow, And Freeze Control Pack

### Goal

Add deterministic cooldown/control statuses carefully, with readable timing and strict limits to avoid opaque lockouts.

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 14C: Haste, Slow, and Freeze control pack.

Scope:
- Add Haste as a deterministic cooldown recovery accelerator.
- Add Slow as a deterministic cooldown recovery reducer.
- Add Freeze as a deterministic limited-duration cooldown pause or delay, using one clearly documented behavior.
- Update validation, replay, summary, and card display for these statuses.
- Add only enough content to test control readability and counterplay.
- Keep control effects short, readable, and deterministic.

Hard constraints:
- Do not add Poison/Heal content beyond what Phase 14B already introduced.
- Do not add Burn decay or status reactions in Phase 14C.
- Do not add Barrier, Ward, Energy Shield, or absorb layers.
- Do not add nondeterministic randomness.
- Do not add mid-combat player input.
- Do not create permanent lockouts or infinite cooldown loops.
- Do not create a second save/progression model.
- RunManager remains source of truth.
- All combatants use FormationSnapshot.
- Async PvP is not part of this phase.

Tests:
- Haste, Slow, and Freeze are deterministic for identical combat input.
- Control statuses expire and cannot create permanent lockout loops.
- Replay and summaries explain control effects without raw internal ids.
- Existing ModifyCooldown and cooldown recovery behavior remains compatible.
- Save/load validation accepts only documented control status data.
- No forbidden mechanics are introduced.

After finishing:
- Run pnpm test if possible.
- Run pnpm typecheck if possible.
- Run pnpm build if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 14D — Status Reaction/Combo Pack

### Goal

Add a small, explicit reaction layer that creates readable build puzzles from existing statuses without turning combat into hidden combo soup.

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 14D: Status reaction/combo pack.

Scope:
- Add only a small set of documented deterministic status reactions.
- Reactions must be readable in card text, replay, and balance notes.
- Reactions must use statuses already implemented by Phases 14A-14C.
- Add validation so content can reference only supported reactions.
- Add content sparingly to test build identity and readability.

Hard constraints:
- Do not add new statuses beyond the Phase 14A-14C status set.
- Do not add Barrier, Ward, Energy Shield, or absorb layers.
- Do not add nondeterministic randomness.
- Do not add mid-combat player input.
- Do not create recursive/infinite reaction chains.
- Passive/reaction triggers must keep internal cooldown and max trigger protections where relevant.
- Do not create a second save/progression model.
- RunManager remains source of truth.
- All combatants use FormationSnapshot.
- Async PvP is not part of this phase.

Tests:
- Each supported reaction has deterministic combat coverage.
- Reactions appear in replay/summary readably.
- Reaction validation rejects unknown reaction ids/statuses.
- Infinite or near-infinite reaction loops are prevented.
- Existing Phase 13B terminal builds still work.
- No forbidden mechanics are introduced.

After finishing:
- Run pnpm test if possible.
- Run pnpm typecheck if possible.
- Run pnpm build if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Phase 14E — Burn Decay Identity Polish

### Goal

Polish Burn identity after the broader status foundation exists, so Burn remains distinct from Poison and does not dominate every defensive matchup.

### Complete Codex Prompt

```text
You are working on Magic Sanguo, a Bazaar-like ARPG-inspired roguelike formation card-builder.

Before coding, read:
- docs/MVP_MASTER_DESIGN.md
- PROJECT_LOG.md
- HANDOFF.md

Task:
Implement Phase 14E: Burn decay identity polish.

Scope:
- Revisit Burn behavior after Poison, Heal, control statuses, and reaction rules exist.
- Add Burn decay only if it improves readability, balance, and identity.
- Keep Burn distinct from Poison.
- Update Burn card text, replay, summary, validation, and balance notes if Burn decay is implemented.
- Retune only the content needed to keep Burn Engine and Siege Fire readable.

Hard constraints:
- Do not add new statuses beyond the Phase 14A-14D status set.
- Do not add Barrier, Ward, Energy Shield, or absorb layers.
- Do not add nondeterministic randomness.
- Do not add mid-combat player input.
- Do not change 1 second = 60 logic ticks.
- Do not create a second save/progression model.
- RunManager remains source of truth.
- All combatants use FormationSnapshot.
- Async PvP is not part of this phase.

Tests:
- Burn behavior is deterministic before and after decay ticks.
- Burn source attribution remains correct.
- Burn decay, if implemented, is readable in card summaries and replay.
- Burn Engine and Siege Fire smoke tests still pass.
- Armor is not made irrelevant in every matchup.
- No forbidden mechanics are introduced.

After finishing:
- Run pnpm test if possible.
- Run pnpm typecheck if possible.
- Run pnpm build if possible.
- Update PROJECT_LOG.md.
- Update HANDOFF.md.
- Stop and summarize changed files.
```

---

## Future Phase — PvP-Ready Snapshot Export, Local Only

The previous Phase 14 PvP snapshot export plan is intentionally deferred. Bring it back only after status/damage readability, source attribution, and combat-result summaries are strong enough to support understandable opponent snapshots.

Future PvP snapshot export should still be local-only first:

- Export the current player build as a clean FormationSnapshot plus metadata.
- Validate that exported snapshots can fight another FormationSnapshot in CombatEngine.
- Exclude temporary combat-only statuses and cooldown state.
- Keep RunManager as source of truth.
- Do not implement matchmaking, server, account system, real online PvP, or async PvP until a later explicitly approved phase.

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
