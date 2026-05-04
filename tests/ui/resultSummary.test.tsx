import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getMonsterCardDefinitionsById } from "../../src/content/cards/monsterCards.js";
import type { CombatResultSummary } from "../../src/model/result.js";
import { ResultSummary } from "../../src/ui/components/ResultSummary.js";

const cardDefinitionsById = getMonsterCardDefinitionsById();

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
    expect(html).not.toContain("run-card-1");
    expect(html).not.toContain("training-dummy:training-staff:1");
    expect(html).not.toContain("Training Staff</span><strong>0</strong>");
  });
});
