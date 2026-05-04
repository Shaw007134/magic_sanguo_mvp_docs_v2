import { CombatEngine } from "../combat/CombatEngine.js";
import type { Modifier } from "../combat/modifiers/Modifier.js";
import {
  createEffectiveCardDefinitionMap,
  createEffectiveCardInstances,
  describeUpgradePreview,
  getEffectiveCardDefinitionId
} from "../content/cards/effectiveCardDefinition.js";
import { getActiveCardDefinitionsById } from "../content/cards/activeCards.js";
import type { CardDefinition, CardInstance, CardTier } from "../model/card.js";
import type { FormationSnapshot, FormationSlotSnapshot } from "../model/formation.js";
import { validateFormationSnapshot } from "../validation/formationValidation.js";
import { RUN_SELL_PRICES } from "./economy.js";
import { createBattleEnemy } from "./nodes/BattleNode.js";
import { createEventChoices } from "./nodes/EventNode.js";
import { createShopChoices } from "./nodes/ShopNode.js";
import { createLevelUpRewardChoices, createRewardChoices } from "./rewards/RewardGenerator.js";
import type {
  EventChoice,
  LevelUpRewardChoice,
  PendingRewardSource,
  RewardChoice,
  RunActionResult,
  RunChoice,
  RunFormationSlot,
  RunNode,
  RunState,
  ShopChoice
} from "./RunState.js";
import type { SkillInstance } from "./skills/Skill.js";
import { createSkillModifiers, getSkillDefinitionsById } from "./skills/skillDefinitions.js";

const FORMATION_SLOT_COUNT = 4;
const PLAYER_STARTING_MAX_HP = 40;
const CLASS_ID_PLACEHOLDER = "class-placeholder";
const EXP_TO_NEXT_LEVEL = 10;
const MAX_LEVEL = 10;

const CARD_TIER_UPGRADES = {
  BRONZE: "SILVER",
  SILVER: "GOLD",
  GOLD: "JADE",
  JADE: "CELESTIAL"
} as const satisfies Partial<Record<CardTier, CardTier>>;

const STARTER_NODES: readonly RunNode[] = [
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
  { id: "shop-1", type: "SHOP", day: 3, label: "Shop" },
  {
    id: "normal-monster-1",
    type: "BATTLE",
    day: 3,
    label: "Normal Monster",
    battleDifficulty: "NORMAL",
    monsterTemplateId: "bandit-duelist"
  },
  { id: "reward-2", type: "REWARD", day: 3, label: "Reward" },
  { id: "shop-2", type: "SHOP", day: 4, label: "Shop" },
  {
    id: "elite-monster-1",
    type: "BATTLE",
    day: 5,
    label: "Elite Monster",
    battleDifficulty: "ELITE",
    monsterTemplateId: "cinder-captain"
  },
  { id: "reward-3", type: "REWARD", day: 5, label: "Reward" }
];

const RUN_RESULT_NODE: RunNode = { id: "run-result", type: "RUN_RESULT", day: 10, label: "Run Result" };

export class RunManager {
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  state: RunState;
  #nextCardInstanceNumber = 1;
  #nextSkillInstanceNumber = 1;

  private constructor(state: RunState, cardDefinitionsById: ReadonlyMap<string, CardDefinition>) {
    this.state = state;
    this.cardDefinitionsById = cardDefinitionsById;
  }

  static createNewRun(
    seed: string,
    cardDefinitionsById: ReadonlyMap<string, CardDefinition> = getActiveCardDefinitionsById()
  ): RunManager {
    const node = getNodeForIndex(0, 1, "IN_PROGRESS");
    const state: RunState = withNodeDerivedState(
      {
        runId: `run:${seed}`,
        seed,
        status: "IN_PROGRESS",
        currentNodeIndex: 0,
        level: 1,
        exp: 0,
        expToNextLevel: EXP_TO_NEXT_LEVEL,
        gold: 10,
        currentHp: PLAYER_STARTING_MAX_HP,
        maxHp: PLAYER_STARTING_MAX_HP,
        ownedCards: [],
        ownedSkills: [],
        formationSlots: createEmptyFormationSlots(FORMATION_SLOT_COUNT),
        formationSlotCount: FORMATION_SLOT_COUNT,
        chestCapacity: FORMATION_SLOT_COUNT * 2,
        currentNode: node,
        currentChoices: [],
        pendingRewardChoices: [],
        pendingLevelUpChoices: [],
        shopStates: [],
        completedEncounterCount: 0,
        defeatedBattleCount: 0,
        classId: CLASS_ID_PLACEHOLDER,
        defeatedMonsters: [],
        completedNodes: []
      },
      cardDefinitionsById
    );
    return new RunManager(state, cardDefinitionsById);
  }

  static restoreFromState(
    state: RunState,
    cardDefinitionsById: ReadonlyMap<string, CardDefinition> = getActiveCardDefinitionsById()
  ): RunManager {
    const manager = new RunManager(state, cardDefinitionsById);
    manager.#nextCardInstanceNumber = getNextNumberFromInstances(state.ownedCards, "run-card-");
    manager.#nextSkillInstanceNumber = getNextNumberFromInstances(state.ownedSkills, "run-skill-");
    return manager;
  }

  getCurrentNode(): RunNode {
    return this.state.currentNode;
  }

  getChestCards(): readonly CardInstance[] {
    const placed = getPlacedCardIds(this.state.formationSlots);
    return this.state.ownedCards.filter((card) => !placed.has(card.instanceId));
  }

  getPlayerFormationSnapshot(): FormationSnapshot {
    return createPlayerFormationSnapshot(this.state);
  }

  addCardToChest(cardDefinitionId: string): RunActionResult {
    return this.addNewCardToChest(cardDefinitionId);
  }

  gainCardOrUpgradeDuplicate(cardDefinitionId: string): RunActionResult {
    const baseDefinition = this.cardDefinitionsById.get(cardDefinitionId);
    if (!baseDefinition) {
      return this.fail(`Unknown card definition: ${cardDefinitionId}`);
    }
    const duplicate = this.state.ownedCards.find((card) => {
      const definition = this.cardDefinitionsById.get(card.definitionId);
      const effectiveTier = card.tierOverride ?? definition?.tier;
      return card.definitionId === cardDefinitionId && effectiveTier === baseDefinition.tier;
    });
    if (!duplicate) {
      return this.addNewCardToChest(cardDefinitionId);
    }
    const fromTier = duplicate.tierOverride ?? baseDefinition.tier;
    const toTier = CARD_TIER_UPGRADES[fromTier as keyof typeof CARD_TIER_UPGRADES];
    if (!toTier) {
      return this.addNewCardToChest(cardDefinitionId);
    }
    const upgradeResult = this.upgradeOwnedCard(duplicate.instanceId, toTier);
    if (!upgradeResult.ok) {
      return upgradeResult;
    }
    return this.ok(`Duplicate ${baseDefinition.name} upgraded existing ${baseDefinition.name}: ${fromTier} -> ${toTier}. ${this.createUpgradePreview(duplicate, toTier)}`);
  }

  private addNewCardToChest(cardDefinitionId: string): RunActionResult {
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
    return this.ok("Added card.");
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
    const tier = card.tierOverride ?? definition.tier;
    this.state = {
      ...this.state,
      gold: this.state.gold + RUN_SELL_PRICES[tier],
      ownedCards: this.state.ownedCards.filter((candidate) => candidate.instanceId !== cardInstanceId)
    };
    return this.ok();
  }

  chooseShopOption(optionId: string): RunActionResult {
    if (this.state.currentNode.type !== "SHOP") {
      return this.fail("Current node is not a shop.");
    }
    const choice = this.state.currentChoices.find(
      (candidate): candidate is ShopChoice => candidate.id === optionId && candidate.type === "SHOP_CARD"
    );
    if (!choice) {
      return this.fail("Shop option is not available.");
    }
    if (choice.purchased || getCurrentShopState(this.state)?.purchasedOptionIds.includes(optionId)) {
      return this.fail("Shop option is already sold out.");
    }
    if (this.state.gold < choice.cost) {
      return this.fail("Not enough gold.");
    }
    const addResult = this.gainCardOrUpgradeDuplicate(choice.cardDefinitionId);
    if (!addResult.ok) {
      return addResult;
    }
    this.state = {
      ...this.state,
      gold: this.state.gold - choice.cost,
      shopStates: updateCurrentShopState(this.state, (shopState) => ({
        ...shopState,
        purchasedOptionIds: [...shopState.purchasedOptionIds, optionId]
      }))
    };
    this.state = refreshCurrentChoices(this.state, this.cardDefinitionsById);
    return this.ok(addResult.message ?? "Purchased card.");
  }

  leaveShop(): RunActionResult {
    if (this.state.currentNode.type !== "SHOP") {
      return this.fail("Current node is not a shop.");
    }
    const shopState = getCurrentShopState(this.state);
    if (!shopState?.expGranted) {
      this.state = {
        ...this.state,
        shopStates: updateCurrentShopState(this.state, (current) => ({ ...current, expGranted: true }))
      };
      this.gainExp(1, "SHOP");
    }
    return this.continueAfterEncounter(true);
  }

  chooseEventOption(optionId: string): RunActionResult {
    const choice = this.state.currentChoices.find(
      (candidate): candidate is EventChoice => candidate.id === optionId && candidate.type.startsWith("EVENT")
    );
    if (!choice) {
      return this.fail("Event option is not available.");
    }
    if (choice.type === "EVENT_GOLD") {
      this.state = {
        ...this.state,
        gold: this.state.gold + (choice.gold ?? 0)
      };
    } else if (choice.type === "EVENT_HEAL") {
      this.state = {
        ...this.state,
        currentHp: Math.min(this.state.maxHp, this.state.currentHp + (choice.heal ?? 0))
      };
    } else {
      if (!choice.cardDefinitionId) {
        return this.fail("Event card option is missing card definition.");
      }
      const addResult = this.gainCardOrUpgradeDuplicate(choice.cardDefinitionId);
      if (!addResult.ok) {
        return addResult;
      }
    }
    this.gainExp(1, "EVENT");
    return this.continueAfterEncounter(true);
  }

  chooseRewardOption(optionId: string): RunActionResult {
    const choice = this.state.currentChoices.find(
      (candidate): candidate is RewardChoice => candidate.id === optionId && candidate.type.startsWith("REWARD")
    );
    if (!choice) {
      return this.fail("Reward option is not available.");
    }
    const applyResult = this.applyRewardChoice(choice);
    if (!applyResult.ok) {
      return applyResult;
    }
    const message = applyResult.message;
    const advanceResult = this.advanceToNextNode();
    return advanceResult.ok ? this.ok(message ?? advanceResult.message) : advanceResult;
  }

  chooseLevelUpReward(optionId: string): RunActionResult {
    const choice = this.state.pendingLevelUpChoices.find((candidate) => candidate.id === optionId);
    if (!choice) {
      return this.fail("Level-up reward option is not available.");
    }
    const applyResult = this.applyLevelUpChoice(choice);
    if (!applyResult.ok) {
      return applyResult;
    }
    this.state = {
      ...this.state,
      pendingLevelUpChoices: [],
      currentChoices: []
    };
    this.processLevelUps();
    if (this.state.pendingLevelUpChoices.length > 0) {
      return this.ok();
    }
    const interruptedNodeIndex = this.state.interruptedNodeIndex;
    const interruptedNode = this.state.interruptedNode;
    const advanceAfterLevelUp = this.state.advanceAfterLevelUp;
    this.state = {
      ...this.state,
      interruptedNodeIndex: undefined,
      interruptedNode: undefined,
      advanceAfterLevelUp: undefined,
      currentNodeIndex: interruptedNodeIndex ?? this.state.currentNodeIndex,
      currentNode: interruptedNode ?? this.state.currentNode
    };
    return advanceAfterLevelUp ? this.advanceToNextNode() : this.ok();
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
    const enemy =
      this.state.currentEnemySnapshot && this.state.currentEnemyCardInstances
        ? {
            formation: this.state.currentEnemySnapshot,
            cardInstances: this.state.currentEnemyCardInstances
          }
        : createBattleEnemy({
            node: this.state.currentNode,
            seed: this.state.seed,
            cardDefinitionsById: this.cardDefinitionsById
          });
    const effectivePlayerCards = createEffectiveCardInstances(this.state.ownedCards);
    const effectiveDefinitionsById = createEffectiveCardDefinitionMap({
      cardInstances: this.state.ownedCards,
      baseDefinitionsById: this.cardDefinitionsById
    });
    const result = new CombatEngine().simulate({
      playerFormation,
      enemyFormation: enemy.formation,
      cardInstancesById: new Map([
        ...effectivePlayerCards.map((card) => [card.instanceId, card] as const),
        ...enemy.cardInstances.map((card) => [card.instanceId, card] as const)
      ]),
      cardDefinitionsById: effectiveDefinitionsById,
      modifiers: createSkillModifiers({ ownedSkills: this.state.ownedSkills, ownerId: "player" }),
      maxCombatTicks: 720
    });
    this.state = {
      ...this.state,
      currentEnemySnapshot: enemy.formation,
      currentEnemyCardInstances: enemy.cardInstances,
      pendingCombatResult: result,
      pendingBattleResult: result
    };
    return this.ok();
  }

  completeBattle(): RunActionResult {
    const pendingResult = this.state.pendingCombatResult ?? this.state.pendingBattleResult;
    if (!pendingResult || this.state.currentNode.type !== "BATTLE") {
      return this.fail("No pending battle result.");
    }
    if (pendingResult.winner !== "PLAYER") {
      this.state = {
        ...this.state,
        status: "DEFEAT",
        currentHp: 0,
        pendingCombatResult: pendingResult,
        pendingBattleResult: pendingResult
      };
      return this.ok();
    }

    const defeatedMonsterId = this.state.currentEnemySnapshot?.aiProfile?.id ?? this.state.currentNode.monsterTemplateId;
    const rewardSource: PendingRewardSource = {
      defeatedMonsterId,
      defeatedMonsterName: this.state.currentEnemySnapshot?.displayName,
      usedCardDefinitionIds: uniqueValues(
        (this.state.currentEnemyCardInstances ?? []).map((card) => card.definitionId)
      )
    };
    const nextState = {
      ...this.state,
      currentHp: Math.max(1, pendingResult.playerFinalHp),
      defeatedBattleCount: this.state.defeatedBattleCount + 1,
      completedEncounterCount: this.state.completedEncounterCount + 1,
      defeatedMonsters: appendDefined(this.state.defeatedMonsters, defeatedMonsterId),
      pendingRewardSource: rewardSource,
      completedNodes: this.state.completedNodes.includes(this.state.currentNode.id)
        ? this.state.completedNodes
        : [...this.state.completedNodes, this.state.currentNode.id],
      pendingCombatResult: undefined,
      pendingBattleResult: undefined
    };
    this.state = nextState;

    if (this.state.currentNode.battleDifficulty === "BOSS") {
      this.state = {
        ...this.state,
        status: "VICTORY",
        currentNode: RUN_RESULT_NODE,
        currentNodeIndex: this.state.currentNodeIndex + 1,
        currentChoices: []
      };
      return this.ok();
    }

    this.gainExp(4, "BATTLE_WIN");
    return this.continueAfterEncounter(false);
  }

  gainExp(amount: number, _reason: string): RunActionResult {
    if (this.state.status !== "IN_PROGRESS" || this.state.level >= MAX_LEVEL) {
      return this.ok();
    }
    this.state = {
      ...this.state,
      exp: this.state.exp + amount
    };
    this.processLevelUps();
    return this.ok();
  }

  processLevelUps(): RunActionResult {
    if (
      this.state.status !== "IN_PROGRESS" ||
      this.state.level >= MAX_LEVEL ||
      this.state.exp < this.state.expToNextLevel ||
      this.state.pendingLevelUpChoices.length > 0
    ) {
      return this.ok();
    }

    const nextLevel = Math.min(MAX_LEVEL, this.state.level + 1);
    const nextMaxHp = Math.ceil(this.state.maxHp * 1.1);
    const levelUpNode: RunNode = {
      id: `level-up-${nextLevel}`,
      type: "LEVEL_UP_REWARD",
      day: this.state.currentNode.day,
      label: `Level ${nextLevel} Reward`
    };
    const choices = createLevelUpRewardChoices({
      seed: this.state.seed,
      level: nextLevel,
      ownedCards: this.state.ownedCards,
      ownedSkills: this.state.ownedSkills,
      cardDefinitionsById: this.cardDefinitionsById
    });
    this.state = {
      ...this.state,
      level: nextLevel,
      exp: nextLevel >= MAX_LEVEL ? 0 : this.state.exp - this.state.expToNextLevel,
      maxHp: nextMaxHp,
      currentHp: nextMaxHp,
      currentNode: levelUpNode,
      currentChoices: choices,
      pendingLevelUpChoices: choices,
      interruptedNodeIndex: this.state.interruptedNodeIndex ?? this.state.currentNodeIndex,
      interruptedNode: this.state.interruptedNode ?? this.state.currentNode
    };
    return this.ok();
  }

  advanceToNextNode(): RunActionResult {
    const nextIndex = this.state.currentNode.type === "RUN_RESULT" ? this.state.currentNodeIndex : this.state.currentNodeIndex + 1;
    const nextNode = getNodeForIndex(nextIndex, this.state.level, this.state.status);
    const leavingReward = this.state.currentNode.type === "REWARD";
    this.state = withNodeDerivedState(
      {
        ...this.state,
        currentNodeIndex: nextIndex,
        currentNode: nextNode,
        currentChoices: [],
        currentEnemySnapshot: undefined,
        currentEnemyCardInstances: undefined,
        pendingCombatResult: undefined,
        pendingBattleResult: undefined,
        pendingRewardSource: leavingReward ? undefined : this.state.pendingRewardSource,
        completedNodes: this.state.completedNodes.includes(this.state.currentNode.id)
          ? this.state.completedNodes
          : [...this.state.completedNodes, this.state.currentNode.id]
      },
      this.cardDefinitionsById
    );
    return this.ok();
  }

  private continueAfterEncounter(incrementEncounterCount: boolean): RunActionResult {
    this.state = {
      ...this.state,
      completedEncounterCount: this.state.completedEncounterCount + (incrementEncounterCount ? 1 : 0)
    };
    if (this.state.pendingLevelUpChoices.length > 0) {
      this.state = {
        ...this.state,
        advanceAfterLevelUp: true
      };
      return this.ok();
    }
    return this.advanceToNextNode();
  }

  private applyRewardChoice(choice: RewardChoice): RunActionResult {
    if (choice.type === "REWARD_GOLD") {
      this.state = {
        ...this.state,
        gold: this.state.gold + (choice.gold ?? 0)
      };
      return this.ok();
    }
    if (choice.type === "REWARD_UPGRADE") {
      return this.upgradeOwnedCard(choice.cardInstanceId, choice.toTier);
    }
    if (choice.type === "REWARD_SKILL") {
      return this.addSkill(choice.skillDefinitionId);
    }
    if (!choice.cardDefinitionId) {
      return this.fail("Reward card option is missing card definition.");
    }
    return this.gainCardOrUpgradeDuplicate(choice.cardDefinitionId);
  }

  private applyLevelUpChoice(choice: LevelUpRewardChoice): RunActionResult {
    if (choice.type === "LEVEL_GOLD") {
      this.state = {
        ...this.state,
        gold: this.state.gold + (choice.gold ?? 0)
      };
      return this.ok();
    }
    if (choice.type === "LEVEL_UPGRADE") {
      return this.upgradeOwnedCard(choice.cardInstanceId, choice.toTier);
    }
    if (choice.type === "LEVEL_SKILL") {
      return this.addSkill(choice.skillDefinitionId);
    }
    if (!choice.cardDefinitionId) {
      return this.fail("Level-up card option is missing card definition.");
    }
    return this.gainCardOrUpgradeDuplicate(choice.cardDefinitionId);
  }

  private upgradeOwnedCard(cardInstanceId: string | undefined, requestedTier: CardTier | undefined): RunActionResult {
    if (!cardInstanceId) {
      return this.fail("Upgrade reward is missing card instance.");
    }
    let upgraded = false;
    const ownedCards = this.state.ownedCards.map((card) => {
      if (card.instanceId !== cardInstanceId) {
        return card;
      }
      const definition = this.cardDefinitionsById.get(card.definitionId);
      const fromTier = card.tierOverride ?? definition?.tier;
      const toTier = requestedTier ?? (fromTier ? CARD_TIER_UPGRADES[fromTier as keyof typeof CARD_TIER_UPGRADES] : undefined);
      if (!toTier) {
        return card;
      }
      upgraded = true;
      return { ...card, tierOverride: toTier };
    });
    if (!upgraded) {
      return this.fail("No upgrade is available for that card.");
    }
    const message = this.createUpgradeMessage(cardInstanceId, requestedTier);
    this.state = {
      ...this.state,
      ownedCards
    };
    return this.ok(message);
  }

  private addSkill(skillDefinitionId: string | undefined): RunActionResult {
    if (!skillDefinitionId) {
      return this.fail("Skill reward is missing skill definition.");
    }
    const skillDefinition = getSkillDefinitionsById().get(skillDefinitionId);
    if (!skillDefinition) {
      return this.fail(`Unknown skill definition: ${skillDefinitionId}`);
    }
    if (this.state.ownedSkills.some((skill) => skill.definitionId === skillDefinitionId)) {
      return this.fail("Skill is already owned.");
    }
    const skill: SkillInstance = {
      instanceId: `run-skill-${this.#nextSkillInstanceNumber}`,
      definitionId: skillDefinitionId
    };
    this.#nextSkillInstanceNumber += 1;
    this.state = {
      ...this.state,
      ownedSkills: [...this.state.ownedSkills, skill]
    };
    return this.ok(`Learned ${skillDefinition.name}.`);
  }

  private createUpgradeMessage(cardInstanceId: string, requestedTier: CardTier | undefined): string {
    const card = this.state.ownedCards.find((candidate) => candidate.instanceId === cardInstanceId);
    const baseDefinition = card ? this.cardDefinitionsById.get(card.definitionId) : undefined;
    if (!card || !baseDefinition) {
      return "Card upgraded.";
    }
    const toTier = requestedTier ?? card.tierOverride;
    const fromTier = previousTier(toTier) ?? baseDefinition.tier;
    return `${baseDefinition.name} upgraded: ${fromTier} -> ${toTier ?? "?"}. ${this.createUpgradePreview(card, toTier)}`;
  }

  private createUpgradePreview(card: CardInstance, toTier: CardTier | undefined): string {
    const baseDefinition = this.cardDefinitionsById.get(card.definitionId);
    if (!baseDefinition || !toTier) {
      return "";
    }
    return describeUpgradePreview({ card, baseDefinition, toTier });
  }

  private ok(message?: string): RunActionResult {
    return { ok: true, state: this.state, message };
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
  return STARTER_NODES;
}

function getNodeForIndex(index: number, level: number, status: RunState["status"]): RunNode {
  if (status !== "IN_PROGRESS") {
    return RUN_RESULT_NODE;
  }
  if (level >= MAX_LEVEL) {
    return {
      id: `final-boss-${index}`,
      type: "BATTLE",
      day: 10,
      label: "Final Boss",
      battleDifficulty: "BOSS",
      monsterTemplateId: "gate-captain-elite"
    };
  }
  const starterNode = STARTER_NODES[index];
  if (starterNode) {
    return starterNode;
  }
  const cycleIndex = index - STARTER_NODES.length;
  const day = 6 + Math.floor(cycleIndex / 3);
  const cycleSlot = cycleIndex % 3;
  if (cycleSlot === 0) {
    return {
      id: `cycle-shop-${cycleIndex}`,
      type: cycleIndex % 2 === 0 ? "SHOP" : "EVENT",
      day,
      label: cycleIndex % 2 === 0 ? "Shop" : "Event"
    };
  }
  if (cycleSlot === 1) {
    const elite = Math.floor(cycleIndex / 3) % 3 === 2;
    return {
      id: `${elite ? "cycle-elite" : "cycle-normal"}-${cycleIndex}`,
      type: "BATTLE",
      day,
      label: elite ? "Elite Battle" : "Battle",
      battleDifficulty: elite ? "ELITE" : "NORMAL",
      monsterTemplateId: elite ? "cinder-captain" : getCycleMonsterTemplateId(cycleIndex)
    };
  }
  return { id: `cycle-reward-${cycleIndex}`, type: "REWARD", day, label: "Reward" };
}

function withNodeDerivedState(
  state: Omit<RunState, "currentChoices" | "pendingRewardChoices" | "shopStates"> & {
    readonly currentChoices: readonly RunChoice[];
    readonly pendingRewardChoices: readonly RewardChoice[];
    readonly shopStates: RunState["shopStates"];
  },
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): RunState {
  const node = state.currentNode;
  const shopStates = node.type === "SHOP" ? ensureShopState(state, cardDefinitionsById) : state.shopStates;
  const shopState = shopStates.find((candidate) => candidate.nodeId === node.id);
  const battleEnemy =
    node.type === "BATTLE" && !state.currentEnemySnapshot
      ? createBattleEnemy({ node, seed: state.seed, cardDefinitionsById })
      : undefined;
  const currentChoices =
    node.type === "SHOP"
      ? (shopState?.choices.map((choice) => ({
          ...choice,
          purchased: shopState.purchasedOptionIds.includes(choice.id)
        })) ?? [])
      : node.type === "EVENT"
        ? createEventChoices({
            seed: state.seed,
            nodeIndex: state.currentNodeIndex,
            cardDefinitionsById,
            starter: state.currentNodeIndex === 1
          })
        : node.type === "REWARD"
          ? createRewardChoices({
              seed: state.seed,
              nodeIndex: state.currentNodeIndex,
              defeatedMonsterId: state.pendingRewardSource?.defeatedMonsterId,
              usedCardDefinitionIds: state.pendingRewardSource?.usedCardDefinitionIds,
              cardDefinitionsById,
              ownedCards: state.ownedCards,
              ownedSkills: state.ownedSkills
            })
          : [];
  return {
    ...state,
    shopStates,
    currentEnemySnapshot: battleEnemy?.formation ?? state.currentEnemySnapshot,
    currentEnemyCardInstances: battleEnemy?.cardInstances ?? state.currentEnemyCardInstances,
    currentChoices,
    pendingRewardChoices: node.type === "REWARD" ? (currentChoices as readonly RewardChoice[]) : []
  };
}

function refreshCurrentChoices(
  state: RunState,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): RunState {
  return withNodeDerivedState({ ...state, currentChoices: [], pendingRewardChoices: [] }, cardDefinitionsById);
}

function getCycleMonsterTemplateId(cycleIndex: number): string {
  const templates = [
    "iron-patrol",
    "oil-raider",
    "shield-sergeant",
    "drum-adept",
    "siege-trainee",
    "banner-guard",
    "bandit-duelist"
  ] as const;
  return templates[Math.floor(cycleIndex / 3) % templates.length];
}

function ensureShopState(
  state: Pick<RunState, "shopStates" | "currentNode" | "currentNodeIndex" | "seed">,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): RunState["shopStates"] {
  if (state.shopStates.some((shopState) => shopState.nodeId === state.currentNode.id)) {
    return state.shopStates;
  }
  const choices = createShopChoices({
    seed: state.seed,
    nodeIndex: state.currentNodeIndex,
    cardDefinitionsById,
    starter: state.currentNodeIndex === 0
  });
  return [
    ...state.shopStates,
    {
      nodeId: state.currentNode.id,
      choices,
      purchasedOptionIds: [],
      expGranted: false
    }
  ];
}

function getCurrentShopState(state: RunState) {
  return state.shopStates.find((shopState) => shopState.nodeId === state.currentNode.id);
}

function updateCurrentShopState(
  state: RunState,
  update: (shopState: NonNullable<ReturnType<typeof getCurrentShopState>>) => NonNullable<ReturnType<typeof getCurrentShopState>>
) {
  return state.shopStates.map((shopState) =>
    shopState.nodeId === state.currentNode.id ? update(shopState) : shopState
  );
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

function getNextNumberFromInstances(
  instances: readonly { readonly instanceId: string }[],
  prefix: string
): number {
  const maxNumber = instances.reduce((max, instance) => {
    if (!instance.instanceId.startsWith(prefix)) {
      return max;
    }
    const parsed = Number(instance.instanceId.slice(prefix.length));
    return Number.isInteger(parsed) && parsed > max ? parsed : max;
  }, 0);
  return maxNumber + 1;
}

function createPlayerFormationSnapshot(state: RunState): FormationSnapshot {
  return {
    id: "player",
    kind: "PLAYER",
    displayName: "Player",
    level: state.level,
    maxHp: state.currentHp,
    startingArmor: 0,
    slots: state.formationSlots.map(toFormationSlot),
    skills: state.ownedSkills.map((skill) => ({ id: skill.instanceId, definitionId: skill.definitionId })),
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

function uniqueValues(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function previousTier(tier: CardTier | undefined): CardTier | undefined {
  switch (tier) {
    case "SILVER":
      return "BRONZE";
    case "GOLD":
      return "SILVER";
    case "JADE":
      return "GOLD";
    case "CELESTIAL":
      return "JADE";
    default:
      return undefined;
  }
}
