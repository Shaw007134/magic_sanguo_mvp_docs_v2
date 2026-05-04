import type { CombatCommand, CombatExecutionContext } from "./CombatCommand.js";
import { getControlStatusName, type CardControlStatusKind, type CardControlStatusName } from "../status/ControlStatus.js";
import type { MutableCardRuntimeState } from "../types.js";

export type ControlStatusTarget =
  | "SELF"
  | "ADJACENT_ALLY"
  | "OWNER_ALL_CARDS"
  | "OPPOSITE_ENEMY_CARD"
  | "ENEMY_LEFTMOST_ACTIVE";

interface ApplyControlStatusInput {
  readonly kind: CardControlStatusKind;
  readonly commandName: string;
  readonly target: ControlStatusTarget;
  readonly durationTicks: number;
  readonly percent?: number;
}

export class ApplyControlStatusCommand implements CombatCommand {
  readonly name: string;

  constructor(readonly input: ApplyControlStatusInput) {
    this.name = input.commandName;
  }

  execute(context: CombatExecutionContext): void {
    const durationTicks = Math.max(0, Math.round(this.input.durationTicks));
    const percent = this.input.percent === undefined ? undefined : Math.max(0, Math.round(this.input.percent));
    if (durationTicks <= 0 || (this.input.kind !== "FREEZE" && (percent ?? 0) <= 0)) {
      return;
    }

    const targets = resolveTargets(this.input.target, this.input.kind, context);
    if (targets.length === 0) {
      context.combatLog.add(`${context.tick}: ${this.name} found no valid target cards.`);
      return;
    }

    const sourceAttribution = {
      sourceCombatantId: context.sourceCombatant.formation.id,
      ...(context.sourceCard ? { sourceCardInstanceId: context.sourceCard.instanceId } : {}),
      ...(context.sourceCardDefinition ? { sourceCardDefinitionId: context.sourceCardDefinition.id } : {})
    };
    const statusName = getControlStatusName(this.input.kind);
    const expiresAtTick = context.tick + durationTicks;

    for (const target of targets) {
      target.controlStatuses ??= [];
      let finalExpiresAtTick = expiresAtTick;
      if (this.input.kind === "FREEZE") {
        const existingFreeze = target.controlStatuses.find((status) => status.kind === "FREEZE");
        if (existingFreeze) {
          existingFreeze.expiresAtTick = Math.max(existingFreeze.expiresAtTick, expiresAtTick);
          finalExpiresAtTick = existingFreeze.expiresAtTick;
        } else {
          target.controlStatuses.push({
            kind: "FREEZE",
            appliedAtTick: context.tick,
            expiresAtTick,
            ...sourceAttribution
          });
        }
      } else {
        target.controlStatuses.push({
          kind: this.input.kind,
          appliedAtTick: context.tick,
          expiresAtTick,
          percent,
          ...sourceAttribution
        });
      }

      context.replayEvents.push({
        tick: context.tick,
        type: "StatusApplied",
        sourceId: context.sourceCard?.instanceId,
        targetId: target.instanceId,
        payload: {
          command: this.name,
          status: statusName,
          targetCardInstanceId: target.instanceId,
          targetSlotIndex: target.slotIndex,
          durationTicks,
          expiresAtTick: finalExpiresAtTick,
          ...(percent !== undefined ? { percent } : {}),
          ...sourceAttribution
        }
      });
      context.combatLog.add(
        `${context.tick}: ${context.sourceCombatant.formation.displayName} applied ${formatStatusForLog(statusName, percent)} to ${target.instanceId}.`
      );
    }
  }
}

function resolveTargets(
  target: ControlStatusTarget,
  kind: CardControlStatusKind,
  context: CombatExecutionContext
): MutableCardRuntimeState[] {
  const sourceCard = context.sourceCard
    ? context.sourceCombatant.cards.find((card) => card.instanceId === context.sourceCard?.instanceId)
    : undefined;
  switch (target) {
    case "SELF":
      return sourceCard && kind !== "FREEZE" ? [sourceCard] : [];
    case "ADJACENT_ALLY":
      if (!sourceCard || kind !== "HASTE") return [];
      return context.sourceCombatant.cards
        .filter((card) => card.instanceId !== sourceCard.instanceId)
        .filter((card) => Math.abs(card.slotIndex - sourceCard.slotIndex) === 1)
        .sort(compareCards);
    case "OWNER_ALL_CARDS":
      return kind === "HASTE" ? [...context.sourceCombatant.cards].sort(compareCards) : [];
    case "OPPOSITE_ENEMY_CARD":
      if (!sourceCard) return [];
      return context.targetCombatant.cards
        .filter((card) => card.slotIndex === sourceCard.slotIndex)
        .sort(compareCards)
        .slice(0, 1);
    case "ENEMY_LEFTMOST_ACTIVE":
      return [...context.targetCombatant.cards].sort(compareCards).slice(0, 1);
  }
}

function compareCards(left: MutableCardRuntimeState, right: MutableCardRuntimeState): number {
  return left.slotIndex - right.slotIndex || left.instanceId.localeCompare(right.instanceId);
}

function formatStatusForLog(statusName: CardControlStatusName, percent: number | undefined): string {
  if (percent === undefined) {
    return statusName.toLowerCase();
  }
  return `${percent}% ${statusName.toLowerCase()}`;
}
