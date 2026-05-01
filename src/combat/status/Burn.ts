import type { StatusEffect } from "./StatusEffect.js";

export const BURN_TICK_INTERVAL_TICKS = 60;

export function createBurn(amount: number, durationTicks: number, appliedAtTick: number): StatusEffect {
  return {
    kind: "BURN",
    amount: Math.max(0, amount),
    tickIntervalTicks: BURN_TICK_INTERVAL_TICKS,
    appliedAtTick,
    nextTickAt: appliedAtTick + BURN_TICK_INTERVAL_TICKS,
    expiresAtTick: appliedAtTick + Math.max(0, durationTicks)
  };
}

export function mergeBurn(existingBurn: StatusEffect, nextBurn: StatusEffect): void {
  existingBurn.amount += nextBurn.amount;
  existingBurn.expiresAtTick = Math.max(existingBurn.expiresAtTick, nextBurn.expiresAtTick);
  existingBurn.nextTickAt = Math.min(existingBurn.nextTickAt, nextBurn.nextTickAt);
}
