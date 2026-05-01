import type { DamageType } from "../DamageCalculator.js";
import type { ModifierHook } from "./ModifierHooks.js";

export type ModifierOperationType =
  | "ADD_DAMAGE"
  | "MULTIPLY_DAMAGE"
  | "ADD_COOLDOWN_RECOVERY_RATE"
  | "MULTIPLY_COOLDOWN_RECOVERY_RATE"
  | "ADD_STATUS_DURATION"
  | "MULTIPLY_STATUS_DURATION";

export interface ModifierCondition {
  readonly sourceHasTag?: string;
  readonly targetHasStatus?: "Burn";
  readonly ownerHasStatus?: "Burn";
  readonly damageType?: DamageType;
  readonly cardInSlot?: number;
  readonly always?: boolean;
}

export interface ModifierOperation {
  readonly type: ModifierOperationType;
  readonly value: number;
}

export interface Modifier {
  readonly id: string;
  readonly sourceId: string;
  readonly ownerId: string;
  readonly hook: ModifierHook;
  readonly priority: number;
  readonly condition: ModifierCondition;
  readonly operation: ModifierOperation;
  readonly expiresAtTick?: number;
}
