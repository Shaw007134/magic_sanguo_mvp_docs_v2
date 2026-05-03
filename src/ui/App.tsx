import { useMemo, useState } from "react";
import { getMonsterCardDefinitionsById } from "../content/cards/monsterCards.js";
import type { CardDefinition, CardInstance } from "../model/card.js";
import type { CombatResult } from "../model/result.js";
import { createBattleEnemy } from "../run/nodes/BattleNode.js";
import { RunManager } from "../run/RunManager.js";
import type { RunActionResult, RunChoice, RunState } from "../run/RunState.js";
import { ChestPanel } from "./components/ChestPanel.js";
import { ChoiceCard } from "./components/ChoiceCard.js";
import { CombatReplay } from "./components/CombatReplay.js";
import { EnemyPreview } from "./components/EnemyPreview.js";
import { FormationEditor } from "./components/FormationEditor.js";
import { ResultSummary } from "./components/ResultSummary.js";
import { RunStatusBar } from "./components/RunStatusBar.js";
import { SkillPanel } from "./components/SkillPanel.js";

type Selection =
  | { readonly kind: "CHEST"; readonly cardInstanceId: string }
  | { readonly kind: "FORMATION"; readonly cardInstanceId: string }
  | undefined;

export function App() {
  const cardDefinitionsById = useMemo(() => getMonsterCardDefinitionsById(), []);
  const [manager, setManager] = useState(() => RunManager.createNewRun("ui-mvp-run", cardDefinitionsById));
  const [runState, setRunState] = useState<RunState>(() => manager.state);
  const [selection, setSelection] = useState<Selection>();
  const [message, setMessage] = useState("Start a run from nothing. First stop: get a card.");
  const [showCombatLog, setShowCombatLog] = useState(false);

  const chestCards = manager.getChestCards();
  const selectedHint = getSelectedHint(selection, runState.ownedCards);
  const combatResult = runState.pendingCombatResult ?? runState.pendingBattleResult;
  const battlePreview = useMemo(() => {
    if (runState.currentNode.type !== "BATTLE") {
      return undefined;
    }
    return runState.currentEnemySnapshot
      ? {
          formation: runState.currentEnemySnapshot,
          cardInstances: runState.currentEnemyCardInstances ?? []
        }
      : createBattleEnemy({
          node: runState.currentNode,
          seed: runState.seed,
          cardDefinitionsById
        });
  }, [cardDefinitionsById, runState.currentEnemyCardInstances, runState.currentEnemySnapshot, runState.currentNode, runState.seed]);

  function sync(result: RunActionResult, fallbackMessage: string): void {
    setRunState({ ...manager.state });
    setMessage(result.ok ? (result.message ?? fallbackMessage) : (result.error ?? "Action failed."));
  }

  function handleNewRun(): void {
    const next = RunManager.createNewRun("ui-mvp-run", cardDefinitionsById);
    setManager(next);
    setRunState({ ...next.state });
    setSelection(undefined);
    setMessage("New run started.");
  }

  function handleChestCardClick(cardInstanceId: string): void {
    setSelection({ kind: "CHEST", cardInstanceId });
  }

  function handleFormationSlotClick(slotIndex: number, cardInstanceId?: string): void {
    if (selection?.kind === "CHEST") {
      sync(
        manager.moveCardFromChestToFormation(selection.cardInstanceId, slotIndex),
        "Card placed."
      );
      setSelection(undefined);
      return;
    }

    if (selection?.kind === "FORMATION") {
      sync(
        manager.moveCardBetweenFormationSlots(selection.cardInstanceId, slotIndex),
        "Card moved."
      );
      setSelection(undefined);
      return;
    }

    if (cardInstanceId) {
      setSelection({ kind: "FORMATION", cardInstanceId });
    }
  }

  function handleRemoveFromFormation(cardInstanceId: string): void {
    sync(manager.removeCardFromFormationToChest(cardInstanceId), "Card returned to chest.");
    setSelection(undefined);
  }

  function handleSell(cardInstanceId: string): void {
    sync(manager.sellCardFromChest(cardInstanceId), "Card sold.");
    setSelection(undefined);
  }

  function handleChoice(choice: RunChoice): void {
    const result =
      choice.type === "SHOP_CARD"
        ? manager.chooseShopOption(choice.id)
        : choice.type.startsWith("EVENT")
          ? manager.chooseEventOption(choice.id)
          : choice.type.startsWith("REWARD")
            ? manager.chooseRewardOption(choice.id)
            : manager.chooseLevelUpReward(choice.id);
    sync(result, "Choice resolved.");
  }

  function handleStartBattle(): void {
    sync(manager.startBattle(), "Battle resolved. Review the result, then continue.");
  }

  function handleCompleteBattle(): void {
    sync(manager.completeBattle(), "Battle completed.");
  }

  function handleContinue(): void {
    sync(manager.advanceToNextNode(), "Advanced.");
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1>Magic Sanguo</h1>
          <p>{runState.currentNode.label}</p>
        </div>
        <RunStatusBar state={runState} />
        <button className="secondary-action" type="button" onClick={handleNewRun}>
          New Run
        </button>
      </header>

      <section className="encounter-layout">
        {battlePreview ? (
          <EnemyPreview monster={battlePreview} cardDefinitionsById={cardDefinitionsById} />
        ) : null}

        <section className="battle-action-bar">
          <div>
            <h2>{runState.currentNode.type.replaceAll("_", " ")}</h2>
            <p>{message}</p>
          </div>
          <div className="selection-hint">{selectedHint}</div>
          <NodeActions
            state={runState}
            combatResult={combatResult}
            cardDefinitionsById={cardDefinitionsById}
            onChoice={handleChoice}
            onStartBattle={handleStartBattle}
            onCompleteBattle={handleCompleteBattle}
            onLeaveShop={() => sync(manager.leaveShop(), "Left shop.")}
            onContinue={handleContinue}
          />
        </section>

        <FormationEditor
          slots={runState.formationSlots}
          selectedCardId={selection?.kind === "FORMATION" ? selection.cardInstanceId : undefined}
          cardInstancesById={toCardInstanceMap(runState.ownedCards)}
          cardDefinitionsById={cardDefinitionsById}
          onSlotClick={handleFormationSlotClick}
          onRemove={handleRemoveFromFormation}
        />
        <SkillPanel skills={runState.ownedSkills} />
        <ChestPanel
          cards={chestCards}
          selectedCardId={selection?.kind === "CHEST" ? selection.cardInstanceId : undefined}
          cardDefinitionsById={cardDefinitionsById}
          formationSlotCount={runState.formationSlotCount}
          ownedCardCount={runState.ownedCards.length}
          onCardClick={handleChestCardClick}
          onSell={handleSell}
        />
      </section>

      {combatResult ? (
        <section className="post-combat">
          <CombatReplay
            timeline={combatResult.replayTimeline}
            cardInstancesById={toCardInstanceMap([
              ...runState.ownedCards,
              ...(runState.currentEnemyCardInstances ?? [])
            ])}
            cardDefinitionsById={cardDefinitionsById}
          />
          <ResultSummary
            summary={combatResult.summary}
            cardInstancesById={toCardInstanceMap([
              ...runState.ownedCards,
              ...(runState.currentEnemyCardInstances ?? [])
            ])}
            cardDefinitionsById={cardDefinitionsById}
          />
          <div className="dev-log">
            <label>
              <input
                type="checkbox"
                checked={showCombatLog}
                onChange={(event) => setShowCombatLog(event.target.checked)}
              />
              Dev CombatLog
            </label>
            {showCombatLog ? (
              <ol>
                {combatResult.combatLog.map((entry, index) => (
                  <li key={`${entry}-${index}`}>{entry}</li>
                ))}
              </ol>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function NodeActions(props: {
  readonly state: RunState;
  readonly combatResult?: CombatResult;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly onChoice: (choice: RunChoice) => void;
  readonly onStartBattle: () => void;
  readonly onCompleteBattle: () => void;
  readonly onLeaveShop: () => void;
  readonly onContinue: () => void;
}) {
  if (props.state.status !== "IN_PROGRESS") {
    return <div className="run-result">{props.state.status === "VICTORY" ? "Victory" : "Defeat"}</div>;
  }
  if (props.state.currentChoices.length > 0) {
    return (
      <div className="choice-area">
        {props.state.currentNode.type === "REWARD" && props.state.pendingRewardSource ? (
          <div className="reward-reveal">
            <strong>Victory</strong>
            <span>Defeated: {props.state.pendingRewardSource.defeatedMonsterName ?? "Enemy"}</span>
            <span>Dropped reward choices</span>
          </div>
        ) : null}
        {props.state.currentNode.type === "LEVEL_UP_REWARD" ? (
          <div className="reward-reveal">
            <strong>Level Up!</strong>
            <span>Choose one reward</span>
          </div>
        ) : null}
        <div className="choice-list">
          {props.state.currentChoices.map((choice) => (
            <ChoiceCard
              key={choice.id}
              choice={choice}
              cardDefinitionsById={props.cardDefinitionsById}
              onChoose={props.onChoice}
              disabled={choice.type === "SHOP_CARD" && choice.purchased === true}
            />
          ))}
        </div>
        {props.state.currentNode.type === "SHOP" ? (
          <button className="primary-action" type="button" onClick={props.onLeaveShop}>
            Leave Shop
          </button>
        ) : null}
      </div>
    );
  }
  if (props.state.currentNode.type === "BATTLE") {
    return props.combatResult ? (
      <button className="primary-action" type="button" onClick={props.onCompleteBattle}>
        Continue
      </button>
    ) : (
      <button className="primary-action" type="button" onClick={props.onStartBattle}>
        Start Battle
      </button>
    );
  }
  return (
    <button className="primary-action" type="button" onClick={props.onContinue}>
      Continue
    </button>
  );
}

function toCardInstanceMap(cards: readonly CardInstance[]): ReadonlyMap<string, CardInstance> {
  return new Map(cards.map((card) => [card.instanceId, card]));
}

function getSelectedHint(selection: Selection, ownedCards: readonly CardInstance[]): string {
  if (!selection) {
    return "Select a card to place or move.";
  }
  const card = ownedCards.find((candidate) => candidate.instanceId === selection.cardInstanceId);
  if (!card) {
    return "Selected card is unavailable.";
  }
  return selection.kind === "CHEST" ? `Placing ${card.definitionId}` : `Moving ${card.definitionId}`;
}
