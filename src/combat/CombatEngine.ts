import type { CardDefinition, CardInstance, CardRuntimeState, EffectDefinition } from "../model/card.js";
import type { FormationSnapshot } from "../model/formation.js";
import type { CombatResult, CombatWinner, ReplayEvent } from "../model/result.js";
import { CombatLog } from "./CombatLog.js";
import { isReady, recoverCooldown, resetCooldown } from "./CooldownSystem.js";
import { getOpposingSide } from "./TargetingSystem.js";

export const LOGIC_TICKS_PER_SECOND = 60;
export const DEFAULT_MAX_COMBAT_TICKS = 3600;

export type CombatSide = "PLAYER" | "ENEMY";

export interface CombatEngineInput {
  readonly playerFormation: FormationSnapshot;
  readonly enemyFormation: FormationSnapshot;
  readonly cardInstancesById: ReadonlyMap<string, CardInstance>;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly maxCombatTicks?: number;
  readonly sidePriority?: readonly CombatSide[];
  readonly initialCardRuntimeStates?: readonly CardRuntimeState[];
}

interface RuntimeCombatant {
  readonly side: CombatSide;
  readonly formation: FormationSnapshot;
  hp: number;
  cards: CardRuntimeState[];
}

interface ReadyCard {
  readonly readyTick: number;
  readonly side: CombatSide;
  readonly card: CardRuntimeState;
}

interface DealDamageEffect {
  readonly command: "DealDamage";
  readonly amount: number;
}

export class CombatEngine {
  simulate(input: CombatEngineInput): CombatResult {
    const maxCombatTicks = input.maxCombatTicks ?? DEFAULT_MAX_COMBAT_TICKS;
    const sidePriority = input.sidePriority ?? (["PLAYER", "ENEMY"] as const);
    const replayEvents: ReplayEvent[] = [];
    const combatLog = new CombatLog();
    const combatants = {
      PLAYER: createRuntimeCombatant("PLAYER", input.playerFormation, input),
      ENEMY: createRuntimeCombatant("ENEMY", input.enemyFormation, input)
    } satisfies Record<CombatSide, RuntimeCombatant>;

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

        for (const effect of cardDefinition.effects ?? []) {
          const dealDamage = parseDealDamageEffect(effect);
          if (!dealDamage) {
            continue;
          }

          const damage = Math.max(0, dealDamage.amount);
          target.hp = Math.max(0, target.hp - damage);
          replayEvents.push({
            tick,
            type: "DAMAGE_DEALT",
            sourceId: readyCard.card.instanceId,
            targetId: target.formation.id,
            payload: {
              amount: damage,
              targetSide,
              targetHp: target.hp
            }
          });
          combatLog.add(
            `${tick}: ${cardDefinition.name} dealt ${damage} damage to ${target.formation.displayName}.`
          );

          const defeatWinner = getDefeatWinner(combatants);
          if (defeatWinner) {
            return createCombatResult(defeatWinner, tick, combatants, combatLog, replayEvents);
          }
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
  const cards: CardRuntimeState[] = [];

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
    const runtimeCard: CardRuntimeState = {
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
    cards
  };
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

function parseDealDamageEffect(effect: EffectDefinition): DealDamageEffect | undefined {
  if (effect["command"] !== "DealDamage" || typeof effect["amount"] !== "number") {
    return undefined;
  }

  return {
    command: "DealDamage",
    amount: effect["amount"]
  };
}

function updateCard(combatant: RuntimeCombatant, updatedCard: CardRuntimeState): void {
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
