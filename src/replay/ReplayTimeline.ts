import type { ReplayEvent, ReplayTimeline } from "../model/result.js";

const PLAYER_FACING_EVENT_TYPES = new Set<ReplayEvent["type"]>([
  "CombatStarted",
  "CardActivated",
  "DamageDealt",
  "ArmorGained",
  "HpHealed",
  "ArmorBlocked",
  "StatusApplied",
  "StatusTicked",
  "CooldownModified",
  "TriggerFired",
  "CombatEnded",
  "StatusExpired"
]);

export function buildReplayTimeline(events: readonly ReplayEvent[]): ReplayTimeline {
  return {
    events: events
      .map((event, index) => ({ event, index }))
      .filter(({ event }) => PLAYER_FACING_EVENT_TYPES.has(event.type))
      .sort((left, right) => left.event.tick - right.event.tick || left.index - right.index)
      .map(({ event }) => event)
  };
}
