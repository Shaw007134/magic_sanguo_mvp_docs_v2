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

  for (const [index, effect] of (card.effects ?? []).entries()) {
    validateEffect(effect, `effects[${index}]`, errors);
  }

  return createValidationResult(errors);
}

function validateEffect(
  effect: Readonly<Record<string, unknown>>,
  path: string,
  errors: ValidationIssue[]
): void {
  if (effect["command"] === "DealDamage") {
    if (effect["damageType"] !== undefined && !["DIRECT", "PHYSICAL", "FIRE", "POISON"].includes(String(effect["damageType"]))) {
      errors.push({ path: `${path}.damageType`, message: "DealDamage damageType must be DIRECT, PHYSICAL, FIRE, or POISON." });
    }
    if (effect["ignoresArmor"] !== undefined && typeof effect["ignoresArmor"] !== "boolean") {
      errors.push({ path: `${path}.ignoresArmor`, message: "DealDamage ignoresArmor must be a boolean when present." });
    }
  }
  if ((effect["command"] === "ApplyPoison" || effect["command"] === "HealHP") && typeof effect["amount"] !== "number") {
    errors.push({ path: `${path}.amount`, message: `${String(effect["command"])} amount must be a number.` });
  }
  if (effect["command"] === "ApplyPoison" && effect["durationTicks"] !== undefined && typeof effect["durationTicks"] !== "number") {
    errors.push({ path: `${path}.durationTicks`, message: "ApplyPoison durationTicks must be a number when present." });
  }
  if (effect["command"] === "ApplyHaste") {
    validateControlEffect(effect, path, errors, ["SELF", "ADJACENT_ALLY", "OWNER_ALL_CARDS"], true);
  }
  if (effect["command"] === "ApplySlow") {
    validateControlEffect(effect, path, errors, ["SELF", "OPPOSITE_ENEMY_CARD", "ENEMY_LEFTMOST_ACTIVE"], true);
  }
  if (effect["command"] === "ApplyFreeze") {
    validateControlEffect(effect, path, errors, ["OPPOSITE_ENEMY_CARD", "ENEMY_LEFTMOST_ACTIVE"], false);
  }
}

function validateControlEffect(
  effect: Readonly<Record<string, unknown>>,
  path: string,
  errors: ValidationIssue[],
  allowedTargets: readonly string[],
  requiresPercent: boolean
): void {
  if (!allowedTargets.includes(String(effect["target"]))) {
    errors.push({ path: `${path}.target`, message: `${String(effect["command"])} target is invalid.` });
  }
  if (requiresPercent && typeof effect["percent"] !== "number") {
    errors.push({ path: `${path}.percent`, message: `${String(effect["command"])} percent must be a number.` });
  }
  if (effect["durationTicks"] === undefined || typeof effect["durationTicks"] !== "number") {
    errors.push({ path: `${path}.durationTicks`, message: `${String(effect["command"])} durationTicks must be a number.` });
  }
}
