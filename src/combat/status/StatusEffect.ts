export interface StatusSourceAttribution {
  readonly sourceCombatantId: string;
  readonly sourceCardInstanceId?: string;
  readonly sourceCardDefinitionId?: string;
}

export interface StatusSourceContribution extends StatusSourceAttribution {
  amount: number;
}

export interface StatusDamageSourceContribution extends StatusSourceAttribution {
  readonly amount: number;
}

export type StatusKind = "BURN" | "POISON";
export type StatusName = "Burn" | "Poison";

export interface StatusEffect {
  readonly kind: StatusKind;
  amount: number;
  tickIntervalTicks: number;
  appliedAtTick: number;
  nextTickAt: number;
  expiresAtTick?: number;
  sourceContributions?: StatusSourceContribution[];
}
