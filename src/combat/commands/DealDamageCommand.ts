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
      sourceCard: context.sourceCard,
      sourceCardDefinition: context.sourceCardDefinition,
      sourceCombatant: context.sourceCombatant,
      combatants: context.combatants,
      modifierSystem: context.modifierSystem,
      command: this.name,
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
