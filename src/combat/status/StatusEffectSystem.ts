import type { ReplayEvent } from "../../model/result.js";
import { applyDamage } from "../DamageCalculator.js";
import type { CombatLog } from "../CombatLog.js";
import type { RuntimeCombatant } from "../types.js";
import type { TriggerSystem } from "../triggers/TriggerSystem.js";

export interface StatusEffectSystemInput {
  readonly tick: number;
  readonly combatants: readonly RuntimeCombatant[];
  readonly combatLog: CombatLog;
  readonly replayEvents: ReplayEvent[];
  readonly triggerSystem?: TriggerSystem;
}

export function updateStatusEffects(input: StatusEffectSystemInput): void {
  for (const combatant of input.combatants) {
    const remainingStatuses = [];

    for (const status of combatant.statuses) {
      if (status.kind === "BURN" && input.tick >= status.nextTickAt && input.tick <= status.expiresAtTick) {
        // MVP rule: Burn is Fire DOT and ignores Armor so DOT keeps a clear tactical role.
        applyDamage({
          tick: input.tick,
          sourceName: "Burn",
          target: combatant,
          amount: status.amount,
          damageType: "FIRE",
          ignoresArmor: true,
          command: "BurnTick",
          combatLog: input.combatLog,
          replayEvents: input.replayEvents
        });
        input.replayEvents.push({
          tick: input.tick,
          type: "BURN_TICK",
          targetId: combatant.formation.id,
          payload: {
            amount: status.amount,
            expiresAtTick: status.expiresAtTick
          }
        });
        input.triggerSystem?.fire({
          hook: "OnBurnTick",
          tick: input.tick,
          targetCombatant: combatant,
          status: "Burn"
        });
        status.nextTickAt += status.tickIntervalTicks;
      }

      if (input.tick < status.expiresAtTick) {
        remainingStatuses.push(status);
      } else {
        input.replayEvents.push({
          tick: input.tick,
          type: "STATUS_EXPIRED",
          targetId: combatant.formation.id,
          payload: {
            kind: status.kind
          }
        });
      }
    }

    combatant.statuses = remainingStatuses;
  }
}
