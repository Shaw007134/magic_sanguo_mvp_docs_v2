import type { CardDefinition } from "../model/card.js";

export const RUN_SELL_PRICES = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 4,
  JADE: 8,
  CELESTIAL: 12
} as const satisfies Record<CardDefinition["tier"], number>;
