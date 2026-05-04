import type { CardDefinition, CardInstance } from "../../model/card.js";
import type { ReplayEvent } from "../../model/result.js";
import { formatTicksAsSeconds } from "../../replay/time.js";

export interface ReplayDisplayContext {
  readonly cardInstancesById: ReadonlyMap<string, CardInstance>;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
}

export function formatReplayEvent(event: ReplayEvent, context: ReplayDisplayContext): string {
  const time = formatTicksAsSeconds(event.tick);
  const sourceName = getSourceName(event, context);
  const payload = event.payload ?? {};

  switch (event.type) {
    case "CombatStarted":
      return `${time}: Combat started.`;
    case "CardActivated":
      return `${time}: ${sourceName} activated.`;
    case "DamageDealt":
      return `${time}: ${sourceName} dealt ${getNumber(payload, "hpDamage", "amount")} damage${payload["critical"] === true ? " with a critical hit" : ""}.`;
    case "ArmorGained":
      return `${time}: ${sourceName} gained ${getNumber(payload, "amount")} Armor.`;
    case "HpHealed":
      return `${time}: ${sourceName} healed ${getNumber(payload, "amount")} HP.`;
    case "ArmorBlocked":
      return `${time}: Armor blocked ${getNumber(payload, "amount")} damage.`;
    case "StatusApplied":
      return `${time}: ${getStatusName(payload)} applied.`;
    case "StatusTicked":
      return `${time}: ${getStatusName(payload)} dealt ${getNumber(payload, "amount")} damage.`;
    case "CooldownModified":
      return `${time}: ${sourceName} reduced cooldown.`;
    case "TriggerFired":
      return `${time}: ${sourceName} triggered.`;
    case "CombatEnded":
      return `${time}: Combat ended. Winner: ${formatWinner(payload["winner"])}.`;
    case "StatusExpired":
      return `${time}: ${getStatusName(payload)} expired.`;
    case "StackLimitReached":
      return `${time}: Debug stack limit reached.`;
  }
}

function getSourceName(event: ReplayEvent, context: ReplayDisplayContext): string {
  if (!event.sourceId) {
    const command = event.payload?.["command"];
    return command === "BurnTick" ? "Burn" : command === "PoisonTick" ? "Poison" : "Effect";
  }
  const instance = context.cardInstancesById.get(event.sourceId);
  const definition = instance ? context.cardDefinitionsById.get(instance.definitionId) : undefined;
  return definition?.name ?? event.sourceId;
}

function getNumber(payload: Readonly<Record<string, unknown>>, ...keys: readonly string[]): number {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number") {
      return value;
    }
  }
  return 0;
}

function getStatusName(payload: Readonly<Record<string, unknown>>): string {
  const status = payload["status"] ?? payload["kind"];
  return typeof status === "string" ? status.replaceAll("_", " ") : "Status";
}

function formatWinner(value: unknown): string {
  if (value === "PLAYER") {
    return "Player";
  }
  if (value === "ENEMY") {
    return "Enemy";
  }
  if (value === "DRAW") {
    return "Draw";
  }
  return "Unknown";
}
