# Magic Sanguo MVP Master Design

> Source of truth for the first playable MVP.
>
> Codex should read this file first before implementation.  
> The larger docs package is long-term reference. This file controls MVP scope.

---

## 0. Current Design Decision Summary

Magic Sanguo is a **Bazaar-like, ARPG-inspired, roguelike formation card-builder**.

The player does not play cards manually during combat.  
The player gets cards and skills from shops, events, and monster drops, places cards into limited formation slots before battle, then starts a deterministic automatic combat simulation.

During combat:

- Player has no manual input.
- Battle is calculated by the engine.
- Result can be replayed.
- Debug logs are available for development only.
- Player-facing summary should explain card contribution, damage, defense, and key triggers.

Long-term goal:

- Async PvP using other players' latest valid formation snapshots.
- MVP does not implement online PvP.
- MVP architecture must still use `FormationSnapshot` so future PvP is easy.

---

## 1. MVP North Star

The MVP is not about having many cards.

The MVP is about proving:

```text
Limited slots
+ cooldown timing
+ left-to-right activation order
+ simple defense
+ status effects
+ enemy formations
+ deterministic replay
= interesting build puzzles
```

If this core is fun, content can expand later.

---

## 2. Game Identity

### Genre

Roguelike formation card-builder.

### Inspiration

The combat and build screen can reference the feeling of games like The Bazaar:

- Buy/get cards.
- Place cards into a limited board/zone.
- Cards have sizes.
- Skills modify builds.
- Combat auto-resolves after starting.
- Build growth happens through rewards, shops, and events.

The game is not a traditional deckbuilder at MVP stage.

No hand, draw pile, discard pile, or manual card playing is required for MVP.

### Theme

Sanguo is mostly visual/lore flavor.

Characters are more like **classes/jobs** than historically accurate people.

---

## 3. MVP Run Structure

The player should start weak and grow into a build.

## MVP Character Growth

The MVP run should support character growth.

### Level

The player starts at level 1.

The MVP target level is level 10.

```text
Start level: 1
Max MVP level: 10
EXP to next level: 10

### Important Start Rule

The player may start with **0 cards**, but should start with initial resources.

Recommended MVP starting resources:

```text
Gold: 10
Life: class-defined
Formation slots: 4
Owned cards: 0
Owned skills: 0
```

The first two nodes should always be safe growth nodes.

```text
Node 1: Shop or starter event
Node 2: Shop or starter event
Node 3: First easy monster
```

This creates the feeling of starting from nothing without forcing a boring empty combat.

### MVP Linear Run

```text
Choose class
↓
Start with initial gold/resources and 0 cards
↓
Node 1: Starter shop/event
↓
Node 2: Starter shop/event
↓
Easy monster
↓
Reward
↓
Normal monster
↓
Reward
↓
Shop/event
↓
Elite monster
↓
Reward
↓
Boss
↓
Run result
```

MVP does not need branching map.

Branching map can be added after the core loop is fun.

---

## 4. Pre-Combat Formation Rules

Before combat, the player can:

- Inspect owned cards.
- Drag cards into formation slots.
- Move cards inside formation.
- Remove cards from formation.
- Inspect enemy formation.
- Inspect card tooltips.
- Click Start Battle.

## 4.1 Chest / Owned Card Storage MVP

The player owns cards outside combat in a limited chest.

The chest is the player's card storage area. It contains owned cards that are not currently placed in the formation zone.

### Chest Capacity

For MVP:

```text
Chest capacity = formation slot count × 2

The chest capacity should scale if formation slot count increases later.

Chest And Formation Relationship

Before combat, the player can:

Inspect cards in chest.
Move cards from chest into formation.
Move cards from formation back into chest.
Move cards inside formation.
Sell cards from chest.

Cards placed in formation are active for the next combat.

Cards in chest are owned but do not participate in combat.

Selling Cards

For MVP, cards can be sold only from the chest.

A card currently placed in formation cannot be sold directly.
The player must first remove it from formation back to chest.

MVP Sell Price By Tier

Recommended MVP sell prices:

BRONZE: 1 gold
SILVER: 2 gold
GOLD: 4 gold
JADE: 8 gold
CELESTIAL: 12 gold

### Important Rule: Normal Dragging Does Not Trigger Effects

For MVP:

```text
Dragging or moving cards before combat does not trigger card effects.
Only final formation position matters when combat starts.
```

Reason:

If moving cards triggers effects freely, players can abuse drag/swap actions before combat.

Later expansion may add limited preparation triggers:

```text
OnPlaced
OnSwapped
OnPrepared
```

But each such trigger must have a clear limit, such as once per preparation phase.

---

## 5. Formation Slot Rules

MVP formation:

```text
Player: [1] [2] [3] [4]
Enemy:  [1] [2] [3] [4]
```

Cards activate left to right when multiple cards are ready on the same tick.

### Card Size

MVP supports card size, but should start simple.

Recommended:

```text
Size 1: normal card, occupies 1 slot
Size 2: rare/core card, occupies 2 adjacent slots
```

Do not implement size 3 cards in the first MVP unless the engine is already stable.

### Slot Meaning

For MVP, slots matter through:

- Left/right position.
- Adjacent cards.
- Opposite enemy slot.
- Left-to-right activation priority.

No need for multi-row board in MVP.

---

## 6. Combat Timing

The combat simulation uses fixed deterministic logic ticks.

```text
1 second = 60 logic ticks
```

All combat timing is stored as integer ticks.

This includes:

- Cooldowns
- Status durations
- DOT intervals
- Freeze duration
- Haste duration
- Delayed effects

Rendering FPS and animation FPS must not affect combat logic.

---

## 7. Combat Flow

Combat has three layers:

```text
FormationSnapshot
↓
CombatEngine deterministic simulation
↓
ReplayTimeline + CombatResultSummary
```

Recommended model:

```text
Player clicks Start Battle
↓
CombatEngine simulates the full battle instantly/headlessly
↓
Engine outputs CombatResult and ReplayTimeline
↓
UI replays the timeline visually
↓
Player can inspect result summary
```

No mid-combat manual input in MVP.

---

## 8. Same-Tick Activation Priority

If multiple cards become ready on the same logic tick, resolve using this priority:

```text
1. Earlier ready tick first
2. Same tick: player/enemy side priority defined by combat setup
3. Same side: lower slot index first, left to right
4. Same slot: lower/stable card instance id
5. If still tied: deterministic seed tie-breaker
```

Player-facing explanation:

```text
When multiple cards are ready at the same time, cards activate from left to right.
```

This rule is mandatory for deterministic replay and balance testing.

---

## 9. Core Engine Naming

Use these names in code.

```text
CombatEngine
CombatSimulator
CombatState
CombatantState
FormationSnapshot
FormationSlotSnapshot
CardDefinition
CardInstance
CardRuntimeState
CombatCommand
ResolutionStack
TriggerSystem
StatusEffectSystem
ModifierSystem
DamageCalculator
CooldownSystem
TargetingSystem
CombatLog
ReplayRecorder
ReplayTimeline
CombatResult
CombatResultSummary
```

### Naming Rule

Use `CombatCommand`, not generic `ICommand`.

Reason:

`ICommand` is too generic and can be confused with UI/input/editor commands.

Use `StatusEffect`, not only `Buff`.

Reason:

The system includes buffs, debuffs, DOTs, control, and temporary rule effects.

Use `ModifierSystem` in code.

`MBF` / `Modifier Based Framework` can remain the design term.

---

## 10. MVP Data Model

### FormationSnapshot

All combatants use the same snapshot format.

This prepares the game for future async PvP.

```ts
type CombatantKind = "PLAYER" | "MONSTER" | "BOSS" | "ASYNC_PLAYER";

interface FormationSnapshot {
  id: string;
  kind: CombatantKind;
  displayName: string;
  level: number;

  maxHp: number;
  startingArmor: number;

  slots: FormationSlotSnapshot[];
  skills: SkillSnapshot[];
  relics: RelicSnapshot[];

  aiProfile?: AiProfile;
}
```

### FormationSlotSnapshot

```ts
interface FormationSlotSnapshot {
  slotIndex: number;
  cardInstanceId?: string;
  locked?: boolean;
}
```

### CardDefinition

```ts
interface CardDefinition {
  id: string;
  name: string;
  tier: "BRONZE" | "SILVER" | "GOLD" | "JADE" | "CELESTIAL";
  type: "ACTIVE" | "PASSIVE" | "AURA" | "TACTIC" | "RELIC";
  size: 1 | 2;
  tags: string[];

  cooldownTicks?: number;
  cost?: ResourceCost[];

  effects?: EffectDefinition[];
  triggers?: TriggerDefinition[];

  description: string;
}
```

### CardRuntimeState

```ts
interface CardRuntimeState {
  instanceId: string;
  definitionId: string;
  ownerCombatantId: string;
  slotIndex: number;

  cooldownMaxTicks: number;
  cooldownRemainingTicks: number;
  cooldownRecoveryRate: number;

  disabled: boolean;
  silenced: boolean;
  frozen: boolean;

  activationCount: number;
  lastActivatedTick?: number;
}
```

---

## 11. MVP Combat Grammar

Codex may only implement card effects using this grammar unless the user approves an extension.

### Phase 1 Allowed Commands

```text
DealDamage
GainArmor
ApplyBurn
ModifyCooldown
```

### Later MVP Commands

```text
ApplyFreeze
ApplyHaste
ApplyVulnerable
GainResource
SpendResource
AddModifier
DisableCard
CleanseStatus
MoveCard
```

Do not implement later commands until earlier phases are stable.

---

## 12. MVP Status Effects And Defense

### Phase 1 Status/Defense Layers

```text
Armor
Burn
```

### Later MVP Status Effects

```text
Freeze
Haste
Vulnerable
Silence
```

### Important Design Decision: No Barrier In MVP

MVP should **not** include Barrier absorb.

Reason:

Barrier creates an additional temporary HP layer that makes pre-combat calculation harder for players. Since the core gameplay asks players to inspect enemy formation and pre-calculate whether their build can win, MVP combat should keep the defensive math simple.

MVP defense should use only:

```text
HP + Armor
```

This lets players reason more easily:

```text
Can my damage engine beat enemy HP and Armor before enemy damage kills me?
```

Barrier, Ward, Energy Shield, and other layered defenses are reserved for later expansion after the core combat is readable.

### Armor

Armor reduces incoming direct damage.

Simple MVP rule:

```text
Final direct damage = max(0, incoming damage - armor)
Armor is reduced by the amount it blocked.
```

Example:

```text
Incoming damage: 8
Current armor: 3
HP damage: 5
Armor after hit: 0
```

### Burn

Burn is DOT.

```text
Burn ticks every 60 ticks.
Burn deals Fire damage.
Burn duration is stored in ticks.
```

For MVP, Burn can stack additively.

Example:

```text
ApplyBurn amount 2 duration 240
= deal 2 Fire damage every 60 ticks for 4 seconds
```

---

## 13. Damage Calculation MVP

MVP damage calculation should be simple.

```text
Base damage
↓
Damage modifiers
↓
Armor reduction
↓
HP loss
↓
AfterDamage triggers
```

Do not implement Barrier, Ward, Energy Shield, or other absorb layers in MVP.

Do not implement complex formula hacking in Phase 1.

Rule-hacking and advanced MBF can be added after the basic combat is fun.

---

## 14. ResolutionStack

The `ResolutionStack` resolves `CombatCommand` objects.

### Rule

All card effects must become commands.

Example:

```text
Flame Spear activates
↓
Push DealDamageCommand
↓
Push ApplyBurnCommand
↓
Resolve stack top
```

### Stack Safety

MVP safety limits:

```text
Max commands per tick: 200
Max commands per combat: 20,000
Max trigger depth: 50
Max combat ticks: 3,600
```

At 60 ticks/sec, 3,600 ticks = 60 seconds.

If max combat ticks is reached, choose winner by:

```text
1. Higher HP percentage
2. If tied, higher absolute HP
3. If tied, mutual draw
```

---

## 15. TriggerSystem

Passive cards listen to hooks and create commands.

MVP trigger hooks:

```text
OnCombatStart
OnCardActivated
OnDamageDealt
OnDamageTaken
OnStatusApplied
OnBurnTick
OnCooldownModified
OnCombatEnd
```

Passive triggers may have internal cooldowns.

Example:

```text
Whenever you apply Burn, deal 2 damage.
Internal cooldown: 15 ticks.
```

Internal cooldown is mandatory for high-frequency triggers.

---

## 16. ModifierSystem / MBF MVP

Do not build a full huge MBF in the first phase.

MVP `ModifierSystem` supports only:

```text
Damage modifiers
Cooldown recovery modifiers
Status duration modifiers
```

MVP hooks:

```text
BeforeDealDamage
AfterDealDamage
BeforeCooldownRecover
AfterCardActivated
OnStatusApplied
```

Modifier priority must be deterministic.

```ts
interface Modifier {
  id: string;
  sourceId: string;
  ownerId: string;
  hook: ModifierHook;
  priority: number;
  condition: ModifierCondition;
  operation: ModifierOperation;
  expiresAtTick?: number;
}
```

Lower priority number executes first unless the implementation explicitly chooses higher-first.  
Choose one rule and document it in code.

---

## 17. ReplayTimeline vs Debug Stack

The game needs both.

### ResolutionStack

Internal engine logic.

Developer/debug only.

### ReplayTimeline

Clean sequence used by UI replay.

Player-facing replay should use ReplayTimeline, not raw stack.

Replay event examples:

```text
Tick 180: Flame Spear activated.
Tick 180: Flame Spear dealt 8 Fire damage.
Tick 180: Burn applied to enemy.
Tick 240: Burn dealt 2 damage.
```

---

## 18. Combat Readability

For MVP, keep detailed tools as dev/debug UI:

```text
Combat log
Stack viewer
Modifier trace
Hook trace
Formula trace
```

Player-facing post-combat summary should show:

```text
Damage by card
Armor gained by card
Armor blocked
Status damage
Card activations
Trigger count
Top contributors
Reason for win/loss
```

Example:

```text
Top contributors:
1. Flame Spear — 42 damage, 6 activations
2. Burn — 28 damage over time
3. Spark Drum — reduced cooldown 9 times
4. Wooden Shield — gained 30 Armor, blocked 21 damage
```

---

## 19. MVP Resources

Start with simple resources.

### Outside Combat

```text
Gold
```

### Combat

```text
Life
Armor
```

Do not add Mana, Command, Spirit, Fate, Heat, Ward, or Barrier in the first engine phase.

They are reserved for later expansion.

---

## 20. MVP Card Examples

Use these as early test cards.

### Flame Spear

```json
{
  "id": "flame_spear",
  "name": "Flame Spear",
  "tier": "BRONZE",
  "type": "ACTIVE",
  "size": 1,
  "tags": ["Fire", "Weapon"],
  "cooldownTicks": 180,
  "effects": [
    { "command": "DealDamage", "amount": 8, "damageType": "Fire" },
    { "command": "ApplyBurn", "amount": 2, "durationTicks": 240 }
  ],
  "description": "Every 3s, deal 8 Fire damage and apply 2 Burn for 4s."
}
```

### Wooden Shield

```json
{
  "id": "wooden_shield",
  "name": "Wooden Shield",
  "tier": "BRONZE",
  "type": "ACTIVE",
  "size": 1,
  "tags": ["Defense", "Armor"],
  "cooldownTicks": 240,
  "effects": [
    { "command": "GainArmor", "amount": 6 }
  ],
  "description": "Every 4s, gain 6 Armor."
}
```

### Spark Drum

```json
{
  "id": "spark_drum",
  "name": "Spark Drum",
  "tier": "BRONZE",
  "type": "ACTIVE",
  "size": 1,
  "tags": ["Engine", "Cooldown"],
  "cooldownTicks": 300,
  "effects": [
    {
      "command": "ModifyCooldown",
      "target": "ADJACENT_ALLY",
      "amountTicks": -60
    }
  ],
  "description": "Every 5s, reduce adjacent allies' cooldown by 1s."
}
```

### Fire Echo Seal

```json
{
  "id": "fire_echo_seal",
  "name": "Fire Echo Seal",
  "tier": "BRONZE",
  "type": "PASSIVE",
  "size": 1,
  "tags": ["Fire", "Trigger"],
  "triggers": [
    {
      "hook": "OnStatusApplied",
      "condition": { "status": "Burn", "appliedByOwner": true },
      "internalCooldownTicks": 30,
      "effects": [
        { "command": "DealDamage", "amount": 2, "damageType": "Fire" }
      ]
    }
  ],
  "description": "Whenever you apply Burn, deal 2 Fire damage. 0.5s internal cooldown."
}
```

### Rusty Blade

```json
{
  "id": "rusty_blade",
  "name": "Rusty Blade",
  "tier": "BRONZE",
  "type": "ACTIVE",
  "size": 1,
  "tags": ["Weapon", "Physical"],
  "cooldownTicks": 120,
  "effects": [
    { "command": "DealDamage", "amount": 4, "damageType": "Physical" }
  ],
  "description": "Every 2s, deal 4 Physical damage."
}
```

---

## 21. MVP Enemy Design

Enemies are formation snapshots.

Do not create a separate monster combat system.

### Enemy Types

```text
Tutorial enemies: fixed
Normal enemies: template-generated
Boss: fixed
```

### MVP Monster Template Rules

Each monster template should define:

```text
Core mechanic
Required card
Optional cards
Defense style
Weakness
Reward pool
```

Example:

```json
{
  "id": "burn_apprentice",
  "name": "Burn Apprentice",
  "difficulty": "NORMAL",
  "slotCount": 3,
  "requiredCards": ["flame_spark"],
  "optionalCards": ["wooden_shield", "spark_drum", "fire_echo_seal"],
  "weakness": ["Burst", "Freeze"],
  "rewardPool": ["flame_spear", "fire_echo_seal", "spark_drum"]
}
```

---

## 22. MVP Shop/Event Start

Because player starts with 0 cards, the first two nodes are safe growth nodes.

### Starter Shop

- Shows 3 cards.
- At least 1 card costs 0 or is affordable.
- Player can buy at least 1 card before first combat.

### Starter Event

Example:

```text
Choose one:
1. Gain a free attack card.
2. Gain a free defense card.
3. Gain 5 gold and see another shop.
```

Hard rule:

```text
The player must be able to enter first combat with at least one active card.
```

---

## 23. Save/Resume MVP

MVP should eventually save:

```text
Run id
Seed
Current node index
Gold
Owned cards
Formation slots
Current shop/event choices
Pending reward choices
Enemy snapshot
```

But save/load is not Phase 1.

Do not implement save/load until combat core and card data are stable.

---

## 24. Async PvP Future Rule

MVP does not implement async PvP.

But all combatants must use `FormationSnapshot`.

Future async PvP will use:

```text
Latest valid player FormationSnapshot
Clean combat start state
Same day/action window
Power score matching
Deterministic AI targeting
```

Do not save temporary combat-only statuses in PvP snapshot.

---

## 25. MVP Implementation Sequence

Full prompts are in `docs/MVP_BUILD_SEQUENCE.md`.

Summary:

```text
Phase 0: MVP docs
Phase 1: TypeScript skeleton
Phase 2: Data model
Phase 3: Basic CombatEngine
Phase 4: CombatCommand + ResolutionStack
Phase 5: Armor / Burn
Phase 6: TriggerSystem
Phase 7: Minimal ModifierSystem
Phase 8: ReplayTimeline + Summary
Phase 9: Monster Templates
Phase 10: Minimal UI
Phase 11: MVP Run Loop
Phase 12: Save/Load
Phase 13: Content Expansion
```

---

## 26. Codex Hard Rules

Codex must follow these rules.

```text
1. Read docs/MVP_MASTER_DESIGN.md first.
2. Work on only the requested phase.
3. Do not implement future systems early.
4. Do not invent new commands/statuses/resources.
5. Do not implement Barrier, Ward, Energy Shield, or temporary absorb layers in MVP.
6. Keep combat deterministic.
7. Add tests for every engine change.
8. Update PROJECT_LOG.md after every task.
9. Update HANDOFF.md after every task.
10. Stop after each phase and wait for review.
11. If a new primitive is needed, propose it in HANDOFF.md instead of implementing it silently.
```

---

## 27. Development Notes

### Why TypeScript First?

Use TypeScript + Node.js + Vitest for MVP engine because:

- Codex handles it well.
- MacOS setup is easy.
- Logic is easy to test.
- Data-driven JSON cards are natural.
- Headless combat simulation is easy.
- Replay output can be inspected quickly.
- Later UI can use React/Pixi or another frontend.

### Do Not Start With Art

Art should wait until the combat loop is proven.

### Do Not Start With 150 Cards

Start with 5–10 cards and prove the grammar.

### Do Not Start With Async PvP

Only keep the snapshot architecture ready.

---

## 28. MVP Definition of Done

The MVP is successful when:

```text
1. Player starts with gold and 0 cards.
2. First two nodes give shop/event choices.
3. Player buys or receives cards.
4. Player places cards into limited slots.
5. Player previews enemy formation.
6. Player clicks Start Battle.
7. Combat is simulated deterministically.
8. ReplayTimeline can replay the fight.
9. Player gets a readable result summary.
10. Player chooses a reward.
11. Run continues through easy monster, normal monster, elite, boss.
```

The MVP does not require:

```text
Final art
Full Sanguo lore
Async PvP
Mobile support
150 cards
Full MBF
Complex rule hacking
Barrier / Ward / Energy Shield
Multi-row board
Manual mid-combat input
```
