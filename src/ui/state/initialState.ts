import type { CardInstance } from "../../model/card.js";
import { createEmptyFormationSlots, type UiInventoryState } from "./uiState.js";

export const INITIAL_GOLD = 10;
export const PLAYER_MAX_HP = 42;

export const INITIAL_OWNED_CARDS: readonly CardInstance[] = [
  { instanceId: "player-rusty-blade", definitionId: "rusty-blade" },
  { instanceId: "player-wooden-shield", definitionId: "wooden-shield" },
  { instanceId: "player-flame-spear", definitionId: "flame-spear" },
  { instanceId: "player-spark-drum", definitionId: "spark-drum" }
];

export function createInitialUiState(): UiInventoryState {
  return {
    gold: INITIAL_GOLD,
    ownedCards: INITIAL_OWNED_CARDS,
    formationSlots: createEmptyFormationSlots()
  };
}
