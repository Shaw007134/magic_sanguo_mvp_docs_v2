import type { CardInstance } from "../model/card.js";
import type { FormationSnapshot } from "../model/formation.js";
import type { CombatResult } from "../model/result.js";

export type RunStatus = "IN_PROGRESS" | "VICTORY" | "DEFEAT";
export type RunNodeType = "SHOP" | "EVENT" | "BATTLE" | "REWARD" | "RUN_RESULT";
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
}

export interface EventChoice {
  readonly id: string;
  readonly type: "EVENT_CARD" | "EVENT_GOLD";
  readonly label: string;
  readonly cardDefinitionId?: string;
  readonly gold?: number;
}

export interface RewardChoice {
  readonly id: string;
  readonly type: "REWARD_CARD";
  readonly cardDefinitionId: string;
}

export type RunChoice = ShopChoice | EventChoice | RewardChoice;

export interface RunState {
  readonly runId: string;
  readonly seed: string;
  readonly status: RunStatus;
  readonly currentNodeIndex: number;
  readonly gold: number;
  readonly ownedCards: readonly CardInstance[];
  readonly formationSlots: readonly RunFormationSlot[];
  readonly formationSlotCount: number;
  readonly chestCapacity: number;
  readonly currentNode: RunNode;
  readonly currentChoices: readonly RunChoice[];
  readonly currentEnemySnapshot?: FormationSnapshot;
  readonly currentEnemyCardInstances?: readonly CardInstance[];
  readonly pendingBattleResult?: CombatResult;
  readonly classId: string;
  readonly defeatedMonsters: readonly string[];
  readonly completedNodes: readonly string[];
}

export interface RunActionResult {
  readonly ok: boolean;
  readonly state: RunState;
  readonly error?: string;
}
