import type { StatusEffect, StatusSourceAttribution, StatusSourceContribution } from "./StatusEffect.js";

export const POISON_TICK_INTERVAL_TICKS = 60;

export function createPoison(
  amount: number,
  appliedAtTick: number,
  source?: StatusSourceAttribution,
  durationTicks?: number
): StatusEffect {
  const normalizedAmount = Math.max(0, amount);
  return {
    kind: "POISON",
    amount: normalizedAmount,
    tickIntervalTicks: POISON_TICK_INTERVAL_TICKS,
    appliedAtTick,
    nextTickAt: appliedAtTick + POISON_TICK_INTERVAL_TICKS,
    ...(durationTicks !== undefined ? { expiresAtTick: appliedAtTick + Math.max(0, durationTicks) } : {}),
    sourceContributions: source && normalizedAmount > 0 ? [{ ...source, amount: normalizedAmount }] : undefined
  };
}

export function mergePoison(existingPoison: StatusEffect, nextPoison: StatusEffect): void {
  existingPoison.amount += nextPoison.amount;
  existingPoison.nextTickAt = Math.min(existingPoison.nextTickAt, nextPoison.nextTickAt);
  if (existingPoison.expiresAtTick !== undefined || nextPoison.expiresAtTick !== undefined) {
    existingPoison.expiresAtTick = Math.max(
      existingPoison.expiresAtTick ?? Number.MAX_SAFE_INTEGER,
      nextPoison.expiresAtTick ?? Number.MAX_SAFE_INTEGER
    );
    if (existingPoison.expiresAtTick === Number.MAX_SAFE_INTEGER) {
      existingPoison.expiresAtTick = undefined;
    }
  }
  mergeSourceContributions(existingPoison, nextPoison.sourceContributions ?? []);
}

function mergeSourceContributions(
  existingPoison: StatusEffect,
  nextContributions: readonly StatusSourceContribution[]
): void {
  if (nextContributions.length === 0) {
    return;
  }
  existingPoison.sourceContributions ??= [];
  for (const nextContribution of nextContributions) {
    const existingContribution = existingPoison.sourceContributions.find((candidate) =>
      candidate.sourceCombatantId === nextContribution.sourceCombatantId &&
      candidate.sourceCardInstanceId === nextContribution.sourceCardInstanceId &&
      candidate.sourceCardDefinitionId === nextContribution.sourceCardDefinitionId
    );
    if (existingContribution) {
      existingContribution.amount += nextContribution.amount;
    } else {
      existingPoison.sourceContributions.push({ ...nextContribution });
    }
  }
}
