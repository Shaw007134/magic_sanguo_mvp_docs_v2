import type { CombatCommand, CombatExecutionContext } from "./CombatCommand.js";
import { applyDamage } from "../DamageCalculator.js";

export class DealDamageCommand implements CombatCommand {
  readonly name = "DealDamage";

  constructor(readonly amount: number) {}

  execute(context: CombatExecutionContext): void {
    applyDamage({
      tick: context.tick,
      sourceId: context.sourceCard?.instanceId,
      sourceName: context.sourceCombatant.formation.displayName,
      target: context.targetCombatant,
      amount: this.amount,
      damageType: "DIRECT",
      command: this.name,
      combatLog: context.combatLog,
      replayEvents: context.replayEvents
    });
  }
}
