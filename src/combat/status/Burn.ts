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
  existingBurn.expiresAtTick = Math.max(existingBurn.expiresAtTick ?? 0, nextBurn.expiresAtTick ?? 0);
  existingBurn.nextTickAt = Math.min(existingBurn.nextTickAt, nextBurn.nextTickAt);
  mergeSourceContributions(existingBurn, nextBurn.sourceContributions ?? []);
}

export function decayBurnAfterTick(burn: StatusEffect): void {
  if (burn.kind !== "BURN") {
    return;
  }

  burn.amount = Math.max(0, burn.amount - 1);
  if (burn.amount <= 0) {
    burn.sourceContributions = undefined;
    return;
  }

  decayLargestSourceContribution(burn);
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

function decayLargestSourceContribution(burn: StatusEffect): void {
  const sourceContributions = burn.sourceContributions?.filter((contribution) => contribution.amount > 0) ?? [];
  if (sourceContributions.length === 0) {
    burn.sourceContributions = undefined;
    return;
  }

  const contributionToDecay = [...sourceContributions].sort((left, right) =>
    right.amount - left.amount ||
    left.sourceCombatantId.localeCompare(right.sourceCombatantId) ||
    (left.sourceCardInstanceId ?? "").localeCompare(right.sourceCardInstanceId ?? "") ||
    (left.sourceCardDefinitionId ?? "").localeCompare(right.sourceCardDefinitionId ?? "")
  )[0];

  contributionToDecay.amount -= 1;
  burn.sourceContributions = sourceContributions.filter((contribution) => contribution.amount > 0);
}
