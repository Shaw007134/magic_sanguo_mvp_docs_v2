import type { StatusEffect, StatusSourceAttribution, StatusSourceContribution } from "./StatusEffect.js";

export const BURN_TICK_INTERVAL_TICKS = 60;

export function createBurn(
  amount: number,
  durationTicks: number,
  appliedAtTick: number,
  source?: StatusSourceAttribution
): StatusEffect {
  const normalizedAmount = Math.max(0, amount);
  return {
    kind: "BURN",
    amount: normalizedAmount,
    tickIntervalTicks: BURN_TICK_INTERVAL_TICKS,
    appliedAtTick,
    nextTickAt: appliedAtTick + BURN_TICK_INTERVAL_TICKS,
    expiresAtTick: appliedAtTick + Math.max(0, durationTicks),
    sourceContributions: source && normalizedAmount > 0 ? [{ ...source, amount: normalizedAmount }] : undefined
  };
}

export function mergeBurn(existingBurn: StatusEffect, nextBurn: StatusEffect): void {
  existingBurn.amount += nextBurn.amount;
  existingBurn.expiresAtTick = Math.max(existingBurn.expiresAtTick, nextBurn.expiresAtTick);
  existingBurn.nextTickAt = Math.min(existingBurn.nextTickAt, nextBurn.nextTickAt);
  mergeSourceContributions(existingBurn, nextBurn.sourceContributions ?? []);
}

function mergeSourceContributions(
  existingBurn: StatusEffect,
  nextContributions: readonly StatusSourceContribution[]
): void {
  if (nextContributions.length === 0) {
    return;
  }
  existingBurn.sourceContributions ??= [];
  for (const nextContribution of nextContributions) {
    const existingContribution = existingBurn.sourceContributions.find((candidate) =>
      candidate.sourceCombatantId === nextContribution.sourceCombatantId &&
      candidate.sourceCardInstanceId === nextContribution.sourceCardInstanceId &&
      candidate.sourceCardDefinitionId === nextContribution.sourceCardDefinitionId
    );
    if (existingContribution) {
      existingContribution.amount += nextContribution.amount;
    } else {
      existingBurn.sourceContributions.push({ ...nextContribution });
    }
  }
}
