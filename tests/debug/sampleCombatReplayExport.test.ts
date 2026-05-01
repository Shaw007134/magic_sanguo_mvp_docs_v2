import { describe, expect, it } from "vitest";

import { createSampleCombatReplayExport } from "../../src/debug/sampleCombatReplayExport.js";

describe("sample combat replay export", () => {
  it("returns serializable combat replay debug data", () => {
    const payload = createSampleCombatReplayExport("test-debug-export");
    const serialized = JSON.stringify(payload);

    expect(payload.combatResult.replayTimeline.events.length).toBeGreaterThan(0);
    expect(payload.replayTimeline).toBe(payload.combatResult.replayTimeline);
    expect(payload.combatResultSummary).toBe(payload.combatResult.summary);
    expect(Array.isArray(payload.combatLog)).toBe(true);
    expect(JSON.parse(serialized)).toHaveProperty("combatResult");
  });
});
