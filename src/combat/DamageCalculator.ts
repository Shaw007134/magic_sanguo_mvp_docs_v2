import type { ReplayEvent } from "../model/result.js";
import type { CardDefinition, CardRuntimeState } from "../model/card.js";
import type { CombatLog } from "./CombatLog.js";
import type { ModifierSystem } from "./modifiers/ModifierSystem.js";
import type { StatusDamageSourceContribution } from "./status/StatusEffect.js";
import type { RuntimeCombatant } from "./types.js";

export type DamageType = "DIRECT" | "PHYSICAL" | "FIRE";

export interface DamageCalculationInput {
  readonly tick: number;
  readonly sourceId?: string;
  readonly sourceName: string;
  readonly target: RuntimeCombatant;
  readonly amount: number;
  readonly damageType: DamageType;
  readonly sourceCard?: CardRuntimeState;
  readonly sourceCardDefinition?: CardDefinition;
  readonly sourceCombatant?: RuntimeCombatant;
  readonly combatants?: readonly RuntimeCombatant[];
  readonly modifierSystem?: ModifierSystem;
  readonly ignoresArmor?: boolean;
  readonly command: string;
  readonly critical?: boolean;
  readonly critChancePercent?: number;
  readonly critMultiplier?: number;
  readonly baseAmount?: number;
  readonly scalingAmount?: number;
  readonly conditionalMultiplier?: number;
  readonly statusSourceContributions?: readonly StatusDamageSourceContribution[];
  readonly combatLog: CombatLog;
  readonly replayEvents: ReplayEvent[];
}

export interface DamageCalculationResult {
  readonly incomingDamage: number;
  readonly armorBlocked: number;
  readonly hpDamage: number;
  readonly targetHp: number;
  readonly targetArmor: number;
}

export function applyDamage(input: DamageCalculationInput): DamageCalculationResult {
  const modifiedDamage = input.modifierSystem
    ? input.modifierSystem.applyDamageModifiers(input.amount, {
        tick: input.tick,
        sourceCard: input.sourceCard,
        sourceCardDefinition: input.sourceCardDefinition,
        sourceCombatant: input.sourceCombatant,
        targetCombatant: input.target,
        combatants: input.combatants ?? [],
        damageType: input.damageType
      })
    : input.amount;
  const incomingDamage = Math.max(0, modifiedDamage);
  const armorBlocked = input.ignoresArmor ? 0 : Math.min(input.target.armor, incomingDamage);
  const hpDamage = Math.max(0, incomingDamage - armorBlocked);

  input.target.armor -= armorBlocked;
  input.target.hp = Math.max(0, input.target.hp - hpDamage);

  const result: DamageCalculationResult = {
    incomingDamage,
    armorBlocked,
    hpDamage,
    targetHp: input.target.hp,
    targetArmor: input.target.armor
  };

  const payload: Record<string, unknown> = {
    command: input.command,
    amount: incomingDamage,
    damageType: input.damageType,
    ignoresArmor: input.ignoresArmor === true,
    critical: input.critical === true,
    armorBlocked,
    hpDamage,
    targetSide: input.target.side,
    targetHp: input.target.hp,
    targetArmor: input.target.armor
  };
  if (input.critChancePercent !== undefined) {
    payload.critChancePercent = input.critChancePercent;
  }
  if (input.critMultiplier !== undefined) {
    payload.critMultiplier = input.critMultiplier;
  }
  if (input.baseAmount !== undefined && input.baseAmount !== incomingDamage) {
    payload.baseAmount = input.baseAmount;
  }
  if (input.scalingAmount !== undefined && input.scalingAmount > 0) {
    payload.scalingAmount = input.scalingAmount;
  }
  if (input.conditionalMultiplier !== undefined && input.conditionalMultiplier !== 1) {
    payload.conditionalMultiplier = input.conditionalMultiplier;
  }
  if (input.statusSourceContributions && input.statusSourceContributions.length > 0) {
    payload.statusSourceContributions = input.statusSourceContributions;
  }

  input.replayEvents.push({
    tick: input.tick,
    type: "DamageDealt",
    sourceId: input.sourceId,
    targetId: input.target.formation.id,
    payload
  });
  if (armorBlocked > 0) {
    input.replayEvents.push({
      tick: input.tick,
      type: "ArmorBlocked",
      sourceId: input.sourceId,
      targetId: input.target.formation.id,
      payload: {
        command: input.command,
        amount: armorBlocked,
        damageType: input.damageType,
        targetSide: input.target.side,
        targetArmor: input.target.armor
      }
    });
  }
  input.combatLog.add(
    `${input.tick}: ${input.sourceName} dealt ${hpDamage} ${input.damageType.toLowerCase()} damage to ${input.target.formation.displayName} (${armorBlocked} blocked by armor).`
  );

  return result;
}
