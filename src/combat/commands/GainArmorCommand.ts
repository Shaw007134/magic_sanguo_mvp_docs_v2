import type { CombatCommand, CombatExecutionContext } from "./CombatCommand.js";

export class GainArmorCommand implements CombatCommand {
  readonly name = "GainArmor";

  constructor(readonly amount: number) {}

  execute(context: CombatExecutionContext): void {
    const armorGained = Math.max(0, this.amount);
    context.sourceCombatant.armor += armorGained;
    context.replayEvents.push({
      tick: context.tick,
      type: "ARMOR_GAINED",
      sourceId: context.sourceCard?.instanceId,
      targetId: context.sourceCombatant.formation.id,
      payload: {
        command: this.name,
        amount: armorGained,
        armor: context.sourceCombatant.armor
      }
    });
    context.combatLog.add(
      `${context.tick}: ${context.sourceCombatant.formation.displayName} gained ${armorGained} armor.`
    );
  }
}
