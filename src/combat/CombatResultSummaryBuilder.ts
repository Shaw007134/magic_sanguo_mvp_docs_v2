import type { CombatContribution, CombatResultSummary, CombatWinner, ReplayTimeline } from "../model/result.js";

export interface CombatResultSummaryInput {
  readonly replayTimeline: ReplayTimeline;
  readonly winner: CombatWinner;
  readonly ticksElapsed: number;
  readonly playerFinalHp: number;
  readonly enemyFinalHp: number;
}

export function buildCombatResultSummary(input: CombatResultSummaryInput): CombatResultSummary {
  const damageByCard: Record<string, number> = {};
  const statusDamage: Record<string, number> = {};
  const statusDamageByCard: Record<string, Record<string, number>> = {};
  const armorGainedByCard: Record<string, number> = {};
  const healingByCard: Record<string, number> = {};
  const activationsByCard: Record<string, number> = {};
  const triggerCountByCard: Record<string, number> = {};
  const critCountByCard: Record<string, number> = {};
  const criticalDamageByCard: Record<string, number> = {};
  let armorBlocked = 0;

  for (const event of input.replayTimeline.events) {
    if (event.type === "CardActivated" && event.sourceId) {
      addToRecord(activationsByCard, event.sourceId, 1);
    }

    if (event.type === "DamageDealt") {
      const hpDamage = readNumber(event.payload?.hpDamage);
      const command = event.payload?.command;
      if (event.sourceId) {
        addToRecord(damageByCard, event.sourceId, hpDamage);
        if (event.payload?.critical === true) {
          addToRecord(critCountByCard, event.sourceId, 1);
          addToRecord(criticalDamageByCard, event.sourceId, hpDamage);
        }
      }
      if (command === "BurnTick" || command === "PoisonTick") {
        const status = command === "PoisonTick" ? "Poison" : "Burn";
        addToRecord(statusDamage, status, hpDamage);
        addStatusDamageByCard(statusDamageByCard, status, event.payload?.statusSourceContributions);
      }
    }

    if (event.type === "HpHealed" && event.sourceId) {
      addToRecord(healingByCard, event.sourceId, readNumber(event.payload?.amount));
    }

    if (event.type === "ArmorGained" && event.sourceId) {
      addToRecord(armorGainedByCard, event.sourceId, readNumber(event.payload?.amount));
    }

    if (event.type === "ArmorBlocked") {
      armorBlocked += readNumber(event.payload?.amount);
    }

    if (event.type === "TriggerFired" && event.sourceId) {
      addToRecord(triggerCountByCard, event.sourceId, 1);
    }
  }

  return {
    winner: input.winner,
    ticksElapsed: input.ticksElapsed,
    playerFinalHp: input.playerFinalHp,
    enemyFinalHp: input.enemyFinalHp,
    damageByCard,
    statusDamage,
    statusDamageByCard,
    armorGainedByCard,
    healingByCard,
    armorBlocked,
    activationsByCard,
    triggerCountByCard,
    critCountByCard,
    criticalDamageByCard,
    topContributors: buildTopContributors(damageByCard, armorGainedByCard, healingByCard, triggerCountByCard)
  };
}

function buildTopContributors(
  damageByCard: Readonly<Record<string, number>>,
  armorGainedByCard: Readonly<Record<string, number>>,
  healingByCard: Readonly<Record<string, number>>,
  triggerCountByCard: Readonly<Record<string, number>>
): readonly CombatContribution[] {
  const sourceIds = new Set([
    ...Object.keys(damageByCard),
    ...Object.keys(armorGainedByCard),
    ...Object.keys(healingByCard),
    ...Object.keys(triggerCountByCard)
  ]);

  return [...sourceIds]
    .map((sourceId) => {
      const damage = damageByCard[sourceId] ?? 0;
      const armorGained = armorGainedByCard[sourceId] ?? 0;
      const healing = healingByCard[sourceId] ?? 0;
      const triggerCount = triggerCountByCard[sourceId] ?? 0;
      return {
        sourceId,
        score: damage + armorGained + healing + triggerCount,
        damage,
        armorGained,
        healing,
        triggerCount
      };
    })
    .sort((left, right) => right.score - left.score || left.sourceId.localeCompare(right.sourceId))
    .slice(0, 3);
}

function addToRecord(record: Record<string, number>, key: string, amount: number): void {
  record[key] = (record[key] ?? 0) + amount;
}

function addStatusDamageByCard(
  record: Record<string, Record<string, number>>,
  status: string,
  value: unknown
): void {
  if (!Array.isArray(value)) {
    return;
  }
  for (const contribution of value) {
    if (!isRecord(contribution) || typeof contribution["sourceCardInstanceId"] !== "string") {
      continue;
    }
    const amount = readNumber(contribution["amount"]);
    if (amount <= 0) {
      continue;
    }
    record[status] ??= {};
    addToRecord(record[status], contribution["sourceCardInstanceId"], amount);
  }
}

function readNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}
