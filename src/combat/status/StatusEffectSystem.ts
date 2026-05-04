import type { ReplayEvent } from "../../model/result.js";
import { applyDamage } from "../DamageCalculator.js";
import type { CombatLog } from "../CombatLog.js";
import type { RuntimeCombatant } from "../types.js";
import type { TriggerSystem } from "../triggers/TriggerSystem.js";
import type { ModifierSystem } from "../modifiers/ModifierSystem.js";
import type { StatusDamageSourceContribution, StatusSourceContribution } from "./StatusEffect.js";

export interface StatusEffectSystemInput {
  readonly tick: number;
  readonly combatants: readonly RuntimeCombatant[];
  readonly combatLog: CombatLog;
  readonly replayEvents: ReplayEvent[];
  readonly triggerSystem?: TriggerSystem;
  readonly modifierSystem?: ModifierSystem;
}

export function updateStatusEffects(input: StatusEffectSystemInput): void {
  for (const combatant of input.combatants) {
    const remainingStatuses = [];

    for (const status of combatant.statuses) {
      if (status.kind === "BURN" && input.tick >= status.nextTickAt && input.tick <= status.expiresAtTick) {
        const statusSourceContributions = allocateStatusDamageBySource(
          status.sourceContributions ?? [],
          status.amount,
          Math.min(combatant.hp, status.amount)
        );
        // MVP rule: Burn is Fire DOT and ignores Armor so DOT keeps a clear tactical role.
        // Burn attribution is reported for replay/summary only; source-owned damage modifiers still do not modify Burn ticks.
        applyDamage({
          tick: input.tick,
          sourceName: "Burn",
          target: combatant,
          amount: status.amount,
          damageType: "FIRE",
          combatants: input.combatants,
          modifierSystem: input.modifierSystem,
          ignoresArmor: true,
          command: "BurnTick",
          statusSourceContributions,
          combatLog: input.combatLog,
          replayEvents: input.replayEvents
        });
        input.replayEvents.push({
          tick: input.tick,
          type: "StatusTicked",
          targetId: combatant.formation.id,
          payload: {
            status: "Burn",
            amount: status.amount,
            sourceContributions: statusSourceContributions,
            expiresAtTick: status.expiresAtTick
          }
        });
        input.triggerSystem?.fire({
          hook: "OnBurnTick",
          tick: input.tick,
          targetCombatant: combatant,
          status: "Burn",
          triggerDepth: 0
        });
        status.nextTickAt += status.tickIntervalTicks;
      }

      if (input.tick < status.expiresAtTick) {
        remainingStatuses.push(status);
      } else {
        input.replayEvents.push({
          tick: input.tick,
          type: "StatusExpired",
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

function allocateStatusDamageBySource(
  contributions: readonly StatusSourceContribution[],
  totalStatusAmount: number,
  hpDamage: number
): readonly StatusDamageSourceContribution[] {
  const eligibleContributions = contributions.filter((contribution) => contribution.amount > 0);
  if (eligibleContributions.length === 0 || totalStatusAmount <= 0 || hpDamage <= 0) {
    return [];
  }

  let allocated = 0;
  const allocation = eligibleContributions.map((contribution) => {
    const exactShare = (hpDamage * contribution.amount) / totalStatusAmount;
    const amount = Math.floor(exactShare);
    allocated += amount;
    return {
      contribution,
      amount,
      remainder: exactShare - amount
    };
  });

  let remaining = hpDamage - allocated;
  allocation.sort((left, right) =>
    right.remainder - left.remainder ||
    left.contribution.sourceCombatantId.localeCompare(right.contribution.sourceCombatantId) ||
    (left.contribution.sourceCardInstanceId ?? "").localeCompare(right.contribution.sourceCardInstanceId ?? "") ||
    (left.contribution.sourceCardDefinitionId ?? "").localeCompare(right.contribution.sourceCardDefinitionId ?? "")
  );

  for (const entry of allocation) {
    if (remaining <= 0) {
      break;
    }
    entry.amount += 1;
    remaining -= 1;
  }

  return allocation
    .filter((entry) => entry.amount > 0)
    .sort((left, right) =>
      left.contribution.sourceCombatantId.localeCompare(right.contribution.sourceCombatantId) ||
      (left.contribution.sourceCardInstanceId ?? "").localeCompare(right.contribution.sourceCardInstanceId ?? "") ||
      (left.contribution.sourceCardDefinitionId ?? "").localeCompare(right.contribution.sourceCardDefinitionId ?? "")
    )
    .map((entry) => ({
      sourceCombatantId: entry.contribution.sourceCombatantId,
      ...(entry.contribution.sourceCardInstanceId ? { sourceCardInstanceId: entry.contribution.sourceCardInstanceId } : {}),
      ...(entry.contribution.sourceCardDefinitionId ? { sourceCardDefinitionId: entry.contribution.sourceCardDefinitionId } : {}),
      amount: entry.amount
    }));
}
