export type CombatWinner = "PLAYER" | "ENEMY" | "DRAW";

export interface ReplayEvent {
  readonly tick: number;
  readonly type: string;
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
