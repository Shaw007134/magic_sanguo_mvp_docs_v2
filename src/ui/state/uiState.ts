import type { CardDefinition, CardInstance } from "../../model/card.js";
import type { FormationSnapshot, FormationSlotSnapshot } from "../../model/formation.js";

export const FORMATION_SLOT_COUNT = 4;

export const SELL_PRICES = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 4,
  JADE: 8,
  CELESTIAL: 12
} as const satisfies Record<CardDefinition["tier"], number>;

export interface UiFormationSlot {
  readonly slotIndex: number;
  readonly cardInstanceId?: string;
  readonly lockedByInstanceId?: string;
}

export interface UiInventoryState {
  readonly gold: number;
  readonly ownedCards: readonly CardInstance[];
  readonly formationSlots: readonly UiFormationSlot[];
}

export function createEmptyFormationSlots(slotCount = FORMATION_SLOT_COUNT): readonly UiFormationSlot[] {
  return Array.from({ length: slotCount }, (_, index) => ({ slotIndex: index + 1 }));
}

export function getChestCapacity(formationSlotCount: number): number {
  return formationSlotCount * 2;
}

export function getPlacedCardIds(formationSlots: readonly UiFormationSlot[]): ReadonlySet<string> {
  return new Set(formationSlots.flatMap((slot) => (slot.cardInstanceId ? [slot.cardInstanceId] : [])));
}

export function getChestCards(state: UiInventoryState): readonly CardInstance[] {
  const placedCardIds = getPlacedCardIds(state.formationSlots);
  return state.ownedCards.filter((card) => !placedCardIds.has(card.instanceId));
}

export function sellCardFromChest(
  state: UiInventoryState,
  cardInstanceId: string,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): UiInventoryState {
  if (getPlacedCardIds(state.formationSlots).has(cardInstanceId)) {
    return state;
  }

  const card = state.ownedCards.find((candidate) => candidate.instanceId === cardInstanceId);
  const definition = card ? cardDefinitionsById.get(card.definitionId) : undefined;
  if (!card || !definition) {
    return state;
  }

  return {
    ...state,
    gold: state.gold + SELL_PRICES[definition.tier],
    ownedCards: state.ownedCards.filter((candidate) => candidate.instanceId !== cardInstanceId)
  };
}

export function moveCardFromChestToFormation(
  state: UiInventoryState,
  cardInstanceId: string,
  slotIndex: number,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): UiInventoryState {
  const card = getChestCards(state).find((candidate) => candidate.instanceId === cardInstanceId);
  const definition = card ? cardDefinitionsById.get(card.definitionId) : undefined;
  if (!card || !definition || !canPlaceCard(state.formationSlots, slotIndex, definition)) {
    return state;
  }

  return {
    ...state,
    formationSlots: placeCard(state.formationSlots, card.instanceId, slotIndex, definition)
  };
}

export function removeCardFromFormation(
  state: UiInventoryState,
  cardInstanceId: string
): UiInventoryState {
  if (!getPlacedCardIds(state.formationSlots).has(cardInstanceId)) {
    return state;
  }

  return {
    ...state,
    formationSlots: clearCardFootprint(state.formationSlots, cardInstanceId)
  };
}

export function moveCardBetweenFormationSlots(
  state: UiInventoryState,
  cardInstanceId: string,
  targetSlotIndex: number,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): UiInventoryState {
  const card = state.ownedCards.find((candidate) => candidate.instanceId === cardInstanceId);
  const definition = card ? cardDefinitionsById.get(card.definitionId) : undefined;
  if (!card || !definition || !getPlacedCardIds(state.formationSlots).has(cardInstanceId)) {
    return state;
  }

  const clearedSlots = clearCardFootprint(state.formationSlots, cardInstanceId);
  if (!canPlaceCard(clearedSlots, targetSlotIndex, definition)) {
    return state;
  }

  return {
    ...state,
    formationSlots: placeCard(clearedSlots, cardInstanceId, targetSlotIndex, definition)
  };
}

export function createFormationSnapshotFromUi(input: {
  readonly id: string;
  readonly displayName: string;
  readonly maxHp: number;
  readonly startingArmor: number;
  readonly formationSlots: readonly UiFormationSlot[];
}): FormationSnapshot {
  return {
    id: input.id,
    kind: "PLAYER",
    displayName: input.displayName,
    level: 1,
    maxHp: input.maxHp,
    startingArmor: input.startingArmor,
    slots: input.formationSlots.map(toFormationSlot),
    skills: [],
    relics: []
  };
}

function canPlaceCard(
  formationSlots: readonly UiFormationSlot[],
  slotIndex: number,
  cardDefinition: CardDefinition
): boolean {
  const slot = formationSlots[slotIndex - 1];
  if (!slot || slot.cardInstanceId || slot.lockedByInstanceId) {
    return false;
  }

  if (cardDefinition.size === 1) {
    return true;
  }

  const nextSlot = formationSlots[slotIndex];
  return nextSlot !== undefined && !nextSlot.cardInstanceId && !nextSlot.lockedByInstanceId;
}

function placeCard(
  formationSlots: readonly UiFormationSlot[],
  cardInstanceId: string,
  slotIndex: number,
  cardDefinition: CardDefinition
): readonly UiFormationSlot[] {
  return formationSlots.map((slot) => {
    if (slot.slotIndex === slotIndex) {
      return { slotIndex: slot.slotIndex, cardInstanceId };
    }
    if (cardDefinition.size === 2 && slot.slotIndex === slotIndex + 1) {
      return { slotIndex: slot.slotIndex, lockedByInstanceId: cardInstanceId };
    }
    return slot;
  });
}

function clearCardFootprint(
  formationSlots: readonly UiFormationSlot[],
  cardInstanceId: string
): readonly UiFormationSlot[] {
  return formationSlots.map((slot) => {
    if (slot.cardInstanceId === cardInstanceId || slot.lockedByInstanceId === cardInstanceId) {
      return { slotIndex: slot.slotIndex };
    }
    return slot;
  });
}

function toFormationSlot(slot: UiFormationSlot): FormationSlotSnapshot {
  if (slot.cardInstanceId) {
    return {
      slotIndex: slot.slotIndex,
      cardInstanceId: slot.cardInstanceId
    };
  }
  if (slot.lockedByInstanceId) {
    return {
      slotIndex: slot.slotIndex,
      locked: true
    };
  }
  return {
    slotIndex: slot.slotIndex
  };
}
