import type { CombatCommand, CombatExecutionContext } from "./CombatCommand.js";
import { createBurn, mergeBurn } from "../status/Burn.js";

export class ApplyBurnCommand implements CombatCommand {
  readonly name = "ApplyBurn";

  constructor(
    readonly amount: number,
    readonly durationTicks: number
  ) {}

  execute(context: CombatExecutionContext): void {
    const durationTicks = context.modifierSystem
      ? context.modifierSystem.applyStatusDurationModifiers(this.durationTicks, {
          tick: context.tick,
          sourceCard: context.sourceCard,
          sourceCardDefinition: context.sourceCardDefinition,
          sourceCombatant: context.sourceCombatant,
          targetCombatant: context.targetCombatant,
          combatants: context.combatants ?? []
        })
      : this.durationTicks;
    const burn = createBurn(this.amount, durationTicks, context.tick);
    if (burn.amount <= 0 || burn.expiresAtTick <= context.tick) {
      return;
    }

    const existingBurn = context.targetCombatant.statuses.find((status) => status.kind === "BURN");
    if (existingBurn) {
      mergeBurn(existingBurn, burn);
    } else {
      context.targetCombatant.statuses.push(burn);
    }
    context.replayEvents.push({
      tick: context.tick,
      type: "StatusApplied",
      sourceId: context.sourceCard?.instanceId,
      targetId: context.targetCombatant.formation.id,
      payload: {
        command: this.name,
        status: "Burn",
        amount: this.amount,
        durationTicks,
        totalAmount: existingBurn?.amount ?? burn.amount,
        nextTickAt: existingBurn?.nextTickAt ?? burn.nextTickAt,
        expiresAtTick: existingBurn?.expiresAtTick ?? burn.expiresAtTick
      }
    });
    context.combatLog.add(
      `${context.tick}: ${context.sourceCombatant.formation.displayName} applied ${this.amount} burn to ${context.targetCombatant.formation.displayName}.`
    );
    context.triggerSystem?.fire({
      hook: "OnStatusApplied",
      tick: context.tick,
      sourceCard: context.sourceCard,
      sourceCardDefinition: context.sourceCardDefinition,
      sourceCombatant: context.sourceCombatant,
      targetCombatant: context.targetCombatant,
      status: "Burn",
      triggerDepth: context.triggerDepth
    });
  }
}
