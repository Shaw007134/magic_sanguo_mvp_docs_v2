import { CARD_SIZES, CARD_TIERS, CARD_TYPES, type CardDefinition } from "../model/card.js";
import { createValidationResult, type ValidationIssue, type ValidationResult } from "./validationResult.js";

export function validateCardDefinition(card: CardDefinition): ValidationResult {
  const errors: ValidationIssue[] = [];

  if (card.id.trim().length === 0) {
    errors.push({ path: "id", message: "Card id must be non-empty." });
  }

  if (!CARD_TIERS.includes(card.tier)) {
    errors.push({ path: "tier", message: `Card tier must be one of: ${CARD_TIERS.join(", ")}.` });
  }

  if (!CARD_TYPES.includes(card.type)) {
    errors.push({ path: "type", message: `Card type must be one of: ${CARD_TYPES.join(", ")}.` });
  }

  if (!CARD_SIZES.includes(card.size)) {
    errors.push({ path: "size", message: "Card size must be 1 or 2." });
  }

  if (card.type === "ACTIVE" && (card.cooldownTicks === undefined || card.cooldownTicks <= 0)) {
    errors.push({ path: "cooldownTicks", message: "Active cards must have cooldownTicks greater than 0." });
  }

  if (card.type === "PASSIVE" && (!card.triggers || card.triggers.length === 0)) {
    errors.push({ path: "triggers", message: "Passive cards must have at least one trigger." });
  }

  return createValidationResult(errors);
}
