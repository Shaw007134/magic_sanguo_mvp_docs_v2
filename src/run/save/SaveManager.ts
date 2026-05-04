import type { CardDefinition, CardInstance } from "../../model/card.js";
import type { FormationSnapshot } from "../../model/formation.js";
import type { CombatResult } from "../../model/result.js";
import { getActiveCardDefinitionsById } from "../../content/cards/activeCards.js";
import { validateFormationSnapshot } from "../../validation/formationValidation.js";
import { FIXED_CHEST_CAPACITY, RunManager } from "../RunManager.js";
import type {
  EventChoice,
  LevelUpRewardChoice,
  RewardChoice,
  RunChoice,
  RunFormationSlot,
  RunNode,
  RunNodeType,
  RunShopState,
  RunState,
  RunStatus,
  ShopChoice
} from "../RunState.js";
import { getSkillDefinitionsById } from "../skills/skillDefinitions.js";

export const RUN_SAVE_FORMAT_VERSION = 2;
const PHASE_15A_UNSUPPORTED_V1_MESSAGE =
  "Unsupported save format version: 1. Phase 15A requires save version 2 because chest capacity changed to fixed 16.";

export interface RunSaveData {
  readonly version: typeof RUN_SAVE_FORMAT_VERSION;
  readonly runId: string;
  readonly seed: string;
  readonly state: RunState;
}

export type SaveLoadResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };

const RUN_STATUSES = ["IN_PROGRESS", "VICTORY", "DEFEAT"] as const satisfies readonly RunStatus[];
const RUN_NODE_TYPES = ["SHOP", "EVENT", "BATTLE", "REWARD", "LEVEL_UP_REWARD", "RUN_RESULT"] as const satisfies readonly RunNodeType[];
const BATTLE_DIFFICULTIES = ["EASY", "NORMAL", "ELITE", "BOSS"] as const;
const CARD_TIERS = ["BRONZE", "SILVER", "GOLD", "JADE", "CELESTIAL"] as const;
const COMBAT_WINNERS = ["PLAYER", "ENEMY", "DRAW"] as const;

export function createRunSaveData(
  state: RunState,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition> = getActiveCardDefinitionsById()
): SaveLoadResult<RunSaveData> {
  const validation = validateRunState(state, cardDefinitionsById);
  if (!validation.ok) {
    return validation;
  }
  return {
    ok: true,
    value: {
      version: RUN_SAVE_FORMAT_VERSION,
      runId: state.runId,
      seed: state.seed,
      state: cloneJson(state)
    }
  };
}

export function serializeRunState(
  state: RunState,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition> = getActiveCardDefinitionsById()
): SaveLoadResult<string> {
  const saveData = createRunSaveData(state, cardDefinitionsById);
  if (!saveData.ok) {
    return saveData;
  }
  return { ok: true, value: JSON.stringify(saveData.value) };
}

export function deserializeRunState(
  rawSaveData: string,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition> = getActiveCardDefinitionsById()
): SaveLoadResult<RunState> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawSaveData);
  } catch {
    return { ok: false, error: "Save data is corrupt JSON." };
  }
  return parseRunSaveData(parsed, cardDefinitionsById);
}

export function loadRunManagerFromSaveString(
  rawSaveData: string,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition> = getActiveCardDefinitionsById()
): SaveLoadResult<RunManager> {
  const stateResult = deserializeRunState(rawSaveData, cardDefinitionsById);
  if (!stateResult.ok) {
    return stateResult;
  }
  return {
    ok: true,
    value: RunManager.restoreFromState(stateResult.value, cardDefinitionsById)
  };
}

export function parseRunSaveData(
  saveData: unknown,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition> = getActiveCardDefinitionsById()
): SaveLoadResult<RunState> {
  if (!isRecord(saveData)) {
    return { ok: false, error: "Save data must be an object." };
  }
  if (saveData["version"] === 1) {
    return { ok: false, error: PHASE_15A_UNSUPPORTED_V1_MESSAGE };
  }
  if (saveData["version"] !== RUN_SAVE_FORMAT_VERSION) {
    return { ok: false, error: `Unsupported save format version: ${String(saveData["version"])}.` };
  }
  if (typeof saveData["runId"] !== "string" || saveData["runId"].length === 0) {
    return { ok: false, error: "Save data is missing required field: runId." };
  }
  if (typeof saveData["seed"] !== "string" || saveData["seed"].length === 0) {
    return { ok: false, error: "Save data is missing required field: seed." };
  }
  const state = saveData["state"];
  if (!isRecord(state)) {
    return { ok: false, error: "Save data is missing required field: state." };
  }
  if (state["runId"] !== saveData["runId"]) {
    return { ok: false, error: "Save data runId does not match RunState runId." };
  }
  if (state["seed"] !== saveData["seed"]) {
    return { ok: false, error: "Save data seed does not match RunState seed." };
  }
  return validateRunState(cloneJson(state), cardDefinitionsById);
}

export function validateRunState(
  state: unknown,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition> = getActiveCardDefinitionsById()
): SaveLoadResult<RunState> {
  if (!isRecord(state)) {
    return { ok: false, error: "RunState must be an object." };
  }

  const requiredResult = requireFields(state, [
    "runId",
    "seed",
    "status",
    "currentNodeIndex",
    "level",
    "exp",
    "expToNextLevel",
    "gold",
    "currentHp",
    "maxHp",
    "ownedCards",
    "ownedSkills",
    "formationSlots",
    "formationSlotCount",
    "chestCapacity",
    "currentNode",
    "currentChoices",
    "pendingRewardChoices",
    "pendingLevelUpChoices",
    "shopStates",
    "completedEncounterCount",
    "defeatedBattleCount",
    "classId",
    "defeatedMonsters",
    "completedNodes"
  ]);
  if (!requiredResult.ok) {
    return requiredResult;
  }

  if (!isNonEmptyString(state["runId"])) return failMissing("runId");
  if (!isNonEmptyString(state["seed"])) return failMissing("seed");
  if (!isNonEmptyString(state["classId"])) return failMissing("classId");
  if (!isOneOf(state["status"], RUN_STATUSES)) {
    return { ok: false, error: `Invalid run status: ${String(state["status"])}.` };
  }
  for (const field of ["currentNodeIndex", "level", "exp", "expToNextLevel", "gold", "currentHp", "maxHp", "formationSlotCount", "chestCapacity", "completedEncounterCount", "defeatedBattleCount"]) {
    if (!isNumber(state[field])) {
      return { ok: false, error: `RunState field ${field} must be a number.` };
    }
  }
  const numericDomainResult = validateNumericDomains(state);
  if (!numericDomainResult.ok) return numericDomainResult;

  const nodeResult = validateRunNode(state["currentNode"], "currentNode");
  if (!nodeResult.ok) return nodeResult;

  const interruptedNode = state["interruptedNode"];
  if (interruptedNode !== undefined) {
    const interruptedNodeResult = validateRunNode(interruptedNode, "interruptedNode");
    if (!interruptedNodeResult.ok) return interruptedNodeResult;
  }

  if (state["interruptedNodeIndex"] !== undefined && !isNumber(state["interruptedNodeIndex"])) {
    return { ok: false, error: "RunState field interruptedNodeIndex must be a number." };
  }
  if (state["advanceAfterLevelUp"] !== undefined && typeof state["advanceAfterLevelUp"] !== "boolean") {
    return { ok: false, error: "RunState field advanceAfterLevelUp must be a boolean." };
  }

  const ownedCardsResult = validateCardInstances(state["ownedCards"], cardDefinitionsById, "ownedCards");
  if (!ownedCardsResult.ok) return ownedCardsResult;
  const ownedCards = ownedCardsResult.value;
  if (ownedCards.length > (state["chestCapacity"] as number)) {
    return { ok: false, error: "ownedCards exceeds chestCapacity." };
  }
  const ownedCardIds = new Set(ownedCards.map((card) => card.instanceId));

  const skillsResult = validateSkillInstances(state["ownedSkills"]);
  if (!skillsResult.ok) return skillsResult;

  const formationResult = validateRunFormationSlots({
    slots: state["formationSlots"],
    ownedCards,
    cardDefinitionsById,
    formationSlotCount: state["formationSlotCount"]
  });
  if (!formationResult.ok) return formationResult;

  for (const field of ["defeatedMonsters", "completedNodes"]) {
    if (!isStringArray(state[field])) {
      return { ok: false, error: `RunState field ${field} must be a string array.` };
    }
  }

  const shopStatesResult = validateShopStates(state["shopStates"], cardDefinitionsById);
  if (!shopStatesResult.ok) return shopStatesResult;

  const currentChoicesResult = validateChoices(state["currentChoices"], cardDefinitionsById, ownedCardIds, "currentChoices");
  if (!currentChoicesResult.ok) return currentChoicesResult;

  const pendingRewardChoicesResult = validateRewardChoices(state["pendingRewardChoices"], cardDefinitionsById, ownedCardIds, "pendingRewardChoices");
  if (!pendingRewardChoicesResult.ok) return pendingRewardChoicesResult;

  const pendingLevelUpChoicesResult = validateLevelUpChoices(state["pendingLevelUpChoices"], cardDefinitionsById, ownedCardIds, "pendingLevelUpChoices");
  if (!pendingLevelUpChoicesResult.ok) return pendingLevelUpChoicesResult;

  if (nodeResult.value.type === "SHOP" && !shopStatesResult.value.some((shopState) => shopState.nodeId === nodeResult.value.id)) {
    return { ok: false, error: "Current shop node is missing serialized shop state." };
  }
  if (nodeResult.value.type === "LEVEL_UP_REWARD" && pendingLevelUpChoicesResult.value.length === 0) {
    return { ok: false, error: "Current level-up node is missing pendingLevelUpChoices." };
  }

  const enemyCardInstancesResult = state["currentEnemyCardInstances"] === undefined
    ? { ok: true as const, value: undefined }
    : validateCardInstances(state["currentEnemyCardInstances"], cardDefinitionsById, "currentEnemyCardInstances");
  if (!enemyCardInstancesResult.ok) return enemyCardInstancesResult;

  const enemySnapshot = state["currentEnemySnapshot"];
  if (nodeResult.value.type === "BATTLE" && !isRecord(enemySnapshot)) {
    return { ok: false, error: "Battle node save is missing currentEnemySnapshot." };
  }
  if (enemySnapshot !== undefined) {
    if (!enemyCardInstancesResult.value) {
      return { ok: false, error: "Enemy FormationSnapshot requires currentEnemyCardInstances." };
    }
    const enemyCardIds = new Set(enemyCardInstancesResult.value.map((card) => card.instanceId));
    for (const slot of (enemySnapshot as FormationSnapshot).slots ?? []) {
      if (slot.cardInstanceId && !enemyCardIds.has(slot.cardInstanceId)) {
        return { ok: false, error: `Invalid enemy FormationSnapshot: slot references missing card ${slot.cardInstanceId}.` };
      }
    }
    const enemyValidation = validateFormationSnapshot(enemySnapshot as FormationSnapshot, {
      cardDefinitionsById,
      cardInstancesById: new Map(enemyCardInstancesResult.value.map((card) => [card.instanceId, card]))
    });
    if (!enemyValidation.valid) {
      return { ok: false, error: `Invalid enemy FormationSnapshot: ${enemyValidation.errors[0]?.message ?? "Unknown error."}` };
    }
  }

  const rewardSource = state["pendingRewardSource"];
  if (rewardSource !== undefined) {
    const rewardSourceResult = validatePendingRewardSource(rewardSource);
    if (!rewardSourceResult.ok) return rewardSourceResult;
  }

  for (const field of ["pendingCombatResult", "pendingBattleResult"]) {
    if (state[field] !== undefined) {
      const combatResult = validateCombatResult(state[field], field);
      if (!combatResult.ok) return combatResult;
    }
  }

  return { ok: true, value: state as unknown as RunState };
}

function validateRunNode(node: unknown, path: string): SaveLoadResult<RunNode> {
  if (!isRecord(node)) return { ok: false, error: `${path} must be an object.` };
  if (!isNonEmptyString(node["id"])) return { ok: false, error: `${path}.id is required.` };
  if (!isOneOf(node["type"], RUN_NODE_TYPES)) {
    return { ok: false, error: `Unknown current node type: ${String(node["type"])}.` };
  }
  if (!isNumber(node["day"])) return { ok: false, error: `${path}.day must be a number.` };
  if (!isNonEmptyString(node["label"])) return { ok: false, error: `${path}.label is required.` };
  if (node["battleDifficulty"] !== undefined && !isOneOf(node["battleDifficulty"], BATTLE_DIFFICULTIES)) {
    return { ok: false, error: `${path}.battleDifficulty is invalid.` };
  }
  if (node["monsterTemplateId"] !== undefined && typeof node["monsterTemplateId"] !== "string") {
    return { ok: false, error: `${path}.monsterTemplateId must be a string.` };
  }
  return { ok: true, value: node as unknown as RunNode };
}

function validateCardInstances(
  cards: unknown,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>,
  path: string
): SaveLoadResult<readonly CardInstance[]> {
  if (!Array.isArray(cards)) return { ok: false, error: `${path} must be an array.` };
  const seen = new Set<string>();
  for (const [index, card] of cards.entries()) {
    if (!isRecord(card)) return { ok: false, error: `${path}[${index}] must be an object.` };
    if (!isNonEmptyString(card["instanceId"])) return { ok: false, error: `${path}[${index}].instanceId is required.` };
    if (seen.has(card["instanceId"])) return { ok: false, error: `Duplicate card instance id: ${card["instanceId"]}.` };
    seen.add(card["instanceId"]);
    if (!isNonEmptyString(card["definitionId"]) || !cardDefinitionsById.has(card["definitionId"])) {
      return { ok: false, error: `Invalid card instance reference: ${String(card["definitionId"])}.` };
    }
    if (card["tierOverride"] !== undefined && !isOneOf(card["tierOverride"], CARD_TIERS)) {
      return { ok: false, error: `${path}[${index}].tierOverride is invalid.` };
    }
  }
  return { ok: true, value: cards as readonly CardInstance[] };
}

function validateSkillInstances(skills: unknown): SaveLoadResult<RunState["ownedSkills"]> {
  if (!Array.isArray(skills)) return { ok: false, error: "ownedSkills must be an array." };
  const skillDefinitionsById = getSkillDefinitionsById();
  const seen = new Set<string>();
  for (const [index, skill] of skills.entries()) {
    if (!isRecord(skill)) return { ok: false, error: `ownedSkills[${index}] must be an object.` };
    if (!isNonEmptyString(skill["instanceId"])) return { ok: false, error: `ownedSkills[${index}].instanceId is required.` };
    if (seen.has(skill["instanceId"])) return { ok: false, error: `Duplicate skill instance id: ${skill["instanceId"]}.` };
    seen.add(skill["instanceId"]);
    if (!isNonEmptyString(skill["definitionId"]) || !skillDefinitionsById.has(skill["definitionId"])) {
      return { ok: false, error: `Invalid skill definition reference: ${String(skill["definitionId"])}.` };
    }
  }
  return { ok: true, value: skills as RunState["ownedSkills"] };
}

function validateNumericDomains(state: Readonly<Record<string, unknown>>): SaveLoadResult<true> {
  const checks = [
    { field: "currentNodeIndex", valid: isNonNegativeInteger(state["currentNodeIndex"]), rule: "must be >= 0" },
    { field: "level", valid: isPositiveInteger(state["level"]), rule: "must be >= 1" },
    { field: "exp", valid: isNonNegativeInteger(state["exp"]), rule: "must be >= 0" },
    { field: "expToNextLevel", valid: isPositiveInteger(state["expToNextLevel"]), rule: "must be > 0" },
    { field: "gold", valid: isNonNegativeInteger(state["gold"]), rule: "must be >= 0" },
    { field: "maxHp", valid: isPositiveInteger(state["maxHp"]), rule: "must be > 0" },
    { field: "currentHp", valid: isNonNegativeInteger(state["currentHp"]), rule: "must be >= 0" },
    { field: "formationSlotCount", valid: isPositiveInteger(state["formationSlotCount"]), rule: "must be > 0" },
    { field: "chestCapacity", valid: isNonNegativeInteger(state["chestCapacity"]), rule: "must be >= 0" },
    { field: "completedEncounterCount", valid: isNonNegativeInteger(state["completedEncounterCount"]), rule: "must be >= 0" },
    { field: "defeatedBattleCount", valid: isNonNegativeInteger(state["defeatedBattleCount"]), rule: "must be >= 0" }
  ] as const;
  for (const check of checks) {
    if (!check.valid) {
      return { ok: false, error: `RunState field ${check.field} ${check.rule}.` };
    }
  }
  if ((state["currentHp"] as number) > (state["maxHp"] as number)) {
    return { ok: false, error: "RunState field currentHp must be <= maxHp." };
  }
  if ((state["chestCapacity"] as number) !== FIXED_CHEST_CAPACITY) {
    return { ok: false, error: `RunState field chestCapacity must be ${FIXED_CHEST_CAPACITY}.` };
  }
  return { ok: true, value: true };
}

function validateRunFormationSlots(input: {
  readonly slots: unknown;
  readonly ownedCards: readonly CardInstance[];
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly formationSlotCount: unknown;
}): SaveLoadResult<readonly RunFormationSlot[]> {
  const { slots, ownedCards, cardDefinitionsById, formationSlotCount } = input;
  if (!Array.isArray(slots)) return { ok: false, error: "formationSlots must be an array." };
  if (!isPositiveInteger(formationSlotCount)) {
    return { ok: false, error: "RunState field formationSlotCount must be > 0." };
  }
  if (slots.length !== formationSlotCount) {
    return { ok: false, error: "Formation slot count does not match formationSlots length." };
  }
  const ownedCardsById = new Map(ownedCards.map((card) => [card.instanceId, card]));
  const ownedCardIds = new Set(ownedCardsById.keys());
  const seenSlotIndexes = new Set<number>();
  const placedCards = new Set<string>();
  for (const [index, slot] of slots.entries()) {
    if (!isRecord(slot)) return { ok: false, error: `formationSlots[${index}] must be an object.` };
    if (!isPositiveInteger(slot["slotIndex"])) return { ok: false, error: `formationSlots[${index}].slotIndex must be a positive integer.` };
    if (slot["slotIndex"] < 1 || slot["slotIndex"] > formationSlotCount) {
      return { ok: false, error: `Formation slot index ${slot["slotIndex"]} is outside formationSlotCount.` };
    }
    if (seenSlotIndexes.has(slot["slotIndex"])) return { ok: false, error: `Formation slot ${slot["slotIndex"]} is duplicated.` };
    seenSlotIndexes.add(slot["slotIndex"]);
    if (slot["cardInstanceId"] !== undefined && slot["lockedByInstanceId"] !== undefined) {
      return { ok: false, error: `Formation slot ${slot["slotIndex"]} cannot contain a card and be locked.` };
    }
    for (const field of ["cardInstanceId", "lockedByInstanceId"]) {
      if (slot[field] !== undefined) {
        if (!isNonEmptyString(slot[field]) || !ownedCardIds.has(slot[field])) {
          return { ok: false, error: `Invalid formation slot/card reference: ${String(slot[field])}.` };
        }
      }
    }
    const cardInstanceId = slot["cardInstanceId"];
    if (typeof cardInstanceId === "string") {
      if (placedCards.has(cardInstanceId)) {
        return { ok: false, error: `Formation references card ${cardInstanceId} multiple times.` };
      }
      placedCards.add(cardInstanceId);
    }
  }
  for (let slotIndex = 1; slotIndex <= formationSlotCount; slotIndex += 1) {
    if (!seenSlotIndexes.has(slotIndex)) {
      return { ok: false, error: `Formation slots must contain exact indexes 1..${formationSlotCount}.` };
    }
  }
  const slotsByIndex = new Map(slots.map((slot) => [(slot as RunFormationSlot).slotIndex, slot as RunFormationSlot]));
  for (const slot of slots as readonly RunFormationSlot[]) {
    if (slot.cardInstanceId) {
      const card = ownedCardsById.get(slot.cardInstanceId);
      const definition = card ? cardDefinitionsById.get(card.definitionId) : undefined;
      if (!definition) {
        return { ok: false, error: `Formation slot ${slot.slotIndex} references a card without a definition.` };
      }
      const nextSlot = slotsByIndex.get(slot.slotIndex + 1);
      if (definition.size === 2) {
        if (!nextSlot || nextSlot.lockedByInstanceId !== slot.cardInstanceId || nextSlot.cardInstanceId !== undefined) {
          return { ok: false, error: `Size 2 card ${slot.cardInstanceId} is missing its adjacent locked footprint.` };
        }
      } else if (nextSlot?.lockedByInstanceId === slot.cardInstanceId) {
        return { ok: false, error: `Size 1 card ${slot.cardInstanceId} must not lock adjacent slots.` };
      }
    }
    if (slot.lockedByInstanceId) {
      const previousSlot = slotsByIndex.get(slot.slotIndex - 1);
      if (previousSlot?.cardInstanceId !== slot.lockedByInstanceId) {
        return { ok: false, error: `Locked slot ${slot.slotIndex} must be immediately after its size 2 owner.` };
      }
      const ownerCard = ownedCardsById.get(slot.lockedByInstanceId);
      const ownerDefinition = ownerCard ? cardDefinitionsById.get(ownerCard.definitionId) : undefined;
      if (ownerDefinition?.size !== 2) {
        return { ok: false, error: `Locked slot ${slot.slotIndex} must point to a size 2 card.` };
      }
    }
  }
  return { ok: true, value: slots as readonly RunFormationSlot[] };
}

function validateShopStates(
  shopStates: unknown,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): SaveLoadResult<readonly RunShopState[]> {
  if (!Array.isArray(shopStates)) return { ok: false, error: "shopStates must be an array." };
  for (const [index, shopState] of shopStates.entries()) {
    if (!isRecord(shopState)) return { ok: false, error: `shopStates[${index}] must be an object.` };
    if (!isNonEmptyString(shopState["nodeId"])) return { ok: false, error: `shopStates[${index}].nodeId is required.` };
    if (!Array.isArray(shopState["choices"])) return { ok: false, error: `shopStates[${index}].choices must be an array.` };
    const choices = validateShopChoices(shopState["choices"], cardDefinitionsById, `shopStates[${index}].choices`);
    if (!choices.ok) return choices;
    if (!isStringArray(shopState["purchasedOptionIds"])) {
      return { ok: false, error: `shopStates[${index}].purchasedOptionIds must be a string array.` };
    }
    if (typeof shopState["expGranted"] !== "boolean") {
      return { ok: false, error: `shopStates[${index}].expGranted must be a boolean.` };
    }
  }
  return { ok: true, value: shopStates as readonly RunShopState[] };
}

function validateChoices(
  choices: unknown,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>,
  ownedCardIds: ReadonlySet<string>,
  path: string
): SaveLoadResult<readonly RunChoice[]> {
  if (!Array.isArray(choices)) return { ok: false, error: `${path} must be an array.` };
  for (const [index, choice] of choices.entries()) {
    const result = validateChoice(choice, cardDefinitionsById, ownedCardIds, `${path}[${index}]`);
    if (!result.ok) return result;
  }
  return { ok: true, value: choices as readonly RunChoice[] };
}

function validateShopChoices(choices: unknown, cardDefinitionsById: ReadonlyMap<string, CardDefinition>, path: string) {
  if (!Array.isArray(choices)) return { ok: false as const, error: `${path} must be an array.` };
  for (const [index, choice] of choices.entries()) {
    const result = validateShopChoice(choice, cardDefinitionsById, `${path}[${index}]`);
    if (!result.ok) return result;
  }
  return { ok: true as const, value: choices as readonly ShopChoice[] };
}

function validateChoice(
  choice: unknown,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>,
  ownedCardIds: ReadonlySet<string>,
  path: string
): SaveLoadResult<RunChoice> {
  if (!isRecord(choice)) return { ok: false, error: `${path} must be an object.` };
  if (choice["type"] === "SHOP_CARD") return validateShopChoice(choice, cardDefinitionsById, path);
  if (String(choice["type"]).startsWith("EVENT")) return validateEventChoice(choice, cardDefinitionsById, path);
  if (String(choice["type"]).startsWith("REWARD")) return validateRewardChoice(choice, cardDefinitionsById, ownedCardIds, path);
  if (String(choice["type"]).startsWith("LEVEL")) return validateLevelUpChoice(choice, cardDefinitionsById, ownedCardIds, path);
  return { ok: false, error: `${path}.type is invalid.` };
}

function validateShopChoice(
  choice: unknown,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>,
  path: string
): SaveLoadResult<ShopChoice> {
  if (!isRecord(choice)) return { ok: false, error: `${path} must be an object.` };
  if (!isNonEmptyString(choice["id"])) return { ok: false, error: `${path}.id is required.` };
  if (choice["type"] !== "SHOP_CARD") return { ok: false, error: `${path}.type must be SHOP_CARD.` };
  if (!isKnownCardDefinition(choice["cardDefinitionId"], cardDefinitionsById)) return { ok: false, error: `${path}.cardDefinitionId is invalid.` };
  if (!isNumber(choice["cost"])) return { ok: false, error: `${path}.cost must be a number.` };
  if (choice["purchased"] !== undefined && typeof choice["purchased"] !== "boolean") {
    return { ok: false, error: `${path}.purchased must be a boolean.` };
  }
  return { ok: true, value: choice as unknown as ShopChoice };
}

function validateEventChoice(
  choice: Readonly<Record<string, unknown>>,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>,
  path: string
): SaveLoadResult<EventChoice> {
  if (!isNonEmptyString(choice["id"])) return { ok: false, error: `${path}.id is required.` };
  if (!["EVENT_CARD", "EVENT_GOLD", "EVENT_HEAL"].includes(String(choice["type"]))) return { ok: false, error: `${path}.type is invalid.` };
  if (!isNonEmptyString(choice["label"])) return { ok: false, error: `${path}.label is required.` };
  if (choice["type"] === "EVENT_CARD" && !isKnownCardDefinition(choice["cardDefinitionId"], cardDefinitionsById)) {
    return { ok: false, error: `${path}.cardDefinitionId is invalid.` };
  }
  if (choice["gold"] !== undefined && !isNumber(choice["gold"])) return { ok: false, error: `${path}.gold must be a number.` };
  if (choice["heal"] !== undefined && !isNumber(choice["heal"])) return { ok: false, error: `${path}.heal must be a number.` };
  return { ok: true, value: choice as unknown as EventChoice };
}

function validateRewardChoices(
  choices: unknown,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>,
  ownedCardIds: ReadonlySet<string>,
  path: string
): SaveLoadResult<readonly RewardChoice[]> {
  if (!Array.isArray(choices)) return { ok: false, error: `${path} must be an array.` };
  for (const [index, choice] of choices.entries()) {
    const result = validateRewardChoice(choice, cardDefinitionsById, ownedCardIds, `${path}[${index}]`);
    if (!result.ok) return result;
  }
  return { ok: true, value: choices as readonly RewardChoice[] };
}

function validateRewardChoice(
  choice: unknown,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>,
  ownedCardIds: ReadonlySet<string>,
  path: string
): SaveLoadResult<RewardChoice> {
  if (!isRecord(choice)) return { ok: false, error: `${path} must be an object.` };
  if (!isNonEmptyString(choice["id"])) return { ok: false, error: `${path}.id is required.` };
  if (!["REWARD_CARD", "REWARD_GOLD", "REWARD_UPGRADE", "REWARD_SKILL"].includes(String(choice["type"]))) return { ok: false, error: `${path}.type is invalid.` };
  if (!isNonEmptyString(choice["label"])) return { ok: false, error: `${path}.label is required.` };
  return validateChoicePayload(choice, cardDefinitionsById, ownedCardIds, path) as SaveLoadResult<RewardChoice>;
}

function validateLevelUpChoices(
  choices: unknown,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>,
  ownedCardIds: ReadonlySet<string>,
  path: string
): SaveLoadResult<readonly LevelUpRewardChoice[]> {
  if (!Array.isArray(choices)) return { ok: false, error: `${path} must be an array.` };
  for (const [index, choice] of choices.entries()) {
    const result = validateLevelUpChoice(choice, cardDefinitionsById, ownedCardIds, `${path}[${index}]`);
    if (!result.ok) return result;
  }
  return { ok: true, value: choices as readonly LevelUpRewardChoice[] };
}

function validateLevelUpChoice(
  choice: unknown,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>,
  ownedCardIds: ReadonlySet<string>,
  path: string
): SaveLoadResult<LevelUpRewardChoice> {
  if (!isRecord(choice)) return { ok: false, error: `${path} must be an object.` };
  if (!isNonEmptyString(choice["id"])) return { ok: false, error: `${path}.id is required.` };
  if (!["LEVEL_GOLD", "LEVEL_CARD", "LEVEL_UPGRADE", "LEVEL_SKILL"].includes(String(choice["type"]))) return { ok: false, error: `${path}.type is invalid.` };
  if (!isNonEmptyString(choice["label"])) return { ok: false, error: `${path}.label is required.` };
  return validateChoicePayload(choice, cardDefinitionsById, ownedCardIds, path) as SaveLoadResult<LevelUpRewardChoice>;
}

function validateChoicePayload(
  choice: Readonly<Record<string, unknown>>,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>,
  ownedCardIds: ReadonlySet<string>,
  path: string
): SaveLoadResult<unknown> {
  if (String(choice["type"]).endsWith("_CARD") && !isKnownCardDefinition(choice["cardDefinitionId"], cardDefinitionsById)) {
    return { ok: false, error: `${path}.cardDefinitionId is invalid.` };
  }
  if (String(choice["type"]).endsWith("_GOLD") && !isNumber(choice["gold"])) {
    return { ok: false, error: `${path}.gold must be a number.` };
  }
  if (String(choice["type"]).endsWith("_UPGRADE")) {
    if (!isNonEmptyString(choice["cardInstanceId"]) || !ownedCardIds.has(choice["cardInstanceId"])) {
      return { ok: false, error: `${path}.cardInstanceId references an unowned card.` };
    }
    if (choice["fromTier"] !== undefined && !isOneOf(choice["fromTier"], CARD_TIERS)) return { ok: false, error: `${path}.fromTier is invalid.` };
    if (choice["toTier"] !== undefined && !isOneOf(choice["toTier"], CARD_TIERS)) return { ok: false, error: `${path}.toTier is invalid.` };
    if (choice["preview"] !== undefined && typeof choice["preview"] !== "string") return { ok: false, error: `${path}.preview must be a string.` };
  }
  if (String(choice["type"]).endsWith("_SKILL")) {
    if (!isNonEmptyString(choice["skillDefinitionId"]) || !getSkillDefinitionsById().has(choice["skillDefinitionId"])) {
      return { ok: false, error: `${path}.skillDefinitionId is invalid.` };
    }
  }
  return { ok: true, value: choice };
}

function validatePendingRewardSource(source: unknown): SaveLoadResult<RunState["pendingRewardSource"]> {
  if (!isRecord(source)) return { ok: false, error: "pendingRewardSource must be an object." };
  if (source["defeatedMonsterId"] !== undefined && typeof source["defeatedMonsterId"] !== "string") {
    return { ok: false, error: "pendingRewardSource.defeatedMonsterId must be a string." };
  }
  if (source["defeatedMonsterName"] !== undefined && typeof source["defeatedMonsterName"] !== "string") {
    return { ok: false, error: "pendingRewardSource.defeatedMonsterName must be a string." };
  }
  if (!isStringArray(source["usedCardDefinitionIds"])) {
    return { ok: false, error: "pendingRewardSource.usedCardDefinitionIds must be a string array." };
  }
  return { ok: true, value: source as unknown as RunState["pendingRewardSource"] };
}

function validateCombatResult(result: unknown, path: string): SaveLoadResult<CombatResult> {
  if (!isRecord(result)) return { ok: false, error: `${path} must be an object.` };
  if (!isOneOf(result["winner"], COMBAT_WINNERS)) return { ok: false, error: `${path}.winner is invalid.` };
  for (const field of ["ticksElapsed", "playerFinalHp", "enemyFinalHp"]) {
    if (!isNumber(result[field])) return { ok: false, error: `${path}.${field} must be a number.` };
  }
  if (!Array.isArray(result["combatLog"]) || !result["combatLog"].every((entry) => typeof entry === "string")) {
    return { ok: false, error: `${path}.combatLog must be a string array.` };
  }
  if (!isRecord(result["replayTimeline"]) || !Array.isArray(result["replayTimeline"]["events"])) {
    return { ok: false, error: `${path}.replayTimeline.events must be an array.` };
  }
  if (!isRecord(result["summary"])) {
    return { ok: false, error: `${path}.summary must be an object.` };
  }
  return { ok: true, value: result as unknown as CombatResult };
}

function requireFields(record: Readonly<Record<string, unknown>>, fields: readonly string[]): SaveLoadResult<true> {
  for (const field of fields) {
    if (!(field in record)) {
      return { ok: false, error: `RunState is missing required field: ${field}.` };
    }
  }
  return { ok: true, value: true };
}

function isKnownCardDefinition(value: unknown, cardDefinitionsById: ReadonlyMap<string, CardDefinition>): value is string {
  return typeof value === "string" && cardDefinitionsById.has(value);
}

function failMissing(field: string): SaveLoadResult<never> {
  return { ok: false, error: `RunState field ${field} is required.` };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value > 0;
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isOneOf<T extends readonly unknown[]>(value: unknown, choices: T): value is T[number] {
  return choices.includes(value);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
