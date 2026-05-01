import type { CardDefinition, CardInstance } from "../model/card.js";
import {
  COMBATANT_KINDS,
  MAX_FORMATION_SLOT_INDEX,
  MIN_FORMATION_SLOT_INDEX,
  type FormationSnapshot
} from "../model/formation.js";
import { createValidationResult, type ValidationIssue, type ValidationResult } from "./validationResult.js";

export interface FormationValidationContext {
  readonly cardInstancesById?: ReadonlyMap<string, CardInstance>;
  readonly cardDefinitionsById?: ReadonlyMap<string, CardDefinition>;
}

export function validateFormationSnapshot(
  formation: FormationSnapshot,
  context: FormationValidationContext = {}
): ValidationResult {
  const errors: ValidationIssue[] = [];

  if (!COMBATANT_KINDS.includes(formation.kind)) {
    errors.push({ path: "kind", message: `Formation kind must be one of: ${COMBATANT_KINDS.join(", ")}.` });
  }

  if (formation.maxHp <= 0) {
    errors.push({ path: "maxHp", message: "Formation maxHp must be greater than 0." });
  }

  const seenSlotIndexes = new Set<number>();

  for (const [arrayIndex, slot] of formation.slots.entries()) {
    const path = `slots[${arrayIndex}].slotIndex`;

    if (seenSlotIndexes.has(slot.slotIndex)) {
      errors.push({ path, message: `Formation slot index ${slot.slotIndex} is duplicated.` });
    }
    seenSlotIndexes.add(slot.slotIndex);

    if (slot.slotIndex < MIN_FORMATION_SLOT_INDEX || slot.slotIndex > MAX_FORMATION_SLOT_INDEX) {
      errors.push({
        path,
        message: `Formation slot index must be between ${MIN_FORMATION_SLOT_INDEX} and ${MAX_FORMATION_SLOT_INDEX}.`
      });
    }
  }

  validateSizeTwoCardsFit(formation, context, errors);

  return createValidationResult(errors);
}

function validateSizeTwoCardsFit(
  formation: FormationSnapshot,
  context: FormationValidationContext,
  errors: ValidationIssue[]
): void {
  if (!context.cardInstancesById || !context.cardDefinitionsById) {
    return;
  }

  const occupiedSlots = new Set(formation.slots.map((slot) => slot.slotIndex));

  for (const [arrayIndex, slot] of formation.slots.entries()) {
    if (!slot.cardInstanceId) {
      continue;
    }

    const cardInstance = context.cardInstancesById.get(slot.cardInstanceId);
    if (!cardInstance) {
      continue;
    }

    const cardDefinition = context.cardDefinitionsById.get(cardInstance.definitionId);
    if (!cardDefinition || cardDefinition.size !== 2) {
      continue;
    }

    const rightSlotIndex = slot.slotIndex + 1;
    if (rightSlotIndex > MAX_FORMATION_SLOT_INDEX || !occupiedSlots.has(rightSlotIndex)) {
      errors.push({
        path: `slots[${arrayIndex}].cardInstanceId`,
        message: `Size 2 card ${cardInstance.instanceId} must fit in adjacent slots.`
      });
    }
  }
}
