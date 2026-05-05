import type { CardDefinition, CardInstance } from "../../model/card.js";
import type { RewardCardInstance } from "../../model/rewardCard.js";
import type { RunFormationSlot } from "../../run/RunState.js";
import { getRewardCardDefinitionsById } from "../../content/rewards/rewardCards.js";
import { getRewardCardDisplayInfo } from "../presentation/rewardCardDisplay.js";
import { getChestCapacity, SELL_PRICES } from "../state/uiState.js";
import { CardView } from "./CardView.js";

export interface ChestPanelProps {
  readonly cards: readonly CardInstance[];
  readonly rewardCards?: readonly RewardCardInstance[];
  readonly ownedCards?: readonly CardInstance[];
  readonly formationSlots?: readonly RunFormationSlot[];
  readonly selectedCardId?: string;
  readonly enchantmentEligibleCardIds?: ReadonlySet<string>;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly formationSlotCount: number;
  readonly chestCapacity?: number;
  readonly ownedCardCount: number;
  readonly onCardClick: (cardInstanceId: string) => void;
  readonly onSell: (cardInstanceId: string) => void;
  readonly onSellRewardCard?: (rewardCardInstanceId: string) => void;
}

export function ChestPanel(props: ChestPanelProps) {
  const rewardCards = props.rewardCards ?? [];
  const rewardDefinitionsById = getRewardCardDefinitionsById();
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Chest</h2>
        <span>
          {props.ownedCardCount}/{props.chestCapacity ?? getChestCapacity(props.formationSlotCount)}
          {rewardCards.length > 0 ? ` · ${rewardCards.length} loot` : ""}
        </span>
      </div>
      <div className="card-list">
        {props.cards.length === 0 ? <p className="empty-copy">No cards in chest.</p> : null}
        {props.cards.map((card) => {
          const definition = props.cardDefinitionsById.get(card.definitionId);
          if (!definition) {
            return null;
          }
          const selected = props.selectedCardId === card.instanceId;
          return (
            <div className="card-actions" key={card.instanceId}>
              <CardView
                card={card}
                definition={definition}
                selected={selected}
                enchantmentEligible={props.enchantmentEligibleCardIds?.has(card.instanceId) ?? false}
                onClick={() => props.onCardClick(card.instanceId)}
              />
              {selected ? (
                <button type="button" onClick={() => props.onSell(card.instanceId)}>
                  Sell · {SELL_PRICES[definition.tier]}g
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {rewardCards.length > 0 ? (
        <div className="loot-section">
          <div className="panel-subheading">
            <h3>Loot Cards</h3>
            <span>Sell for gold or a leftmost-card enhancement</span>
          </div>
          <div className="card-list">
            {rewardCards.map((rewardCard) => {
              const definition = rewardDefinitionsById.get(rewardCard.definitionId);
              if (!definition) {
                return null;
              }
              const display = getRewardCardDisplayInfo({
                rewardCard: definition,
                formationSlots: props.formationSlots ?? [],
                ownedCards: props.ownedCards ?? [],
                cardDefinitionsById: props.cardDefinitionsById
              });
              return (
                <div className="loot-card" key={rewardCard.instanceId}>
                  <div className="card-view loot-card-view">
                    <div className="card-title">{display.title}</div>
                    <div className="card-meta">{display.meta.join(" · ")}</div>
                    <div className="card-summary">{display.summary}</div>
                    {display.targetLine ? <p>{display.targetLine}</p> : null}
                  </div>
                  <button type="button" onClick={() => props.onSellRewardCard?.(rewardCard.instanceId)}>
                    Sell
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
