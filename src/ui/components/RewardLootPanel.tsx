import type { CardDefinition, CardInstance } from "../../model/card.js";
import type { RewardCardInstance } from "../../model/rewardCard.js";
import type { RunFormationSlot } from "../../run/RunState.js";
import { getRewardCardDefinitionsById } from "../../content/rewards/rewardCards.js";
import { getRewardCardDisplayInfo } from "../presentation/rewardCardDisplay.js";

export interface RewardLootPanelProps {
  readonly rewardCards: readonly RewardCardInstance[];
  readonly ownedCards: readonly CardInstance[];
  readonly formationSlots: readonly RunFormationSlot[];
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly onSell: (rewardCardInstanceId: string) => void;
}

export function RewardLootPanel(props: RewardLootPanelProps) {
  const rewardDefinitionsById = getRewardCardDefinitionsById();
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Reward / Loot</h2>
        <span>{props.rewardCards.length}</span>
      </div>
      <div className="card-list">
        {props.rewardCards.length === 0 ? <p className="empty-copy">No reward cards owned.</p> : null}
        {props.rewardCards.map((rewardCard) => {
          const definition = rewardDefinitionsById.get(rewardCard.definitionId);
          if (!definition) {
            return null;
          }
          const display = getRewardCardDisplayInfo({
            rewardCard: definition,
            formationSlots: props.formationSlots,
            ownedCards: props.ownedCards,
            cardDefinitionsById: props.cardDefinitionsById
          });
          return (
            <div className="loot-card" key={rewardCard.instanceId}>
              <div className="card-view">
                <div className="card-title">{display.title}</div>
                <div className="card-meta">{display.meta.join(" · ")}</div>
                <div className="card-summary">{display.summary}</div>
                {display.targetLine ? <p>{display.targetLine}</p> : null}
              </div>
              <button type="button" onClick={() => props.onSell(rewardCard.instanceId)}>
                Sell
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
