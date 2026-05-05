import type { CardDefinition, CardInstance } from "../../model/card.js";
import { getChestCapacity, SELL_PRICES } from "../state/uiState.js";
import { CardView } from "./CardView.js";

export interface ChestPanelProps {
  readonly cards: readonly CardInstance[];
  readonly selectedCardId?: string;
  readonly enchantmentEligibleCardIds?: ReadonlySet<string>;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly formationSlotCount: number;
  readonly chestCapacity?: number;
  readonly ownedCardCount: number;
  readonly onCardClick: (cardInstanceId: string) => void;
  readonly onSell: (cardInstanceId: string) => void;
}

export function ChestPanel(props: ChestPanelProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Chest</h2>
        <span>{props.ownedCardCount}/{props.chestCapacity ?? getChestCapacity(props.formationSlotCount)}</span>
      </div>
      <div className="card-list">
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
    </section>
  );
}
