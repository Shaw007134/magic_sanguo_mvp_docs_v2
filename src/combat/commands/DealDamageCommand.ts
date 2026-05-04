import type { CombatCommand, CombatExecutionContext } from "./CombatCommand.js";
import { applyDamage, type DamageType } from "../DamageCalculator.js";

export type DealDamageScalingSource =
  | "OWNER_ARMOR_PERCENT"
  | "OWNER_MAX_HP_PERCENT"
  | "TARGET_MISSING_HP_PERCENT";

export interface DealDamageScalingDefinition {
  readonly source: DealDamageScalingSource;
  readonly percent: number;
}

export interface DealDamageConditionalMultiplierDefinition {
  readonly targetHpBelowPercent: number;
  readonly multiplier: number;
}

export interface DealDamageCommandOptions {
  readonly damageType?: DamageType;
  readonly ignoresArmor?: boolean;
  readonly critChancePercent?: number;
  readonly critMultiplier?: number;
  readonly scaling?: DealDamageScalingDefinition;
  readonly conditionalMultiplier?: DealDamageConditionalMultiplierDefinition;
}

export class DealDamageCommand implements CombatCommand {
  readonly name = "DealDamage";

  constructor(
    readonly amount: number,
    readonly options: DealDamageCommandOptions = {}
  ) {}

  execute(context: CombatExecutionContext): void {
    const scalingAmount = getScalingAmount(this.options.scaling, context);
    const conditionalMultiplier = getConditionalMultiplier(this.options.conditionalMultiplier, context);
    const baseAmount = Math.max(0, Math.round((this.amount + scalingAmount) * conditionalMultiplier));
    const critical = rollDeterministicCrit(this.options, context);
    const criticalMultiplier = critical ? (this.options.critMultiplier ?? 1) : 1;
    const finalAmount = Math.max(0, Math.round(baseAmount * criticalMultiplier));

    applyDamage({
      tick: context.tick,
      sourceId: context.sourceCard?.instanceId,
      sourceName: context.sourceCombatant.formation.displayName,
      target: context.targetCombatant,
      amount: finalAmount,
      damageType: this.options.damageType ?? "DIRECT",
      sourceCard: context.sourceCard,
      sourceCardDefinition: context.sourceCardDefinition,
      sourceCombatant: context.sourceCombatant,
      combatants: context.combatants,
      modifierSystem: context.modifierSystem,
      ignoresArmor: this.options.ignoresArmor,
      command: this.name,
      critical,
      critChancePercent: this.options.critChancePercent,
      critMultiplier: this.options.critMultiplier,
      baseAmount,
      scalingAmount,
      conditionalMultiplier,
      combatLog: context.combatLog,
      replayEvents: context.replayEvents
    });
    context.triggerSystem?.fire({
      hook: "OnDamageDealt",
      tick: context.tick,
      sourceCard: context.sourceCard,
      sourceCardDefinition: context.sourceCardDefinition,
      sourceCombatant: context.sourceCombatant,
      targetCombatant: context.targetCombatant,
      triggerDepth: context.triggerDepth
    });
    context.triggerSystem?.fire({
      hook: "OnDamageTaken",
      tick: context.tick,
      sourceCard: context.sourceCard,
      sourceCardDefinition: context.sourceCardDefinition,
      sourceCombatant: context.sourceCombatant,
      targetCombatant: context.targetCombatant,
      triggerDepth: context.triggerDepth
    });
  }
}

function getScalingAmount(
  scaling: DealDamageScalingDefinition | undefined,
  context: CombatExecutionContext
): number {
  if (!scaling || scaling.percent <= 0) {
    return 0;
  }
  const ratio = scaling.percent / 100;
  switch (scaling.source) {
    case "OWNER_ARMOR_PERCENT":
      return Math.round(Math.max(0, context.sourceCombatant.armor) * ratio);
    case "OWNER_MAX_HP_PERCENT":
      return Math.round(Math.max(0, context.sourceCombatant.formation.maxHp) * ratio);
    case "TARGET_MISSING_HP_PERCENT":
      return Math.round(
        Math.max(0, context.targetCombatant.formation.maxHp - context.targetCombatant.hp) * ratio
      );
  }
}

function getConditionalMultiplier(
  conditional: DealDamageConditionalMultiplierDefinition | undefined,
  context: CombatExecutionContext
): number {
  if (!conditional || conditional.multiplier < 1) {
    return 1;
  }
  const threshold = conditional.targetHpBelowPercent > 1
    ? conditional.targetHpBelowPercent / 100
    : conditional.targetHpBelowPercent;
  const targetHpPercent = context.targetCombatant.hp / context.targetCombatant.formation.maxHp;
  return targetHpPercent < threshold ? conditional.multiplier : 1;
}

function rollDeterministicCrit(options: DealDamageCommandOptions, context: CombatExecutionContext): boolean {
  const critChancePercent = options.critChancePercent ?? 0;
  const critMultiplier = options.critMultiplier ?? 1;
  if (critChancePercent <= 0 || critMultiplier <= 1) {
    return false;
  }
  if (critChancePercent >= 100) {
    return true;
  }
  const sourceCard = context.sourceCard;
  const rollSeed = [
    context.tick,
    context.sourceCombatant.formation.id,
    context.targetCombatant.formation.id,
    context.sourceCombatant.side,
    context.targetCombatant.side,
    sourceCard?.ownerCombatantId ?? context.sourceCombatant.formation.id,
    sourceCard?.instanceId ?? "no-card",
    sourceCard?.activationCount ?? 0,
    context.sourceCardDefinition?.id ?? "no-definition",
    context.triggerDepth,
    options.critChancePercent,
    options.critMultiplier
  ].join(":");
  return (hashString(rollSeed) % 10000) / 100 < critChancePercent;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
