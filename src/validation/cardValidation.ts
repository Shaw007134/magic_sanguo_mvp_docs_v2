import { CARD_CATEGORIES, CARD_SIZES, CARD_TIERS, CARD_TYPES, type CardDefinition } from "../model/card.js";
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

  if (card.categories !== undefined) {
    if (!Array.isArray(card.categories)) {
      errors.push({ path: "categories", message: "Card categories must be an array when present." });
    } else {
      for (const [index, category] of card.categories.entries()) {
        if (!CARD_CATEGORIES.includes(category)) {
          errors.push({
            path: `categories[${index}]`,
            message: `Card category must be one of: ${CARD_CATEGORIES.join(", ")}.`
          });
        }
      }
    }
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
  for (const [index, trigger] of (card.triggers ?? []).entries()) {
    validateTrigger(trigger, `triggers[${index}]`, errors);
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

function validateTrigger(
  trigger: Readonly<Record<string, unknown>>,
  path: string,
  errors: ValidationIssue[]
): void {
  if (
    ![
      "OnCombatStart",
      "OnCardActivated",
      "OnDamageDealt",
      "OnDamageTaken",
      "OnStatusApplied",
      "OnStatusTicked",
      "OnBurnTick",
      "OnHealReceived",
      "OnCooldownModified",
      "OnCombatEnd"
    ].includes(String(trigger["hook"]))
  ) {
    errors.push({ path: `${path}.hook`, message: "Trigger hook is invalid." });
  }
  if (
    (trigger["hook"] === "OnStatusTicked" || trigger["hook"] === "OnHealReceived") &&
    (typeof trigger["internalCooldownTicks"] !== "number" || trigger["internalCooldownTicks"] <= 0)
  ) {
    errors.push({ path: `${path}.internalCooldownTicks`, message: `${String(trigger["hook"])} internalCooldownTicks must be a positive number.` });
  }
  if (trigger["maxTriggersPerTick"] !== undefined && (typeof trigger["maxTriggersPerTick"] !== "number" || trigger["maxTriggersPerTick"] <= 0)) {
    errors.push({ path: `${path}.maxTriggersPerTick`, message: "maxTriggersPerTick must be a positive number when present." });
  }
  if (trigger["conditions"] !== undefined) {
    validateTriggerConditions(trigger["conditions"], `${path}.conditions`, errors);
  }
  if (Array.isArray(trigger["effects"])) {
    for (const [index, effect] of trigger["effects"].entries()) {
      if (isRecord(effect)) {
        validateEffect(effect, `${path}.effects[${index}]`, errors);
      }
    }
  }
}

function validateTriggerConditions(value: unknown, path: string, errors: ValidationIssue[]): void {
  if (!isRecord(value)) {
    errors.push({ path, message: "Trigger conditions must be an object." });
    return;
  }
  if (value["status"] !== undefined && value["status"] !== "Burn" && value["status"] !== "Poison") {
    errors.push({ path: `${path}.status`, message: "Trigger status must be Burn or Poison." });
  }
  if (value["targetHasStatus"] !== undefined && value["targetHasStatus"] !== "Burn" && value["targetHasStatus"] !== "Poison") {
    errors.push({ path: `${path}.targetHasStatus`, message: "targetHasStatus must be Burn or Poison." });
  }
  if (value["ownerHasStatus"] !== undefined && value["ownerHasStatus"] !== "Burn" && value["ownerHasStatus"] !== "Poison") {
    errors.push({ path: `${path}.ownerHasStatus`, message: "ownerHasStatus must be Burn or Poison." });
  }
  for (const booleanKey of ["appliedByOwner", "cardIsAdjacent"]) {
    if (value[booleanKey] !== undefined && typeof value[booleanKey] !== "boolean") {
      errors.push({ path: `${path}.${booleanKey}`, message: `${booleanKey} must be a boolean.` });
    }
  }
  for (const numberKey of ["ownerHpBelowPercent", "targetHpBelowPercent", "healedAmountAtLeast"]) {
    if (value[numberKey] !== undefined && typeof value[numberKey] !== "number") {
      errors.push({ path: `${path}.${numberKey}`, message: `${numberKey} must be a number.` });
    }
  }
  if (value["sourceHasTag"] !== undefined && typeof value["sourceHasTag"] !== "string") {
    errors.push({ path: `${path}.sourceHasTag`, message: "sourceHasTag must be a string." });
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}
