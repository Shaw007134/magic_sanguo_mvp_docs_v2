import type { StatusEffect } from "./StatusEffect.js";

export const BURN_TICK_INTERVAL_TICKS = 60;

export function createBurn(amount: number, durationTicks: number): StatusEffect {
  return {
    kind: "BURN",
    amount: Math.max(0, amount),
    durationRemainingTicks: Math.max(0, durationTicks),
    tickIntervalTicks: BURN_TICK_INTERVAL_TICKS,
    ticksUntilNextTick: BURN_TICK_INTERVAL_TICKS
  };
}
