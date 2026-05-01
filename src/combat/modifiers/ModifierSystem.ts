import type { CardDefinition, CardRuntimeState } from "../../model/card.js";
import type { DamageType } from "../DamageCalculator.js";
import type { RuntimeCombatant } from "../types.js";
import type { Modifier, ModifierCondition } from "./Modifier.js";
import type { ModifierHook } from "./ModifierHooks.js";

export interface ModifierContext {
  readonly tick: number;
  readonly hook: ModifierHook;
  readonly sourceCard?: CardRuntimeState;
  readonly sourceCardDefinition?: CardDefinition;
  readonly sourceCombatant?: RuntimeCombatant;
  readonly targetCombatant?: RuntimeCombatant;
  readonly combatants: readonly RuntimeCombatant[];
  readonly damageType?: DamageType;
}

export class ModifierSystem {
  constructor(readonly modifiers: readonly Modifier[] = []) {}

  getApplicableModifiers(context: ModifierContext): readonly Modifier[] {
    return this.modifiers
      .filter((modifier) => modifier.hook === context.hook)
      .filter((modifier) => modifier.expiresAtTick === undefined || context.tick <= modifier.expiresAtTick)
      .filter((modifier) => conditionPasses(modifier.condition, modifier.ownerId, context))
      .sort(compareModifiers);
  }

  applyDamageModifiers(amount: number, context: Omit<ModifierContext, "hook">): number {
    let modifiedAmount = amount;
    for (const modifier of this.getApplicableModifiers({ ...context, hook: "BeforeDealDamage" })) {
      if (modifier.operation.type === "ADD_DAMAGE") {
        modifiedAmount += modifier.operation.value;
      } else if (modifier.operation.type === "MULTIPLY_DAMAGE") {
        modifiedAmount *= modifier.operation.value;
      }
    }
    return Math.max(0, modifiedAmount);
  }

  applyCooldownRecoveryModifiers(recoveryRate: number, context: Omit<ModifierContext, "hook">): number {
    let modifiedRate = recoveryRate;
    for (const modifier of this.getApplicableModifiers({ ...context, hook: "BeforeCooldownRecover" })) {
      if (modifier.operation.type === "ADD_COOLDOWN_RECOVERY_RATE") {
        modifiedRate += modifier.operation.value;
      } else if (modifier.operation.type === "MULTIPLY_COOLDOWN_RECOVERY_RATE") {
        modifiedRate *= modifier.operation.value;
      }
    }
    return Math.max(0, modifiedRate);
  }

  applyStatusDurationModifiers(durationTicks: number, context: Omit<ModifierContext, "hook">): number {
    let modifiedDuration = durationTicks;
    for (const modifier of this.getApplicableModifiers({ ...context, hook: "OnStatusApplied" })) {
      if (modifier.operation.type === "ADD_STATUS_DURATION") {
        modifiedDuration += modifier.operation.value;
      } else if (modifier.operation.type === "MULTIPLY_STATUS_DURATION") {
        modifiedDuration *= modifier.operation.value;
      }
    }
    return Math.max(0, Math.round(modifiedDuration));
  }
}

function compareModifiers(left: Modifier, right: Modifier): number {
  return left.priority - right.priority || left.id.localeCompare(right.id);
}

function conditionPasses(condition: ModifierCondition, ownerId: string, context: ModifierContext): boolean {
  if (condition.always === true) {
    return true;
  }

  if (condition.sourceHasTag !== undefined && !context.sourceCardDefinition?.tags.includes(condition.sourceHasTag)) {
    return false;
  }

  if (
    condition.targetHasStatus !== undefined &&
    !context.targetCombatant?.statuses.some((status) => status.kind === "BURN")
  ) {
    return false;
  }

  if (condition.ownerHasStatus !== undefined) {
    const owner = context.combatants.find((combatant) => combatant.formation.id === ownerId);
    if (!owner?.statuses.some((status) => status.kind === "BURN")) {
      return false;
    }
  }

  if (condition.damageType !== undefined && context.damageType !== condition.damageType) {
    return false;
  }

  if (condition.cardInSlot !== undefined && context.sourceCard?.slotIndex !== condition.cardInSlot) {
    return false;
  }

  return true;
}
