import type { CardDefinition, CardInstance } from "../../model/card.js";

export interface CardViewProps {
  readonly card: CardInstance;
  readonly definition: CardDefinition;
  readonly selected?: boolean;
  readonly compact?: boolean;
  readonly onClick?: () => void;
}

export function CardView({ card, definition, selected = false, compact = false, onClick }: CardViewProps) {
  const content = (
    <>
      <div className="card-title">{definition.name}</div>
      <div className="card-meta">
        {definition.tier} · size {definition.size}
      </div>
      {!compact ? <p>{definition.description}</p> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        className={`card-view${selected ? " selected" : ""}`}
        type="button"
        onClick={onClick}
        aria-pressed={selected}
      >
        {content}
      </button>
    );
  }

  return <div className={`card-view${selected ? " selected" : ""}`}>{content}</div>;
}
