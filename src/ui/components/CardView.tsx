import type { CardDefinition, CardInstance } from "../../model/card.js";
import { getEffectiveCardDefinition } from "../../content/cards/effectiveCardDefinition.js";
import { formatTicksAsSeconds } from "../../replay/time.js";
import { getCardDisplayInfo, getCardEnhancementSummaries, getCardEnchantmentSummary } from "../presentation/cardDisplay.js";

export interface CardViewProps {
  readonly card: CardInstance;
  readonly definition: CardDefinition;
  readonly selected?: boolean;
  readonly enchantmentEligible?: boolean;
  readonly compact?: boolean;
  readonly onClick?: () => void;
}

export function CardView({ card, definition, selected = false, enchantmentEligible = false, compact = false, onClick }: CardViewProps) {
  const effectiveDefinition = getEffectiveCardDefinition(card, definition);
  const display = getCardDisplayInfo(effectiveDefinition);
  const enhancementSummaries = getCardEnhancementSummaries(card);
  const enchantmentSummary = getCardEnchantmentSummary(card);
  const content = (
    <>
      <div className="card-title">{display.name}</div>
      <div className="card-meta">
        {display.typeLabel} · {display.tier} · size {display.size}
        {display.cooldown !== undefined ? ` · ${formatTicksAsSeconds(display.cooldown)}` : ""}
      </div>
      <div className="card-summary">{display.summary}</div>
      {enhancementSummaries.length > 0 ? (
        <div className="card-enhancements">{enhancementSummaries.join(" · ")}</div>
      ) : null}
      {enchantmentSummary ? <div className="card-enhancements">{enchantmentSummary}</div> : null}
      {enchantmentEligible && !enchantmentSummary ? <div className="card-enchantment-eligible">Eligible enchantment target</div> : null}
      {!compact ? <p>{effectiveDefinition.description}</p> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        className={`card-view${selected ? " selected" : ""}${enchantmentEligible ? " enchantment-eligible" : ""}`}
        type="button"
        onClick={onClick}
        aria-pressed={selected}
      >
        {content}
      </button>
    );
  }

  return <div className={`card-view${selected ? " selected" : ""}${enchantmentEligible ? " enchantment-eligible" : ""}`}>{content}</div>;
}
