import type { CombatCommand, CombatExecutionContext } from "./CombatCommand.js";

export class HealHPCommand implements CombatCommand {
  readonly name = "HealHP";

  constructor(readonly amount: number) {}

  execute(context: CombatExecutionContext): void {
    const target = context.sourceCombatant;
    const requestedAmount = Math.max(0, this.amount);
    const missingHp = Math.max(0, target.formation.maxHp - target.hp);
    const healedAmount = Math.min(requestedAmount, missingHp);

    target.hp += healedAmount;

    context.replayEvents.push({
      tick: context.tick,
      type: "HpHealed",
      sourceId: context.sourceCard?.instanceId,
      targetId: target.formation.id,
      payload: {
        command: this.name,
        amount: healedAmount,
        requestedAmount,
        targetSide: target.side,
        targetHp: target.hp,
        maxHp: target.formation.maxHp
      }
    });
    context.combatLog.add(
      `${context.tick}: ${target.formation.displayName} healed ${healedAmount} HP (${target.hp}/${target.formation.maxHp}).`
    );
  }
}
