import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getActiveCardDefinitionsById } from "../../src/content/cards/activeCards.js";
import type { CombatResultSummary } from "../../src/model/result.js";
import { ResultSummary } from "../../src/ui/components/ResultSummary.js";

const cardDefinitionsById = getActiveCardDefinitionsById();

describe("ResultSummary", () => {
  it("uses readable source names, hides zero rows, and shows top contributors/status damage", () => {
    const summary: CombatResultSummary = {
      winner: "PLAYER",
      ticksElapsed: 120,
      playerFinalHp: 20,
      enemyFinalHp: 0,
      damageByCard: {
        "run-card-1": 5,
        "training-dummy:training-staff:1": 0
      },
      statusDamage: { Burn: 4 },
      statusDamageByCard: { Burn: { "run-card-2": 3 } },
      armorGainedByCard: {},
      healingByCard: { "run-card-3": 2 },
      controlApplicationsByCard: { Haste: { "run-card-4": 1 }, Freeze: { "run-card-5": 2 } },
      armorBlocked: 0,
      activationsByCard: { "run-card-1": 2 },
      triggerCountByCard: {},
      topContributors: [
        {
          sourceId: "run-card-1",
          score: 7,
          damage: 5,
          armorGained: 0,
          triggerCount: 0
        }
      ]
    };
    const html = renderToStaticMarkup(
      <ResultSummary
        summary={summary}
        cardInstancesById={new Map([
          ["run-card-1", { instanceId: "run-card-1", definitionId: "rusty-blade" }],
          ["run-card-2", { instanceId: "run-card-2", definitionId: "flame-spear" }],
          ["run-card-3", { instanceId: "run-card-3", definitionId: "wooden-shield" }],
          ["run-card-4", { instanceId: "run-card-4", definitionId: "war-chant" }],
          ["run-card-5", { instanceId: "run-card-5", definitionId: "frost-chain" }],
          ["training-dummy:training-staff:1", { instanceId: "training-dummy:training-staff:1", definitionId: "training-staff" }]
        ])}
        cardDefinitionsById={cardDefinitionsById}
      />
    );

    expect(html).toContain("Top contributors");
    expect(html).toContain("Rusty Blade");
    expect(html).toContain("Burn");
    expect(html).toContain("Burn damage by card");
    expect(html).toContain("Flame Spear");
    expect(html).toContain("Healing");
    expect(html).toContain("Haste applications");
    expect(html).toContain("Freeze applications");
    expect(html).not.toContain("run-card-1");
    expect(html).not.toContain("training-dummy:training-staff:1");
    expect(html).not.toContain("Training Staff</span><strong>0</strong>");
  });
});
