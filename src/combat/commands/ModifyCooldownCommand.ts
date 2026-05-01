import type { CombatCommand, CombatExecutionContext } from "./CombatCommand.js";

export class ModifyCooldownCommand implements CombatCommand {
  readonly name = "ModifyCooldown";

  constructor(
    readonly targetCardInstanceId: string,
    readonly amountTicks: number
  ) {}

  execute(context: CombatExecutionContext): void {
    const targetCard = [...context.sourceCombatant.cards, ...context.targetCombatant.cards].find(
      (card) => card.instanceId === this.targetCardInstanceId
    );

    if (!targetCard) {
      context.combatLog.add(
        `${context.tick}: ModifyCooldown could not find card ${this.targetCardInstanceId}.`
      );
      return;
    }

    targetCard.cooldownRemainingTicks = Math.max(0, targetCard.cooldownRemainingTicks + this.amountTicks);
    context.replayEvents.push({
      tick: context.tick,
      type: "COOLDOWN_MODIFIED",
      sourceId: context.sourceCard?.instanceId,
      targetId: targetCard.instanceId,
      payload: {
        command: this.name,
        amountTicks: this.amountTicks,
        cooldownRemainingTicks: targetCard.cooldownRemainingTicks
      }
    });
    context.combatLog.add(
      `${context.tick}: Modified cooldown on ${targetCard.instanceId} by ${this.amountTicks} ticks.`
    );
    context.triggerSystem?.fire({
      hook: "OnCooldownModified",
      tick: context.tick,
      sourceCard: context.sourceCard,
      sourceCardDefinition: context.sourceCardDefinition,
      sourceCombatant: context.sourceCombatant,
      targetCombatant: context.targetCombatant,
      triggerDepth: context.triggerDepth
    });
  }
}
