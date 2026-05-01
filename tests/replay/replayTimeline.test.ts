import { describe, expect, it } from "vitest";

import { buildReplayTimeline } from "../../src/replay/ReplayTimeline.js";
import { formatTicksAsSeconds } from "../../src/replay/time.js";
import type { ReplayEvent } from "../../src/model/result.js";
import { getMonsterCardDefinitionsById } from "../../src/content/cards/monsterCards.js";
import { formatReplayEvent } from "../../src/ui/presentation/replayDisplay.js";

describe("ReplayTimeline", () => {
  it("orders events by tick while preserving same-tick order", () => {
    const events: ReplayEvent[] = [
      { tick: 3, type: "CombatEnded" },
      { tick: 1, type: "DamageDealt", sourceId: "card-a" },
      { tick: 1, type: "ArmorGained", sourceId: "card-b" },
      { tick: 0, type: "CombatStarted" }
    ];

    expect(buildReplayTimeline(events).events.map((event) => event.type)).toEqual([
      "CombatStarted",
      "DamageDealt",
      "ArmorGained",
      "CombatEnded"
    ]);
  });

  it("keeps stack limit debug detail out of the player-facing timeline", () => {
    const events: ReplayEvent[] = [
      { tick: 0, type: "CombatStarted" },
      { tick: 1, type: "StackLimitReached", payload: { error: "debug-only stack detail" } },
      { tick: 1, type: "CombatEnded" }
    ];

    expect(buildReplayTimeline(events).events.map((event) => event.type)).toEqual([
      "CombatStarted",
      "CombatEnded"
    ]);
  });

  it("formats player-facing ticks as seconds", () => {
    expect(formatTicksAsSeconds(45)).toBe("0.75s");
    expect(formatTicksAsSeconds(60)).toBe("1.00s");
    expect(formatTicksAsSeconds(90)).toBe("1.50s");
  });

  it("formats player-facing replay events without raw tick labels or internal fields", () => {
    const cardsById = getMonsterCardDefinitionsById();
    const text = formatReplayEvent(
      {
        tick: 45,
        type: "DamageDealt",
        sourceId: "card-1",
        payload: {
          amount: 2,
          hpDamage: 2,
          nextTickAt: 105,
          expiresAtTick: 165,
          durationTicks: 120,
          cooldownRemainingTicks: 45,
          command: "DealDamage"
        }
      },
      {
        cardInstancesById: new Map([["card-1", { instanceId: "card-1", definitionId: "rusty-blade" }]]),
        cardDefinitionsById: cardsById
      }
    );

    expect(text).toBe("0.75s: Rusty Blade dealt 2 damage.");
    expect(text).not.toContain("T45");
    expect(text).not.toContain("nextTickAt");
    expect(text).not.toContain("expiresAtTick");
    expect(text).not.toContain("durationTicks");
    expect(text).not.toContain("cooldownRemainingTicks");
  });
});
