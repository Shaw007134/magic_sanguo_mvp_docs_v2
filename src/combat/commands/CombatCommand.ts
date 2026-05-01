import type { CardDefinition, CardRuntimeState } from "../../model/card.js";
import type { ReplayEvent } from "../../model/result.js";
import type { CombatLog } from "../CombatLog.js";
import type { ResolutionStack } from "../ResolutionStack.js";
import type { RuntimeCombatant } from "../types.js";
import type { TriggerSystem } from "../triggers/TriggerSystem.js";
import type { ModifierSystem } from "../modifiers/ModifierSystem.js";

export interface CombatExecutionContext {
  readonly tick: number;
  readonly sourceCard?: CardRuntimeState;
  readonly sourceCardDefinition?: CardDefinition;
  readonly sourceCombatant: RuntimeCombatant;
  readonly targetCombatant: RuntimeCombatant;
  readonly combatLog: CombatLog;
  readonly replayEvents: ReplayEvent[];
  readonly resolutionStack: ResolutionStack;
  readonly triggerSystem?: TriggerSystem;
  readonly modifierSystem?: ModifierSystem;
  readonly combatants?: readonly RuntimeCombatant[];
  readonly triggerDepth: number;
}

export interface CombatCommand {
  readonly name: string;
  readonly triggerDepth?: number;
  execute(context: CombatExecutionContext): void;
}
