import { getActiveCardDefinitionsById } from "../content/cards/activeCards.js";
import type { CombatResult, CombatResultSummary, ReplayTimeline } from "../model/result.js";
import { RunManager } from "../run/RunManager.js";

export interface SampleCombatReplayExport {
  readonly combatResult: CombatResult;
  readonly replayTimeline: ReplayTimeline;
  readonly combatResultSummary: CombatResultSummary;
  readonly combatLog: readonly string[];
}

export function createSampleCombatReplayExport(seed = "debug-sample-combat"): SampleCombatReplayExport {
  const cardDefinitionsById = getActiveCardDefinitionsById();
  const manager = RunManager.createNewRun(seed, cardDefinitionsById);
  const shopChoice = manager.state.currentChoices.find((choice) => choice.type === "SHOP_CARD");
  if (!shopChoice) {
    throw new Error("Sample run could not find a starter shop card.");
  }
  manager.chooseShopOption(shopChoice.id);
  manager.leaveShop();
  const eventChoice = manager.state.currentChoices.find((choice) => choice.type === "EVENT_CARD" || choice.type === "EVENT_GOLD");
  if (!eventChoice) {
    throw new Error("Sample run could not find a starter event choice.");
  }
  manager.chooseEventOption(eventChoice.id);
  const activeCard = manager.state.ownedCards.find((card) => cardDefinitionsById.get(card.definitionId)?.type === "ACTIVE");
  if (!activeCard) {
    throw new Error("Sample run could not find an active card.");
  }
  const placement = manager.moveCardFromChestToFormation(activeCard.instanceId, 1);
  if (!placement.ok) {
    throw new Error(placement.error ?? "Sample run could not place active card.");
  }
  const battle = manager.startBattle();
  if (!battle.ok || !manager.state.pendingCombatResult) {
    throw new Error(battle.error ?? "Sample run could not start battle.");
  }

  return {
    combatResult: manager.state.pendingCombatResult,
    replayTimeline: manager.state.pendingCombatResult.replayTimeline,
    combatResultSummary: manager.state.pendingCombatResult.summary,
    combatLog: manager.state.pendingCombatResult.combatLog
  };
}
