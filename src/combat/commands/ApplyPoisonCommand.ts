import type { CombatCommand, CombatExecutionContext } from "./CombatCommand.js";
import { createPoison, mergePoison } from "../status/Poison.js";

export class ApplyPoisonCommand implements CombatCommand {
  readonly name = "ApplyPoison";

  constructor(
    readonly amount: number,
    readonly durationTicks?: number
  ) {}

  execute(context: CombatExecutionContext): void {
    const sourceAttribution = {
      sourceCombatantId: context.sourceCombatant.formation.id,
      ...(context.sourceCard ? { sourceCardInstanceId: context.sourceCard.instanceId } : {}),
      ...(context.sourceCardDefinition ? { sourceCardDefinitionId: context.sourceCardDefinition.id } : {})
    };
    const durationTicks = this.durationTicks === undefined
      ? undefined
      : context.modifierSystem
        ? context.modifierSystem.applyStatusDurationModifiers(this.durationTicks, {
            tick: context.tick,
            sourceCard: context.sourceCard,
            sourceCardDefinition: context.sourceCardDefinition,
            sourceCombatant: context.sourceCombatant,
            targetCombatant: context.targetCombatant,
            combatants: context.combatants ?? []
          })
        : this.durationTicks;
    const poison = createPoison(this.amount, context.tick, sourceAttribution, durationTicks);
    if (poison.amount <= 0 || (poison.expiresAtTick !== undefined && poison.expiresAtTick <= context.tick)) {
      return;
    }

    const existingPoison = context.targetCombatant.statuses.find((status) => status.kind === "POISON");
    if (existingPoison) {
      mergePoison(existingPoison, poison);
    } else {
      context.targetCombatant.statuses.push(poison);
    }

    context.replayEvents.push({
      tick: context.tick,
      type: "StatusApplied",
      sourceId: context.sourceCard?.instanceId,
      targetId: context.targetCombatant.formation.id,
      payload: {
        command: this.name,
        status: "Poison",
        amount: this.amount,
        ...(durationTicks !== undefined ? { durationTicks } : {}),
        ...sourceAttribution,
        totalAmount: existingPoison?.amount ?? poison.amount,
        nextTickAt: existingPoison?.nextTickAt ?? poison.nextTickAt,
        ...(existingPoison?.expiresAtTick !== undefined || poison.expiresAtTick !== undefined
          ? { expiresAtTick: existingPoison?.expiresAtTick ?? poison.expiresAtTick }
          : {}),
        sourceContributions: cloneSourceContributions(existingPoison?.sourceContributions ?? poison.sourceContributions ?? [])
      }
    });
    context.combatLog.add(
      `${context.tick}: ${context.sourceCombatant.formation.displayName} applied ${this.amount} poison to ${context.targetCombatant.formation.displayName}.`
    );
    context.triggerSystem?.fire({
      hook: "OnStatusApplied",
      tick: context.tick,
      sourceCard: context.sourceCard,
      sourceCardDefinition: context.sourceCardDefinition,
      sourceCombatant: context.sourceCombatant,
      targetCombatant: context.targetCombatant,
      status: "Poison",
      triggerDepth: context.triggerDepth
    });
  }
}

function cloneSourceContributions<T extends { readonly sourceCombatantId: string; readonly sourceCardInstanceId?: string; readonly sourceCardDefinitionId?: string; readonly amount: number }>(
  contributions: readonly T[]
) {
  return contributions.map((contribution) => ({
    sourceCombatantId: contribution.sourceCombatantId,
    ...(contribution.sourceCardInstanceId ? { sourceCardInstanceId: contribution.sourceCardInstanceId } : {}),
    ...(contribution.sourceCardDefinitionId ? { sourceCardDefinitionId: contribution.sourceCardDefinitionId } : {}),
    amount: contribution.amount
  }));
}
