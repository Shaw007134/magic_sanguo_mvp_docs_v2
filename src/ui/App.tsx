import { useMemo, useState } from "react";
import { CombatEngine } from "../combat/CombatEngine.js";
import { getMonsterCardDefinitionsById } from "../content/cards/monsterCards.js";
import { MonsterGenerator, type MonsterGenerationResult } from "../content/monsters/MonsterGenerator.js";
import { getMonsterTemplateById } from "../content/monsters/monsterTemplates.js";
import type { CardInstance } from "../model/card.js";
import type { CombatResult } from "../model/result.js";
import { ChestPanel } from "./components/ChestPanel.js";
import { CombatReplay } from "./components/CombatReplay.js";
import { EnemyPreview } from "./components/EnemyPreview.js";
import { FormationEditor } from "./components/FormationEditor.js";
import { ResultSummary } from "./components/ResultSummary.js";
import { createInitialUiState, PLAYER_MAX_HP } from "./state/initialState.js";
import {
  createFormationSnapshotFromUi,
  getChestCards,
  moveCardBetweenFormationSlots,
  moveCardFromChestToFormation,
  removeCardFromFormation,
  sellCardFromChest,
  type UiInventoryState
} from "./state/uiState.js";

type Selection =
  | { readonly kind: "CHEST"; readonly cardInstanceId: string }
  | { readonly kind: "FORMATION"; readonly cardInstanceId: string }
  | undefined;

export function App() {
  const cardDefinitionsById = useMemo(() => getMonsterCardDefinitionsById(), []);
  const enemy = useMemo(() => createEnemy(), []);
  const [inventory, setInventory] = useState<UiInventoryState>(() => createInitialUiState());
  const [selection, setSelection] = useState<Selection>();
  const [combatResult, setCombatResult] = useState<CombatResult>();
  const [showCombatLog, setShowCombatLog] = useState(false);

  const chestCards = getChestCards(inventory);
  const selectedHint = getSelectedHint(selection, inventory.ownedCards);

  function handleChestCardClick(cardInstanceId: string): void {
    setSelection({ kind: "CHEST", cardInstanceId });
  }

  function handleFormationSlotClick(slotIndex: number, cardInstanceId?: string): void {
    if (selection?.kind === "CHEST") {
      setInventory((current) =>
        moveCardFromChestToFormation(current, selection.cardInstanceId, slotIndex, cardDefinitionsById)
      );
      setSelection(undefined);
      return;
    }

    if (selection?.kind === "FORMATION") {
      setInventory((current) =>
        moveCardBetweenFormationSlots(current, selection.cardInstanceId, slotIndex, cardDefinitionsById)
      );
      setSelection(undefined);
      return;
    }

    if (cardInstanceId) {
      setSelection({ kind: "FORMATION", cardInstanceId });
    }
  }

  function handleRemoveFromFormation(cardInstanceId: string): void {
    setInventory((current) => removeCardFromFormation(current, cardInstanceId));
    setSelection(undefined);
  }

  function handleSell(cardInstanceId: string): void {
    setInventory((current) => sellCardFromChest(current, cardInstanceId, cardDefinitionsById));
    setSelection(undefined);
  }

  function handleStartBattle(): void {
    const playerFormation = createFormationSnapshotFromUi({
      id: "player",
      displayName: "Player",
      maxHp: PLAYER_MAX_HP,
      startingArmor: 0,
      formationSlots: inventory.formationSlots
    });
    const result = new CombatEngine().simulate({
      playerFormation,
      enemyFormation: enemy.formation,
      cardInstancesById: new Map([
        ...inventory.ownedCards.map((card) => [card.instanceId, card] as const),
        ...enemy.cardInstances.map((card) => [card.instanceId, card] as const)
      ]),
      cardDefinitionsById,
      maxCombatTicks: 720
    });
    setCombatResult(result);
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1>Magic Sanguo</h1>
          <p>Phase 10 combat prototype</p>
        </div>
        <div className="gold-display">{inventory.gold} gold</div>
      </header>

      <section className="encounter-layout">
        <EnemyPreview
          monster={enemy}
          cardDefinitionsById={cardDefinitionsById}
        />

        <section className="battle-action-bar">
          <div>
            <h2>Encounter</h2>
            <p>{enemy.formation.displayName}</p>
          </div>
          <div className="selection-hint">{selectedHint}</div>
          <button className="primary-action" type="button" onClick={handleStartBattle}>
            Start Battle
          </button>
        </section>

        <FormationEditor
          slots={inventory.formationSlots}
          selectedCardId={selection?.kind === "FORMATION" ? selection.cardInstanceId : undefined}
          cardInstancesById={toCardInstanceMap(inventory.ownedCards)}
          cardDefinitionsById={cardDefinitionsById}
          onSlotClick={handleFormationSlotClick}
          onRemove={handleRemoveFromFormation}
        />
        <ChestPanel
          cards={chestCards}
          selectedCardId={selection?.kind === "CHEST" ? selection.cardInstanceId : undefined}
          cardDefinitionsById={cardDefinitionsById}
          formationSlotCount={inventory.formationSlots.length}
          ownedCardCount={inventory.ownedCards.length}
          onCardClick={handleChestCardClick}
          onSell={handleSell}
        />
      </section>

      {combatResult ? (
        <section className="post-combat">
          <CombatReplay timeline={combatResult.replayTimeline} />
          <ResultSummary summary={combatResult.summary} />
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

function createEnemy(): MonsterGenerationResult {
  const template = getMonsterTemplateById("rust-bandit");
  if (!template) {
    throw new Error("Missing rust-bandit monster template.");
  }
  return new MonsterGenerator().generate({
    template,
    seed: "phase-10-preview",
    day: 3
  });
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
  return selection.kind === "CHEST"
    ? `Placing ${card.definitionId}`
    : `Moving ${card.definitionId}`;
}
