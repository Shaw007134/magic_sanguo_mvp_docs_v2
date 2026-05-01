import type { ReplayEvent } from "../model/result.js";
import type { CombatLog } from "./CombatLog.js";
import type { RuntimeCombatant } from "./types.js";

export type DamageType = "DIRECT" | "FIRE";

export interface DamageCalculationInput {
  readonly tick: number;
  readonly sourceId?: string;
  readonly sourceName: string;
  readonly target: RuntimeCombatant;
  readonly amount: number;
  readonly damageType: DamageType;
  readonly ignoresArmor?: boolean;
  readonly command: string;
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
  const incomingDamage = Math.max(0, input.amount);
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

  input.replayEvents.push({
    tick: input.tick,
    type: "DAMAGE_DEALT",
    sourceId: input.sourceId,
    targetId: input.target.formation.id,
    payload: {
      command: input.command,
      amount: incomingDamage,
      damageType: input.damageType,
      ignoresArmor: input.ignoresArmor === true,
      armorBlocked,
      hpDamage,
      targetSide: input.target.side,
      targetHp: input.target.hp,
      targetArmor: input.target.armor
    }
  });
  input.combatLog.add(
    `${input.tick}: ${input.sourceName} dealt ${hpDamage} ${input.damageType.toLowerCase()} damage to ${input.target.formation.displayName} (${armorBlocked} blocked by armor).`
  );

  return result;
}
