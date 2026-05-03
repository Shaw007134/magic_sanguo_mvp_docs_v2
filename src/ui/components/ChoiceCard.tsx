import type { CardDefinition } from "../../model/card.js";
import type { RunChoice } from "../../run/RunState.js";
import { getChoiceDisplayInfo } from "../presentation/choiceDisplay.js";

export interface ChoiceCardProps {
  readonly choice: RunChoice;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly onChoose: (choice: RunChoice) => void;
  readonly disabled?: boolean;
}

export function ChoiceCard({ choice, cardDefinitionsById, onChoose, disabled = false }: ChoiceCardProps) {
  const display = getChoiceDisplayInfo(choice, cardDefinitionsById);
  return (
    <button className="choice-card" type="button" onClick={() => onChoose(choice)} disabled={disabled}>
      <span className="choice-subtitle">{display.subtitle}</span>
      <strong>{display.title}</strong>
      {display.meta.length > 0 ? <span className="choice-meta">{display.meta.join(" · ")}</span> : null}
      {display.summary ? <span className="card-summary">{display.summary}</span> : null}
      {disabled ? <span className="choice-meta">Sold out</span> : null}
    </button>
  );
}
