import type { CardDefinition, CardInstance } from "../../model/card.js";
import type { UiFormationSlot } from "../state/uiState.js";
import { CardView } from "./CardView.js";

export interface FormationSlotProps {
  readonly slot: UiFormationSlot;
  readonly selectedCardId?: string;
  readonly cardInstancesById: ReadonlyMap<string, CardInstance>;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly onSlotClick: (slotIndex: number, cardInstanceId?: string) => void;
  readonly onRemove: (cardInstanceId: string) => void;
}

export function FormationSlot(props: FormationSlotProps) {
  const card = props.slot.cardInstanceId ? props.cardInstancesById.get(props.slot.cardInstanceId) : undefined;
  const definition = card ? props.cardDefinitionsById.get(card.definitionId) : undefined;

  if (props.slot.lockedByInstanceId) {
    return null;
  }
  const isWide = definition?.size === 2;

  return (
    <div className={`formation-slot${isWide ? " size-two-card" : ""}`} data-size={definition?.size ?? 1}>
      <button
        type="button"
        className="slot-button"
        onClick={() => props.onSlotClick(props.slot.slotIndex, card?.instanceId)}
      >
        <span className="slot-label">Slot {props.slot.slotIndex}</span>
        {card && definition ? (
          <>
            <CardView
              card={card}
              definition={definition}
              selected={props.selectedCardId === card.instanceId}
              compact
            />
            {isWide ? <span className="footprint-label">Size 2</span> : null}
          </>
        ) : (
          <span className="empty-slot-label">Empty</span>
        )}
      </button>
      {card ? (
        <button className="secondary-action" type="button" onClick={() => props.onRemove(card.instanceId)}>
          Remove
        </button>
      ) : null}
    </div>
  );
}
