import type { CombatSide } from "./types.js";

export function getOpposingSide(side: CombatSide): CombatSide {
  return side === "PLAYER" ? "ENEMY" : "PLAYER";
}
