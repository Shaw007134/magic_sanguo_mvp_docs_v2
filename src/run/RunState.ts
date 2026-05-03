import type { CardInstance, CardTier } from "../model/card.js";
import type { FormationSnapshot } from "../model/formation.js";
import type { CombatResult } from "../model/result.js";
import type { SkillInstance } from "./skills/Skill.js";

export type RunStatus = "IN_PROGRESS" | "VICTORY" | "DEFEAT";
export type RunNodeType = "SHOP" | "EVENT" | "BATTLE" | "REWARD" | "LEVEL_UP_REWARD" | "RUN_RESULT";
export type BattleDifficulty = "EASY" | "NORMAL" | "ELITE" | "BOSS";

export interface RunFormationSlot {
  readonly slotIndex: number;
  readonly cardInstanceId?: string;
  readonly lockedByInstanceId?: string;
}

export interface RunNode {
  readonly id: string;
  readonly type: RunNodeType;
  readonly day: number;
  readonly label: string;
  readonly battleDifficulty?: BattleDifficulty;
  readonly monsterTemplateId?: string;
}

export interface ShopChoice {
  readonly id: string;
  readonly type: "SHOP_CARD";
  readonly cardDefinitionId: string;
  readonly cost: number;
  readonly purchased?: boolean;
}

export interface EventChoice {
  readonly id: string;
  readonly type: "EVENT_CARD" | "EVENT_GOLD" | "EVENT_HEAL";
  readonly label: string;
  readonly cardDefinitionId?: string;
  readonly gold?: number;
  readonly heal?: number;
}

export interface RewardChoice {
  readonly id: string;
  readonly type: "REWARD_CARD" | "REWARD_GOLD" | "REWARD_UPGRADE" | "REWARD_SKILL";
  readonly label: string;
  readonly cardDefinitionId?: string;
  readonly gold?: number;
  readonly cardInstanceId?: string;
  readonly fromTier?: CardTier;
  readonly toTier?: CardTier;
  readonly skillDefinitionId?: string;
  readonly preview?: string;
}

export interface LevelUpRewardChoice {
  readonly id: string;
  readonly type: "LEVEL_GOLD" | "LEVEL_CARD" | "LEVEL_UPGRADE" | "LEVEL_SKILL";
  readonly label: string;
  readonly gold?: number;
  readonly cardDefinitionId?: string;
  readonly cardInstanceId?: string;
  readonly fromTier?: CardTier;
  readonly toTier?: CardTier;
  readonly skillDefinitionId?: string;
  readonly preview?: string;
}

export type RunChoice = ShopChoice | EventChoice | RewardChoice | LevelUpRewardChoice;

export interface RunShopState {
  readonly nodeId: string;
  readonly choices: readonly ShopChoice[];
  readonly purchasedOptionIds: readonly string[];
  readonly expGranted: boolean;
}

export interface PendingRewardSource {
  readonly defeatedMonsterId?: string;
  readonly defeatedMonsterName?: string;
  readonly usedCardDefinitionIds: readonly string[];
}

export interface RunState {
  readonly runId: string;
  readonly seed: string;
  readonly status: RunStatus;
  readonly currentNodeIndex: number;
  readonly level: number;
  readonly exp: number;
  readonly expToNextLevel: number;
  readonly gold: number;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly ownedCards: readonly CardInstance[];
  readonly ownedSkills: readonly SkillInstance[];
  readonly formationSlots: readonly RunFormationSlot[];
  readonly formationSlotCount: number;
  readonly chestCapacity: number;
  readonly currentNode: RunNode;
  readonly currentChoices: readonly RunChoice[];
  readonly currentEnemySnapshot?: FormationSnapshot;
  readonly currentEnemyCardInstances?: readonly CardInstance[];
  readonly pendingCombatResult?: CombatResult;
  readonly pendingBattleResult?: CombatResult;
  readonly pendingRewardChoices: readonly RewardChoice[];
  readonly pendingLevelUpChoices: readonly LevelUpRewardChoice[];
  readonly pendingRewardSource?: PendingRewardSource;
  readonly shopStates: readonly RunShopState[];
  readonly completedEncounterCount: number;
  readonly defeatedBattleCount: number;
  readonly classId: string;
  readonly defeatedMonsters: readonly string[];
  readonly completedNodes: readonly string[];
  readonly interruptedNodeIndex?: number;
  readonly interruptedNode?: RunNode;
  readonly advanceAfterLevelUp?: boolean;
}

export interface RunActionResult {
  readonly ok: boolean;
  readonly state: RunState;
  readonly error?: string;
  readonly message?: string;
}
