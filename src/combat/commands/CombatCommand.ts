import type { CardRuntimeState } from "../../model/card.js";
import type { ReplayEvent } from "../../model/result.js";
import type { CombatLog } from "../CombatLog.js";
import type { ResolutionStack } from "../ResolutionStack.js";
import type { RuntimeCombatant } from "../types.js";

export interface CombatExecutionContext {
  readonly tick: number;
  readonly sourceCard?: CardRuntimeState;
  readonly sourceCombatant: RuntimeCombatant;
  readonly targetCombatant: RuntimeCombatant;
  readonly combatLog: CombatLog;
  readonly replayEvents: ReplayEvent[];
  readonly resolutionStack: ResolutionStack;
  readonly triggerDepth: number;
}

export interface CombatCommand {
  readonly name: string;
  execute(context: CombatExecutionContext): void;
}
