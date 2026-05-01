import { CombatEngine } from "../combat/CombatEngine.js";
import { getMonsterCardDefinitionsById } from "../content/cards/monsterCards.js";
import type { CardDefinition, CardInstance } from "../model/card.js";
import type { FormationSnapshot, FormationSlotSnapshot } from "../model/formation.js";
import { validateFormationSnapshot } from "../validation/formationValidation.js";
import { RUN_SELL_PRICES } from "./economy.js";
import { createBattleEnemy } from "./nodes/BattleNode.js";
import { createEventChoices } from "./nodes/EventNode.js";
import { createShopChoices } from "./nodes/ShopNode.js";
import { createRewardChoices } from "./rewards/RewardGenerator.js";
import type {
  EventChoice,
  RewardChoice,
  RunActionResult,
  RunChoice,
  RunFormationSlot,
  RunNode,
  RunState,
  ShopChoice
} from "./RunState.js";

const FORMATION_SLOT_COUNT = 4;
const PLAYER_MAX_HP = 42;
const CLASS_ID_PLACEHOLDER = "class-placeholder";

const RUN_NODES: readonly RunNode[] = [
  { id: "starter-shop-1", type: "SHOP", day: 1, label: "Starter Shop" },
  { id: "starter-event-1", type: "EVENT", day: 1, label: "Starter Event" },
  {
    id: "easy-monster-1",
    type: "BATTLE",
    day: 2,
    label: "Easy Monster",
    battleDifficulty: "EASY",
    monsterTemplateId: "training-dummy"
  },
  { id: "reward-1", type: "REWARD", day: 2, label: "Reward" },
  {
    id: "normal-monster-1",
    type: "BATTLE",
    day: 3,
    label: "Normal Monster",
    battleDifficulty: "NORMAL",
    monsterTemplateId: "rust-bandit"
  },
  { id: "reward-2", type: "REWARD", day: 3, label: "Reward" },
  { id: "mid-shop-1", type: "SHOP", day: 4, label: "Shop" },
  {
    id: "elite-monster-1",
    type: "BATTLE",
    day: 5,
    label: "Elite Monster",
    battleDifficulty: "ELITE",
    monsterTemplateId: "fire-echo-adept"
  },
  { id: "reward-3", type: "REWARD", day: 5, label: "Reward" },
  {
    id: "boss-1",
    type: "BATTLE",
    day: 9,
    label: "Boss",
    battleDifficulty: "BOSS",
    monsterTemplateId: "gate-captain"
  },
  { id: "run-result", type: "RUN_RESULT", day: 9, label: "Run Result" }
];

export class RunManager {
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  state: RunState;
  #nextCardInstanceNumber = 1;

  private constructor(state: RunState, cardDefinitionsById: ReadonlyMap<string, CardDefinition>) {
    this.state = state;
    this.cardDefinitionsById = cardDefinitionsById;
  }

  static createNewRun(
    seed: string,
    cardDefinitionsById: ReadonlyMap<string, CardDefinition> = getMonsterCardDefinitionsById()
  ): RunManager {
    const node = RUN_NODES[0];
    const state: RunState = withNodeDerivedState(
      {
        runId: `run:${seed}`,
        seed,
        status: "IN_PROGRESS",
        currentNodeIndex: 0,
        gold: 10,
        ownedCards: [],
        formationSlots: createEmptyFormationSlots(FORMATION_SLOT_COUNT),
        formationSlotCount: FORMATION_SLOT_COUNT,
        chestCapacity: FORMATION_SLOT_COUNT * 2,
        currentNode: node,
        currentChoices: [],
        classId: CLASS_ID_PLACEHOLDER,
        defeatedMonsters: [],
        completedNodes: []
      },
      cardDefinitionsById
    );
    return new RunManager(state, cardDefinitionsById);
  }

  getCurrentNode(): RunNode {
    return this.state.currentNode;
  }

  getChestCards(): readonly CardInstance[] {
    const placed = getPlacedCardIds(this.state.formationSlots);
    return this.state.ownedCards.filter((card) => !placed.has(card.instanceId));
  }

  addCardToChest(cardDefinitionId: string): RunActionResult {
    if (!this.cardDefinitionsById.has(cardDefinitionId)) {
      return this.fail(`Unknown card definition: ${cardDefinitionId}`);
    }
    if (this.state.ownedCards.length >= this.state.chestCapacity) {
      return this.fail("Chest capacity is full.");
    }
    const card: CardInstance = {
      instanceId: `run-card-${this.#nextCardInstanceNumber}`,
      definitionId: cardDefinitionId
    };
    this.#nextCardInstanceNumber += 1;
    this.state = {
      ...this.state,
      ownedCards: [...this.state.ownedCards, card]
    };
    return this.ok();
  }

  moveCardFromChestToFormation(cardInstanceId: string, slotIndex: number): RunActionResult {
    const card = this.getChestCards().find((candidate) => candidate.instanceId === cardInstanceId);
    const definition = card ? this.cardDefinitionsById.get(card.definitionId) : undefined;
    if (!card || !definition) {
      return this.fail("Card is not available in chest.");
    }
    if (!canPlaceCard(this.state.formationSlots, slotIndex, definition)) {
      return this.fail("Card does not fit in that formation slot.");
    }
    this.state = {
      ...this.state,
      formationSlots: placeCard(this.state.formationSlots, card.instanceId, slotIndex, definition)
    };
    return this.ok();
  }

  removeCardFromFormationToChest(cardInstanceId: string): RunActionResult {
    if (!getPlacedCardIds(this.state.formationSlots).has(cardInstanceId)) {
      return this.fail("Card is not in formation.");
    }
    this.state = {
      ...this.state,
      formationSlots: clearCardFootprint(this.state.formationSlots, cardInstanceId)
    };
    return this.ok();
  }

  moveCardBetweenFormationSlots(cardInstanceId: string, targetSlotIndex: number): RunActionResult {
    const card = this.state.ownedCards.find((candidate) => candidate.instanceId === cardInstanceId);
    const definition = card ? this.cardDefinitionsById.get(card.definitionId) : undefined;
    if (!card || !definition || !getPlacedCardIds(this.state.formationSlots).has(cardInstanceId)) {
      return this.fail("Card is not in formation.");
    }
    const cleared = clearCardFootprint(this.state.formationSlots, cardInstanceId);
    if (!canPlaceCard(cleared, targetSlotIndex, definition)) {
      return this.fail("Card does not fit in that formation slot.");
    }
    this.state = {
      ...this.state,
      formationSlots: placeCard(cleared, cardInstanceId, targetSlotIndex, definition)
    };
    return this.ok();
  }

  sellCardFromChest(cardInstanceId: string): RunActionResult {
    if (getPlacedCardIds(this.state.formationSlots).has(cardInstanceId)) {
      return this.fail("Cards in formation cannot be sold directly.");
    }
    const card = this.state.ownedCards.find((candidate) => candidate.instanceId === cardInstanceId);
    const definition = card ? this.cardDefinitionsById.get(card.definitionId) : undefined;
    if (!card || !definition) {
      return this.fail("Card is not owned.");
    }
    this.state = {
      ...this.state,
      gold: this.state.gold + RUN_SELL_PRICES[definition.tier],
      ownedCards: this.state.ownedCards.filter((candidate) => candidate.instanceId !== cardInstanceId)
    };
    return this.ok();
  }

  chooseShopOption(optionId: string): RunActionResult {
    const choice = this.state.currentChoices.find((candidate): candidate is ShopChoice => candidate.id === optionId && candidate.type === "SHOP_CARD");
    if (!choice) {
      return this.fail("Shop option is not available.");
    }
    if (this.state.gold < choice.cost) {
      return this.fail("Not enough gold.");
    }
    if (this.state.ownedCards.length >= this.state.chestCapacity) {
      return this.fail("Chest capacity is full.");
    }
    const addResult = this.addCardToChest(choice.cardDefinitionId);
    if (!addResult.ok) {
      return addResult;
    }
    this.state = {
      ...this.state,
      gold: this.state.gold - choice.cost
    };
    return this.ok();
  }

  chooseEventOption(optionId: string): RunActionResult {
    const choice = this.state.currentChoices.find((candidate): candidate is EventChoice => candidate.id === optionId && candidate.type.startsWith("EVENT"));
    if (!choice) {
      return this.fail("Event option is not available.");
    }
    if (choice.type === "EVENT_GOLD") {
      this.state = {
        ...this.state,
        gold: this.state.gold + (choice.gold ?? 0)
      };
      return this.ok();
    }
    if (!choice.cardDefinitionId) {
      return this.fail("Event card option is missing card definition.");
    }
    return this.addCardToChest(choice.cardDefinitionId);
  }

  chooseRewardOption(optionId: string): RunActionResult {
    const choice = this.state.currentChoices.find((candidate): candidate is RewardChoice => candidate.id === optionId && candidate.type === "REWARD_CARD");
    if (!choice) {
      return this.fail("Reward option is not available.");
    }
    return this.addCardToChest(choice.cardDefinitionId);
  }

  startBattle(): RunActionResult {
    if (this.state.currentNode.type !== "BATTLE") {
      return this.fail("Current node is not a battle.");
    }
    const formationValidation = validatePlayerFormation(this.state, this.cardDefinitionsById);
    if (!formationValidation.ok) {
      return this.fail(formationValidation.error);
    }
    const playerFormation = createPlayerFormationSnapshot(this.state);
    const enemy = createBattleEnemy({
      node: this.state.currentNode,
      seed: this.state.seed,
      cardDefinitionsById: this.cardDefinitionsById
    });
    const result = new CombatEngine().simulate({
      playerFormation,
      enemyFormation: enemy.formation,
      cardInstancesById: new Map([
        ...this.state.ownedCards.map((card) => [card.instanceId, card] as const),
        ...enemy.cardInstances.map((card) => [card.instanceId, card] as const)
      ]),
      cardDefinitionsById: this.cardDefinitionsById,
      maxCombatTicks: 720
    });
    this.state = {
      ...this.state,
      currentEnemySnapshot: enemy.formation,
      currentEnemyCardInstances: enemy.cardInstances,
      pendingBattleResult: result
    };
    return this.ok();
  }

  completeBattle(): RunActionResult {
    if (!this.state.pendingBattleResult || this.state.currentNode.type !== "BATTLE") {
      return this.fail("No pending battle result.");
    }
    const result = this.state.pendingBattleResult;
    if (result.winner !== "PLAYER") {
      this.state = {
        ...this.state,
        status: "DEFEAT"
      };
      return this.ok();
    }
    const defeatedMonsterId = this.state.currentEnemySnapshot?.aiProfile?.id ?? this.state.currentNode.monsterTemplateId;
    if (this.state.currentNode.battleDifficulty === "BOSS") {
      this.state = {
        ...this.state,
        status: "VICTORY",
        defeatedMonsters: appendDefined(this.state.defeatedMonsters, defeatedMonsterId),
        completedNodes: [...this.state.completedNodes, this.state.currentNode.id]
      };
      return this.ok();
    }
    this.state = {
      ...this.state,
      defeatedMonsters: appendDefined(this.state.defeatedMonsters, defeatedMonsterId),
      completedNodes: [...this.state.completedNodes, this.state.currentNode.id],
      pendingBattleResult: undefined
    };
    return this.advanceToNextNode();
  }

  advanceToNextNode(): RunActionResult {
    const nextIndex = Math.min(this.state.currentNodeIndex + 1, RUN_NODES.length - 1);
    this.state = withNodeDerivedState(
      {
        ...this.state,
        currentNodeIndex: nextIndex,
        currentNode: RUN_NODES[nextIndex],
        currentChoices: [],
        currentEnemySnapshot: undefined,
        currentEnemyCardInstances: undefined,
        pendingBattleResult: undefined,
        completedNodes: this.state.completedNodes.includes(this.state.currentNode.id)
          ? this.state.completedNodes
          : [...this.state.completedNodes, this.state.currentNode.id]
      },
      this.cardDefinitionsById
    );
    return this.ok();
  }

  private ok(): RunActionResult {
    return { ok: true, state: this.state };
  }

  private fail(error: string): RunActionResult {
    return { ok: false, state: this.state, error };
  }
}

export function createNewRun(
  seed: string,
  cardDefinitionsById?: ReadonlyMap<string, CardDefinition>
): RunManager {
  return RunManager.createNewRun(seed, cardDefinitionsById);
}

export function getRunNodes(): readonly RunNode[] {
  return RUN_NODES;
}

function withNodeDerivedState(
  state: Omit<RunState, "currentChoices"> & { readonly currentChoices: readonly RunChoice[] },
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): RunState {
  const node = state.currentNode;
  const currentChoices =
    node.type === "SHOP"
      ? createShopChoices({
          seed: state.seed,
          nodeIndex: state.currentNodeIndex,
          cardDefinitionsById,
          starter: state.currentNodeIndex === 0
        })
      : node.type === "EVENT"
        ? createEventChoices({
            seed: state.seed,
            nodeIndex: state.currentNodeIndex,
            starter: state.currentNodeIndex === 1
          })
        : node.type === "REWARD"
          ? createRewardChoices({
              seed: state.seed,
              nodeIndex: state.currentNodeIndex,
              defeatedMonsterId: state.defeatedMonsters[state.defeatedMonsters.length - 1],
              cardDefinitionsById
            })
          : [];
  return {
    ...state,
    currentChoices
  };
}

function createEmptyFormationSlots(slotCount: number): readonly RunFormationSlot[] {
  return Array.from({ length: slotCount }, (_, index) => ({ slotIndex: index + 1 }));
}

function getPlacedCardIds(formationSlots: readonly RunFormationSlot[]): ReadonlySet<string> {
  return new Set(formationSlots.flatMap((slot) => (slot.cardInstanceId ? [slot.cardInstanceId] : [])));
}

function validatePlayerFormation(
  state: RunState,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): { readonly ok: true } | { readonly ok: false; readonly error: string } {
  const ownedCardIds = new Set(state.ownedCards.map((card) => card.instanceId));
  const placedCardIds = getPlacedCardIds(state.formationSlots);
  for (const placedCardId of placedCardIds) {
    if (!ownedCardIds.has(placedCardId)) {
      return { ok: false, error: "Formation references an unowned card." };
    }
  }

  const hasActiveCard = state.ownedCards.some((card) => {
    const definition = cardDefinitionsById.get(card.definitionId);
    return placedCardIds.has(card.instanceId) && definition?.type === "ACTIVE";
  });
  if (!hasActiveCard) {
    return { ok: false, error: "At least one active card must be placed before battle." };
  }

  const validation = validateFormationSnapshot(createPlayerFormationSnapshot(state), {
    cardDefinitionsById,
    cardInstancesById: new Map(state.ownedCards.map((card) => [card.instanceId, card]))
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors[0]?.message ?? "Formation is invalid." };
  }
  return { ok: true };
}

function createPlayerFormationSnapshot(state: RunState): FormationSnapshot {
  return {
    id: "player",
    kind: "PLAYER",
    displayName: "Player",
    level: 1,
    maxHp: PLAYER_MAX_HP,
    startingArmor: 0,
    slots: state.formationSlots.map(toFormationSlot),
    skills: [],
    relics: []
  };
}

function toFormationSlot(slot: RunFormationSlot): FormationSlotSnapshot {
  if (slot.cardInstanceId) {
    return { slotIndex: slot.slotIndex, cardInstanceId: slot.cardInstanceId };
  }
  if (slot.lockedByInstanceId) {
    return { slotIndex: slot.slotIndex, locked: true };
  }
  return { slotIndex: slot.slotIndex };
}

function canPlaceCard(
  formationSlots: readonly RunFormationSlot[],
  slotIndex: number,
  cardDefinition: CardDefinition
): boolean {
  const slot = formationSlots[slotIndex - 1];
  if (!slot || slot.cardInstanceId || slot.lockedByInstanceId) {
    return false;
  }
  if (cardDefinition.size === 1) {
    return true;
  }
  const nextSlot = formationSlots[slotIndex];
  return nextSlot !== undefined && !nextSlot.cardInstanceId && !nextSlot.lockedByInstanceId;
}

function placeCard(
  formationSlots: readonly RunFormationSlot[],
  cardInstanceId: string,
  slotIndex: number,
  cardDefinition: CardDefinition
): readonly RunFormationSlot[] {
  return formationSlots.map((slot) => {
    if (slot.slotIndex === slotIndex) {
      return { slotIndex: slot.slotIndex, cardInstanceId };
    }
    if (cardDefinition.size === 2 && slot.slotIndex === slotIndex + 1) {
      return { slotIndex: slot.slotIndex, lockedByInstanceId: cardInstanceId };
    }
    return slot;
  });
}

function clearCardFootprint(
  formationSlots: readonly RunFormationSlot[],
  cardInstanceId: string
): readonly RunFormationSlot[] {
  return formationSlots.map((slot) =>
    slot.cardInstanceId === cardInstanceId || slot.lockedByInstanceId === cardInstanceId
      ? { slotIndex: slot.slotIndex }
      : slot
  );
}

function appendDefined(values: readonly string[], value: string | undefined): readonly string[] {
  return value === undefined ? values : [...values, value];
}
