import type { CardDefinition, CardInstance } from "../../model/card.js";
import type { UiFormationSlot } from "../state/uiState.js";
import { FormationSlot } from "./FormationSlot.js";

export interface FormationEditorProps {
  readonly slots: readonly UiFormationSlot[];
  readonly selectedCardId?: string;
  readonly cardInstancesById: ReadonlyMap<string, CardInstance>;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly onSlotClick: (slotIndex: number, cardInstanceId?: string) => void;
  readonly onRemove: (cardInstanceId: string) => void;
}

export function FormationEditor(props: FormationEditorProps) {
  return (
    <section className="panel formation-panel">
      <div className="panel-heading">
        <h2>Formation</h2>
        <span>{props.slots.length} slots</span>
      </div>
      <div className="formation-grid">
        {props.slots.map((slot) => (
          <FormationSlot
            key={slot.slotIndex}
            slot={slot}
            selectedCardId={props.selectedCardId}
            cardInstancesById={props.cardInstancesById}
            cardDefinitionsById={props.cardDefinitionsById}
            onSlotClick={props.onSlotClick}
            onRemove={props.onRemove}
          />
        ))}
      </div>
    </section>
  );
}
