import type { ReplayEvent } from "../../model/result.js";
import { applyDamage } from "../DamageCalculator.js";
import type { CombatLog } from "../CombatLog.js";
import type { RuntimeCombatant } from "../types.js";
import type { TriggerSystem } from "../triggers/TriggerSystem.js";
import type { ModifierSystem } from "../modifiers/ModifierSystem.js";
import type { DamageType } from "../DamageCalculator.js";
import type { StatusDamageSourceContribution, StatusEffect, StatusName, StatusSourceContribution } from "./StatusEffect.js";
import type { CardDefinition } from "../../model/card.js";
import { decayBurnAfterTick } from "./Burn.js";

export interface StatusEffectSystemInput {
  readonly tick: number;
  readonly combatants: readonly RuntimeCombatant[];
  readonly combatLog: CombatLog;
  readonly replayEvents: ReplayEvent[];
  readonly triggerSystem?: TriggerSystem;
  readonly modifierSystem?: ModifierSystem;
  readonly cardDefinitionsById?: ReadonlyMap<string, CardDefinition>;
}

export function updateStatusEffects(input: StatusEffectSystemInput): void {
  for (const combatant of input.combatants) {
    const remainingStatuses = [];

    for (const status of combatant.statuses) {
      if (isTickReady(status, input.tick)) {
        tickStatus(status, combatant, input);
      }

      if (isStatusActive(status, input.tick)) {
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

function isTickReady(status: StatusEffect, tick: number): boolean {
  return tick >= status.nextTickAt && (status.expiresAtTick === undefined || tick <= status.expiresAtTick);
}

function isStatusActive(status: StatusEffect, tick: number): boolean {
  return status.amount > 0 && (status.expiresAtTick === undefined || tick < status.expiresAtTick);
}

function tickStatus(status: StatusEffect, combatant: RuntimeCombatant, input: StatusEffectSystemInput): void {
  const statusName = getStatusName(status);
  const statusSourceContributions = allocateStatusDamageBySource(
    status.sourceContributions ?? [],
    status.amount,
    Math.min(combatant.hp, status.amount)
  );
  // MVP rule: DOT statuses ignore Armor so they can pressure defensive/Armor-heavy enemies.
  // Attribution is reported for replay/summary only; source-owned damage modifiers still do not modify DOT ticks.
  const damageResult = applyDamage({
    tick: input.tick,
    sourceName: statusName,
    target: combatant,
    amount: status.amount,
    damageType: getStatusDamageType(status),
    combatants: input.combatants,
    modifierSystem: input.modifierSystem,
    ignoresArmor: true,
    command: `${statusName}Tick`,
    statusSourceContributions,
    combatLog: input.combatLog,
    replayEvents: input.replayEvents
  });
  input.replayEvents.push({
    tick: input.tick,
    type: "StatusTicked",
    targetId: combatant.formation.id,
    payload: {
      status: statusName,
      amount: status.amount,
      sourceContributions: statusSourceContributions,
      ...(status.expiresAtTick !== undefined ? { expiresAtTick: status.expiresAtTick } : {})
    }
  });
  const attributedSource = getSingleAttributedSource(statusSourceContributions, input);
  input.triggerSystem?.fire({
    hook: "OnStatusTicked",
    tick: input.tick,
    sourceCardDefinition: attributedSource.sourceCardDefinition,
    sourceCombatant: attributedSource.sourceCombatant,
    targetCombatant: combatant,
    status: statusName,
    hpDamage: damageResult.hpDamage,
    statusSourceContributions,
    triggerDepth: 0
  });
  if (status.kind === "BURN") {
    input.triggerSystem?.fire({
      hook: "OnBurnTick",
      tick: input.tick,
      targetCombatant: combatant,
      status: "Burn",
      triggerDepth: 0
    });
  }
  // DOT tick order is intentionally narrow: damage and tick reactions resolve from
  // the pre-decay amount, then the DOT clock advances, then Burn decays. Poison
  // does not use this path and remains persistent.
  status.nextTickAt += status.tickIntervalTicks;
  if (status.kind === "BURN") {
    decayBurnAfterTick(status);
  }
}

function getSingleAttributedSource(
  contributions: readonly StatusDamageSourceContribution[],
  input: StatusEffectSystemInput
): { readonly sourceCombatant?: RuntimeCombatant; readonly sourceCardDefinition?: CardDefinition } {
  const sourceCombatantIds = new Set(contributions.map((contribution) => contribution.sourceCombatantId));
  const sourceDefinitionIds = new Set(
    contributions
      .map((contribution) => contribution.sourceCardDefinitionId)
      .filter((definitionId): definitionId is string => definitionId !== undefined)
  );

  return {
    sourceCombatant:
      sourceCombatantIds.size === 1
        ? input.combatants.find((combatant) => combatant.formation.id === [...sourceCombatantIds][0])
        : undefined,
    sourceCardDefinition:
      sourceDefinitionIds.size === 1 && input.cardDefinitionsById
        ? input.cardDefinitionsById.get([...sourceDefinitionIds][0])
        : undefined
  };
}

function getStatusName(status: StatusEffect): StatusName {
  return status.kind === "POISON" ? "Poison" : "Burn";
}

function getStatusDamageType(status: StatusEffect): DamageType {
  return status.kind === "POISON" ? "POISON" : "FIRE";
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
