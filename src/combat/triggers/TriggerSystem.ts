import type { CardDefinition, CardInstance, CardRuntimeState } from "../../model/card.js";
import type { CombatLog } from "../CombatLog.js";
import { createCombatCommands } from "../CombatCommandFactory.js";
import type { MutableCardRuntimeState, RuntimeCombatant } from "../types.js";
import { TriggeredCombatCommand } from "./TriggeredCombatCommand.js";
import type { PassiveTriggerDefinition, TriggerHook } from "./TriggerDefinition.js";
import type { TriggerRuntimeState } from "./TriggerRuntimeState.js";
import type { ReplayEvent } from "../../model/result.js";
import type { ResolutionStack } from "../ResolutionStack.js";

export interface TriggerEvent {
  readonly hook: TriggerHook;
  readonly tick: number;
  readonly sourceCard?: CardRuntimeState;
  readonly sourceCardDefinition?: CardDefinition;
  readonly sourceCombatant?: RuntimeCombatant;
  readonly targetCombatant?: RuntimeCombatant;
  readonly status?: "Burn";
  readonly triggerDepth?: number;
}

export interface TriggerSystemInput {
  readonly combatants: readonly RuntimeCombatant[];
  readonly cardInstancesById: ReadonlyMap<string, CardInstance>;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly resolutionStack: ResolutionStack;
  readonly combatLog: CombatLog;
  readonly replayEvents: ReplayEvent[];
}

export class TriggerSystem {
  readonly #triggers: TriggerRuntimeState[];
  readonly #combatants: readonly RuntimeCombatant[];
  readonly #resolutionStack: ResolutionStack;
  readonly #combatLog: CombatLog;
  readonly #replayEvents: ReplayEvent[];

  constructor(input: TriggerSystemInput) {
    this.#triggers = createTriggerRuntimeStates(input.combatants, input.cardInstancesById, input.cardDefinitionsById);
    this.#combatants = input.combatants;
    this.#resolutionStack = input.resolutionStack;
    this.#combatLog = input.combatLog;
    this.#replayEvents = input.replayEvents;
  }

  fire(event: TriggerEvent): void {
    const eligibleTriggers = this.#triggers
      .filter((triggerState) => canFireTrigger(triggerState, event))
      .sort(compareTriggerRuntimeStates);
    const commandsToPush: TriggeredCombatCommand[] = [];

    for (const triggerState of eligibleTriggers) {
      resetTickCounterIfNeeded(triggerState, event.tick);

      const maxTriggersPerTick = triggerState.trigger.maxTriggersPerTick ?? 1;
      if (triggerState.triggersThisTick >= maxTriggersPerTick) {
        continue;
      }

      triggerState.triggersThisTick += 1;
      triggerState.lastTriggeredTick = event.tick;
      this.#combatLog.add(
        `${event.tick}: ${triggerState.sourceCardDefinition.name} triggered ${triggerState.trigger.hook}.`
      );
      this.#replayEvents.push({
        tick: event.tick,
        type: "TriggerFired",
        sourceId: triggerState.sourceCard.instanceId,
        targetId: getOpposingCombatant(triggerState.ownerCombatant, this.#combatants).formation.id,
        payload: {
          hook: triggerState.trigger.hook,
          triggerId: triggerState.id
        }
      });

      // MVP restriction: OnCombatEnd can report that a trigger matched, but it must not mutate final combat state.
      if (event.hook === "OnCombatEnd") {
        continue;
      }

      const targetCombatant = getOpposingCombatant(triggerState.ownerCombatant, this.#combatants);
      const commands = createCombatCommands(
        triggerState.trigger.effects ?? [],
        triggerState.sourceCard,
        triggerState.ownerCombatant
      ).map(
        (command) =>
          new TriggeredCombatCommand(
            command,
            triggerState.sourceCard,
            triggerState.sourceCardDefinition,
            triggerState.ownerCombatant,
            targetCombatant,
            (event.triggerDepth ?? 0) + 1
          )
      );

      commandsToPush.push(...commands);
    }

    for (const command of commandsToPush.reverse()) {
      this.#resolutionStack.push(command);
    }
  }
}

function createTriggerRuntimeStates(
  combatants: readonly RuntimeCombatant[],
  cardInstancesById: ReadonlyMap<string, CardInstance>,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): TriggerRuntimeState[] {
  const triggerStates: TriggerRuntimeState[] = [];

  for (const combatant of combatants) {
    for (const slot of [...combatant.formation.slots].sort((left, right) => left.slotIndex - right.slotIndex)) {
      if (!slot.cardInstanceId) {
        continue;
      }

      const cardInstance = cardInstancesById.get(slot.cardInstanceId);
      if (!cardInstance) {
        continue;
      }

      const cardDefinition = cardDefinitionsById.get(cardInstance.definitionId);
      if (!cardDefinition || cardDefinition.type !== "PASSIVE" || !cardDefinition.triggers) {
        continue;
      }

      const sourceCard: MutableCardRuntimeState = {
        instanceId: cardInstance.instanceId,
        definitionId: cardInstance.definitionId,
        ownerCombatantId: combatant.formation.id,
        slotIndex: slot.slotIndex,
        cooldownMaxTicks: 0,
        cooldownRemainingTicks: 0,
        cooldownRecoveryRate: 0,
        disabled: false,
        silenced: false,
        frozen: false,
        activationCount: 0
      };

      for (const [triggerIndex, trigger] of cardDefinition.triggers.entries()) {
        const parsedTrigger = parseTriggerDefinition(trigger);
        if (!parsedTrigger) {
          continue;
        }

        triggerStates.push({
          id: `${cardInstance.instanceId}:${triggerIndex}`,
          ownerCombatant: combatant,
          sourceCard,
          sourceCardDefinition: cardDefinition,
          trigger: parsedTrigger,
          triggersThisTick: 0
        });
      }
    }
  }

  return triggerStates.sort(compareTriggerRuntimeStates);
}

function parseTriggerDefinition(trigger: unknown): PassiveTriggerDefinition | undefined {
  if (!trigger || typeof trigger !== "object") {
    return undefined;
  }

  const candidate = trigger as PassiveTriggerDefinition;
  if (!isTriggerHook(candidate.hook)) {
    return undefined;
  }

  return candidate;
}

function isTriggerHook(hook: unknown): hook is TriggerHook {
  return (
    hook === "OnCombatStart" ||
    hook === "OnCardActivated" ||
    hook === "OnDamageDealt" ||
    hook === "OnDamageTaken" ||
    hook === "OnStatusApplied" ||
    hook === "OnBurnTick" ||
    hook === "OnCooldownModified" ||
    hook === "OnCombatEnd"
  );
}

function canFireTrigger(triggerState: TriggerRuntimeState, event: TriggerEvent): boolean {
  if (triggerState.trigger.hook !== event.hook) {
    return false;
  }

  const internalCooldownTicks = triggerState.trigger.internalCooldownTicks ?? 0;
  if (
    triggerState.lastTriggeredTick !== undefined &&
    event.tick - triggerState.lastTriggeredTick < internalCooldownTicks
  ) {
    return false;
  }

  return conditionsPass(triggerState, event);
}

function conditionsPass(triggerState: TriggerRuntimeState, event: TriggerEvent): boolean {
  const conditions = triggerState.trigger.conditions;
  if (!conditions) {
    return true;
  }

  if (conditions.status !== undefined && conditions.status !== event.status) {
    return false;
  }

  if (conditions.appliedByOwner !== undefined) {
    if (event.hook === "OnBurnTick") {
      return false;
    }

    const appliedByOwner = event.sourceCombatant?.formation.id === triggerState.ownerCombatant.formation.id;
    if (conditions.appliedByOwner !== appliedByOwner) {
      return false;
    }
  }

  if (
    conditions.sourceHasTag !== undefined &&
    !event.sourceCardDefinition?.tags.includes(conditions.sourceHasTag)
  ) {
    return false;
  }

  if (conditions.cardIsAdjacent !== undefined) {
    const adjacent =
      event.sourceCard !== undefined &&
      event.sourceCombatant?.formation.id === triggerState.ownerCombatant.formation.id &&
      Math.abs(event.sourceCard.slotIndex - triggerState.sourceCard.slotIndex) === 1;
    if (conditions.cardIsAdjacent !== adjacent) {
      return false;
    }
  }

  if (
    conditions.ownerHpBelowPercent !== undefined &&
    !isHpBelowPercent(triggerState.ownerCombatant, conditions.ownerHpBelowPercent)
  ) {
    return false;
  }

  if (
    conditions.targetHpBelowPercent !== undefined &&
    (!event.targetCombatant || !isHpBelowPercent(event.targetCombatant, conditions.targetHpBelowPercent))
  ) {
    return false;
  }

  return true;
}

function isHpBelowPercent(combatant: RuntimeCombatant, percent: number): boolean {
  const normalizedPercent = percent > 1 ? percent / 100 : percent;
  return combatant.hp / combatant.formation.maxHp < normalizedPercent;
}

function resetTickCounterIfNeeded(triggerState: TriggerRuntimeState, tick: number): void {
  if (triggerState.currentTick !== tick) {
    triggerState.currentTick = tick;
    triggerState.triggersThisTick = 0;
  }
}

function compareTriggerRuntimeStates(left: TriggerRuntimeState, right: TriggerRuntimeState): number {
  return (
    left.ownerCombatant.side.localeCompare(right.ownerCombatant.side) ||
    left.sourceCard.slotIndex - right.sourceCard.slotIndex ||
    left.sourceCard.instanceId.localeCompare(right.sourceCard.instanceId) ||
    left.id.localeCompare(right.id)
  );
}

function getOpposingCombatant(owner: RuntimeCombatant, combatants: readonly RuntimeCombatant[]): RuntimeCombatant {
  return combatants.find((combatant) => combatant.side !== owner.side) ?? owner;
}
