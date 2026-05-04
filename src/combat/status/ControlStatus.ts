import type { StatusSourceAttribution } from "./StatusEffect.js";

export type CardControlStatusKind = "HASTE" | "SLOW" | "FREEZE";
export type CardControlStatusName = "Haste" | "Slow" | "Freeze";

export interface CardControlStatus extends StatusSourceAttribution {
  readonly kind: CardControlStatusKind;
  readonly appliedAtTick: number;
  expiresAtTick: number;
  readonly percent?: number;
}

export function getControlStatusName(kind: CardControlStatusKind): CardControlStatusName {
  switch (kind) {
    case "HASTE":
      return "Haste";
    case "SLOW":
      return "Slow";
    case "FREEZE":
      return "Freeze";
  }
}
