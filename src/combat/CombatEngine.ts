import type { CardDefinition, CardInstance, CardRuntimeState, EffectDefinition } from "../model/card.js";
import type { FormationSnapshot } from "../model/formation.js";
import type { CombatResult, CombatWinner, ReplayEvent } from "../model/result.js";
import { CombatLog } from "./CombatLog.js";
import type { CombatCommand } from "./commands/CombatCommand.js";
import { ApplyBurnCommand } from "./commands/ApplyBurnCommand.js";
import { DealDamageCommand } from "./commands/DealDamageCommand.js";
import { GainArmorCommand } from "./commands/GainArmorCommand.js";
import { ModifyCooldownCommand } from "./commands/ModifyCooldownCommand.js";
import { isReady, recoverCooldown, resetCooldown } from "./CooldownSystem.js";
import { ResolutionStack, type ResolutionStackLimits } from "./ResolutionStack.js";
import { getOpposingSide } from "./TargetingSystem.js";
import type { CombatSide, MutableCardRuntimeState, RuntimeCombatant } from "./types.js";

export const LOGIC_TICKS_PER_SECOND = 60;
export const DEFAULT_MAX_COMBAT_TICKS = 3600;

export interface CombatEngineInput {
  readonly playerFormation: FormationSnapshot;
  readonly enemyFormation: FormationSnapshot;
  readonly cardInstancesById: ReadonlyMap<string, CardInstance>;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly maxCombatTicks?: number;
  readonly sidePriority?: readonly CombatSide[];
  readonly initialCardRuntimeStates?: readonly CardRuntimeState[];
  readonly resolutionStackLimits?: ResolutionStackLimits;
}

interface ReadyCard {
  readonly readyTick: number;
  readonly side: CombatSide;
  readonly card: MutableCardRuntimeState;
}

export class CombatEngine {
  simulate(input: CombatEngineInput): CombatResult {
    const maxCombatTicks = input.maxCombatTicks ?? DEFAULT_MAX_COMBAT_TICKS;
    const sidePriority = input.sidePriority ?? (["PLAYER", "ENEMY"] as const);
    const replayEvents: ReplayEvent[] = [];
    const combatLog = new CombatLog();
    const resolutionStack = new ResolutionStack(input.resolutionStackLimits);
    const combatants: Record<CombatSide, RuntimeCombatant> = {
      PLAYER: createRuntimeCombatant("PLAYER", input.playerFormation, input),
      ENEMY: createRuntimeCombatant("ENEMY", input.enemyFormation, input)
    };

    for (let tick = 1; tick <= maxCombatTicks; tick += 1) {
      const readyCards = recoverCooldownsAndCollectReadyCards(tick, combatants);
      readyCards.sort((a, b) => compareReadyCards(a, b, sidePriority));

      for (const readyCard of readyCards) {
        const source = combatants[readyCard.side];
        const targetSide = getOpposingSide(readyCard.side);
        const target = combatants[targetSide];
        const cardDefinition = input.cardDefinitionsById.get(readyCard.card.definitionId);

        if (!cardDefinition) {
          continue;
        }

        replayEvents.push({
          tick,
          type: "CARD_ACTIVATED",
          sourceId: readyCard.card.instanceId,
          payload: {
            side: readyCard.side,
            slotIndex: readyCard.card.slotIndex,
            definitionId: readyCard.card.definitionId
          }
        });
        combatLog.add(
          `${tick}: ${source.formation.displayName} activated ${cardDefinition.name} in slot ${readyCard.card.slotIndex}.`
        );

        const commands = createCombatCommands(cardDefinition.effects ?? [], readyCard.card, source);
        for (const command of [...commands].reverse()) {
          resolutionStack.push(command);
        }

        const stackResult = resolutionStack.resolve({
          tick,
          sourceCard: readyCard.card,
          sourceCombatant: source,
          targetCombatant: target,
          combatLog,
          replayEvents,
          triggerDepth: 0
        });

        if (!stackResult.ok) {
          combatLog.add(`${tick}: ${stackResult.error}`);
          replayEvents.push({
            tick,
            type: "STACK_LIMIT_REACHED",
            sourceId: readyCard.card.instanceId,
            payload: {
              error: stackResult.error
            }
          });
          return createCombatResult("DRAW", tick, combatants, combatLog, replayEvents);
        }

        const defeatWinner = getDefeatWinner(combatants);
        if (defeatWinner) {
          return createCombatResult(defeatWinner, tick, combatants, combatLog, replayEvents);
        }

        updateCard(source, resetCooldown({ ...readyCard.card, lastActivatedTick: tick }));
      }

      const defeatWinner = getDefeatWinner(combatants);
      if (defeatWinner) {
        return createCombatResult(defeatWinner, tick, combatants, combatLog, replayEvents);
      }
    }

    return createCombatResult(getTimeoutWinner(combatants), maxCombatTicks, combatants, combatLog, replayEvents);
  }
}

function createRuntimeCombatant(
  side: CombatSide,
  formation: FormationSnapshot,
  input: CombatEngineInput
): RuntimeCombatant {
  const initialRuntimeStates = new Map(
    (input.initialCardRuntimeStates ?? []).map((card) => [card.instanceId, card] as const)
  );
  const cards: MutableCardRuntimeState[] = [];

  for (const slot of formation.slots) {
    if (!slot.cardInstanceId) {
      continue;
    }

    const cardInstance = input.cardInstancesById.get(slot.cardInstanceId);
    if (!cardInstance) {
      continue;
    }

    const cardDefinition = input.cardDefinitionsById.get(cardInstance.definitionId);
    if (!cardDefinition || cardDefinition.type !== "ACTIVE" || cardDefinition.cooldownTicks === undefined) {
      continue;
    }

    const explicitRuntimeState = initialRuntimeStates.get(cardInstance.instanceId);
    const runtimeCard: MutableCardRuntimeState = {
      instanceId: cardInstance.instanceId,
      definitionId: cardInstance.definitionId,
      ownerCombatantId: formation.id,
      slotIndex: slot.slotIndex,
      cooldownMaxTicks: explicitRuntimeState?.cooldownMaxTicks ?? cardDefinition.cooldownTicks,
      cooldownRemainingTicks: explicitRuntimeState?.cooldownRemainingTicks ?? cardDefinition.cooldownTicks,
      cooldownRecoveryRate: explicitRuntimeState?.cooldownRecoveryRate ?? 1,
      disabled: explicitRuntimeState?.disabled ?? false,
      silenced: explicitRuntimeState?.silenced ?? false,
      frozen: explicitRuntimeState?.frozen ?? false,
      activationCount: explicitRuntimeState?.activationCount ?? 0
    };

    if (explicitRuntimeState?.lastActivatedTick !== undefined) {
      cards.push({
        ...runtimeCard,
        lastActivatedTick: explicitRuntimeState.lastActivatedTick
      });
    } else {
      cards.push(runtimeCard);
    }
  }

  cards.sort((a, b) => a.slotIndex - b.slotIndex || a.instanceId.localeCompare(b.instanceId));

  return {
    side,
    formation,
    hp: formation.maxHp,
    armor: formation.startingArmor,
    cards
  };
}

function createCombatCommands(
  effects: readonly EffectDefinition[],
  sourceCard: MutableCardRuntimeState,
  sourceCombatant: RuntimeCombatant
): CombatCommand[] {
  const commands: CombatCommand[] = [];

  for (const effect of effects) {
    commands.push(...createCombatCommandsForEffect(effect, sourceCard, sourceCombatant));
  }

  return commands;
}

function createCombatCommandsForEffect(
  effect: EffectDefinition,
  sourceCard: MutableCardRuntimeState,
  sourceCombatant: RuntimeCombatant
): CombatCommand[] {
  switch (effect["command"]) {
    case "DealDamage":
      if (typeof effect["amount"] !== "number") {
        return [];
      }
      return [new DealDamageCommand(effect["amount"])];
    case "GainArmor":
      if (typeof effect["amount"] !== "number") {
        return [];
      }
      return [new GainArmorCommand(effect["amount"])];
    case "ApplyBurn":
      if (typeof effect["amount"] !== "number" || typeof effect["durationTicks"] !== "number") {
        return [];
      }
      return [new ApplyBurnCommand(effect["amount"], effect["durationTicks"])];
    case "ModifyCooldown":
      if (typeof effect["amountTicks"] !== "number") {
        return [];
      }
      return createModifyCooldownCommands(effect, sourceCard, sourceCombatant);
    default:
      return [];
  }
}

function createModifyCooldownCommands(
  effect: EffectDefinition,
  sourceCard: MutableCardRuntimeState,
  sourceCombatant: RuntimeCombatant
): CombatCommand[] {
  if (typeof effect["targetCardInstanceId"] === "string") {
    return [new ModifyCooldownCommand(effect["targetCardInstanceId"], effect["amountTicks"] as number)];
  }

  const target = effect["target"];
  if (target === "SELF") {
    return [new ModifyCooldownCommand(sourceCard.instanceId, effect["amountTicks"] as number)];
  }

  if (target === "ADJACENT_ALLY") {
    return sourceCombatant.cards
      .filter((card) => Math.abs(card.slotIndex - sourceCard.slotIndex) === 1)
      .sort((left, right) => left.slotIndex - right.slotIndex || left.instanceId.localeCompare(right.instanceId))
      .map((card) => new ModifyCooldownCommand(card.instanceId, effect["amountTicks"] as number));
  }

  return [];
}

function recoverCooldownsAndCollectReadyCards(
  tick: number,
  combatants: Record<CombatSide, RuntimeCombatant>
): ReadyCard[] {
  const readyCards: ReadyCard[] = [];

  for (const side of ["PLAYER", "ENEMY"] as const) {
    const combatant = combatants[side];
    combatant.cards = combatant.cards.map((card) => {
      const recoveredCard = recoverCooldown(card);
      if (isReady(recoveredCard)) {
        readyCards.push({
          readyTick: tick,
          side,
          card: recoveredCard
        });
      }
      return recoveredCard;
    });
  }

  return readyCards;
}

function compareReadyCards(
  left: ReadyCard,
  right: ReadyCard,
  sidePriority: readonly CombatSide[]
): number {
  return (
    left.readyTick - right.readyTick ||
    getSidePriority(left.side, sidePriority) - getSidePriority(right.side, sidePriority) ||
    left.card.slotIndex - right.card.slotIndex ||
    left.card.instanceId.localeCompare(right.card.instanceId)
  );
}

function getSidePriority(side: CombatSide, sidePriority: readonly CombatSide[]): number {
  const priority = sidePriority.indexOf(side);
  return priority === -1 ? Number.MAX_SAFE_INTEGER : priority;
}

function updateCard(combatant: RuntimeCombatant, updatedCard: MutableCardRuntimeState): void {
  combatant.cards = combatant.cards.map((card) =>
    card.instanceId === updatedCard.instanceId ? updatedCard : card
  );
}

function getDefeatWinner(combatants: Record<CombatSide, RuntimeCombatant>): CombatWinner | undefined {
  const playerDefeated = combatants.PLAYER.hp <= 0;
  const enemyDefeated = combatants.ENEMY.hp <= 0;

  if (playerDefeated && enemyDefeated) {
    return "DRAW";
  }
  if (enemyDefeated) {
    return "PLAYER";
  }
  if (playerDefeated) {
    return "ENEMY";
  }
  return undefined;
}

function getTimeoutWinner(combatants: Record<CombatSide, RuntimeCombatant>): CombatWinner {
  const playerHpPercent = combatants.PLAYER.hp / combatants.PLAYER.formation.maxHp;
  const enemyHpPercent = combatants.ENEMY.hp / combatants.ENEMY.formation.maxHp;

  if (playerHpPercent > enemyHpPercent) {
    return "PLAYER";
  }
  if (enemyHpPercent > playerHpPercent) {
    return "ENEMY";
  }
  if (combatants.PLAYER.hp > combatants.ENEMY.hp) {
    return "PLAYER";
  }
  if (combatants.ENEMY.hp > combatants.PLAYER.hp) {
    return "ENEMY";
  }
  return "DRAW";
}

function createCombatResult(
  winner: CombatWinner,
  ticksElapsed: number,
  combatants: Record<CombatSide, RuntimeCombatant>,
  combatLog: CombatLog,
  replayEvents: readonly ReplayEvent[]
): CombatResult {
  const playerFinalHp = combatants.PLAYER.hp;
  const enemyFinalHp = combatants.ENEMY.hp;

  return {
    winner,
    ticksElapsed,
    playerFinalHp,
    enemyFinalHp,
    combatLog: combatLog.toArray(),
    replayTimeline: {
      events: [...replayEvents]
    },
    summary: {
      winner,
      ticksElapsed,
      playerFinalHp,
      enemyFinalHp
    }
  };
}
