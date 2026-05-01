export interface StatusEffect {
  readonly kind: "BURN";
  amount: number;
  durationRemainingTicks: number;
  tickIntervalTicks: number;
  ticksUntilNextTick: number;
}
