export interface StatusEffect {
  readonly kind: "BURN";
  amount: number;
  tickIntervalTicks: number;
  appliedAtTick: number;
  nextTickAt: number;
  expiresAtTick: number;
}
