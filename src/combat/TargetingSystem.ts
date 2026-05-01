import type { CombatSide } from "./CombatEngine.js";

export function getOpposingSide(side: CombatSide): CombatSide {
  return side === "PLAYER" ? "ENEMY" : "PLAYER";
}
