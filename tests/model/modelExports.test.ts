import { describe, expect, it } from "vitest";

import { CARD_SIZES, CARD_TIERS, CARD_TYPES, COMBATANT_KINDS, FORMATION_SLOT_COUNT } from "../../src/index.js";

describe("model exports", () => {
  it("exposes MVP data model constants", () => {
    expect(CARD_TIERS).toContain("BRONZE");
    expect(CARD_TYPES).toContain("ACTIVE");
    expect(CARD_SIZES).toEqual([1, 2]);
    expect(COMBATANT_KINDS).toContain("ASYNC_PLAYER");
    expect(FORMATION_SLOT_COUNT).toBe(4);
  });
});
