export const CARD_TIERS = ["BRONZE", "SILVER", "GOLD", "JADE", "CELESTIAL"] as const;
export const CARD_TYPES = ["ACTIVE", "PASSIVE", "AURA", "TACTIC", "RELIC"] as const;
export const CARD_SIZES = [1, 2] as const;

export type CardTier = (typeof CARD_TIERS)[number];
export type CardType = (typeof CARD_TYPES)[number];
export type CardSize = (typeof CARD_SIZES)[number];

export type ResourceCost = Readonly<Record<string, unknown>>;
export type EffectDefinition = Readonly<Record<string, unknown>>;
export type TriggerDefinition = Readonly<Record<string, unknown>>;

export interface CardDefinition {
  readonly id: string;
  readonly name: string;
  readonly tier: CardTier;
  readonly type: CardType;
  readonly size: CardSize;
  readonly tags: readonly string[];
  readonly cooldownTicks?: number;
  readonly cost?: readonly ResourceCost[];
  readonly effects?: readonly EffectDefinition[];
  readonly triggers?: readonly TriggerDefinition[];
  readonly description: string;
}

export interface CardInstance {
  readonly instanceId: string;
  readonly definitionId: string;
}

export interface CardRuntimeState {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly ownerCombatantId: string;
  readonly slotIndex: number;
  readonly cooldownMaxTicks: number;
  readonly cooldownRemainingTicks: number;
  readonly cooldownRecoveryRate: number;
  readonly disabled: boolean;
  readonly silenced: boolean;
  readonly frozen: boolean;
  readonly activationCount: number;
  readonly lastActivatedTick?: number;
}
