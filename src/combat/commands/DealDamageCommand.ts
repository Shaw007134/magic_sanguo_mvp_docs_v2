import type { CombatCommand, CombatExecutionContext } from "./CombatCommand.js";

export class DealDamageCommand implements CombatCommand {
  readonly name = "DealDamage";

  constructor(readonly amount: number) {}

  execute(context: CombatExecutionContext): void {
    const damage = Math.max(0, this.amount);
    context.targetCombatant.hp = Math.max(0, context.targetCombatant.hp - damage);
    context.replayEvents.push({
      tick: context.tick,
      type: "DAMAGE_DEALT",
      sourceId: context.sourceCard?.instanceId,
      targetId: context.targetCombatant.formation.id,
      payload: {
        command: this.name,
        amount: damage,
        targetSide: context.targetCombatant.side,
        targetHp: context.targetCombatant.hp
      }
    });
    context.combatLog.add(
      `${context.tick}: ${context.sourceCombatant.formation.displayName} dealt ${damage} damage to ${context.targetCombatant.formation.displayName}.`
    );
  }
}
