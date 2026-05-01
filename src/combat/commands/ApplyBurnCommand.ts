import type { CombatCommand, CombatExecutionContext } from "./CombatCommand.js";

export class ApplyBurnCommand implements CombatCommand {
  readonly name = "ApplyBurn";

  constructor(
    readonly amount: number,
    readonly durationTicks: number
  ) {}

  execute(context: CombatExecutionContext): void {
    context.replayEvents.push({
      tick: context.tick,
      type: "BURN_APPLIED",
      sourceId: context.sourceCard?.instanceId,
      targetId: context.targetCombatant.formation.id,
      payload: {
        command: this.name,
        amount: this.amount,
        durationTicks: this.durationTicks
      }
    });
    context.combatLog.add(
      `${context.tick}: ${context.sourceCombatant.formation.displayName} applied ${this.amount} burn to ${context.targetCombatant.formation.displayName}.`
    );
  }
}
