export type CombatWinner = "PLAYER" | "ENEMY" | "DRAW";

export type ReplayEventType =
  | "CombatStarted"
  | "CardActivated"
  | "DamageDealt"
  | "ArmorGained"
  | "ArmorBlocked"
  | "StatusApplied"
  | "StatusTicked"
  | "CooldownModified"
  | "TriggerFired"
  | "CombatEnded"
  | "StatusExpired"
  | "StackLimitReached";

export interface ReplayEvent {
  readonly tick: number;
  readonly type: ReplayEventType;
  readonly sourceId?: string;
  readonly targetId?: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}

export interface ReplayTimeline {
  readonly events: readonly ReplayEvent[];
}

export interface CombatResultSummary {
  readonly winner: CombatWinner;
  readonly ticksElapsed: number;
  readonly playerFinalHp: number;
  readonly enemyFinalHp: number;
  readonly damageByCard: Readonly<Record<string, number>>;
  readonly statusDamage: Readonly<Record<string, number>>;
  readonly armorGainedByCard: Readonly<Record<string, number>>;
  readonly armorBlocked: number;
  readonly activationsByCard: Readonly<Record<string, number>>;
  readonly triggerCountByCard: Readonly<Record<string, number>>;
  readonly topContributors: readonly CombatContribution[];
}

export interface CombatContribution {
  readonly sourceId: string;
  readonly score: number;
  readonly damage: number;
  readonly armorGained: number;
  readonly triggerCount: number;
}

export interface CombatResult {
  readonly winner: CombatWinner;
  readonly ticksElapsed: number;
  readonly playerFinalHp: number;
  readonly enemyFinalHp: number;
  readonly combatLog: readonly string[];
  readonly replayTimeline: ReplayTimeline;
  readonly summary: CombatResultSummary;
}
