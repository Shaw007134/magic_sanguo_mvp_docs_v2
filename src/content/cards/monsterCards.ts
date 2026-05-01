import type { CardDefinition } from "../../model/card.js";

export const MONSTER_CARD_DEFINITIONS = [
  {
    id: "training-staff",
    name: "Training Staff",
    tier: "BRONZE",
    type: "ACTIVE",
    size: 1,
    tags: ["weapon", "physical"],
    cooldownTicks: 90,
    effects: [{ command: "DealDamage", amount: 1 }],
    description: "A slow practice strike."
  },
  {
    id: "rusty-blade",
    name: "Rusty Blade",
    tier: "BRONZE",
    type: "ACTIVE",
    size: 1,
    tags: ["weapon", "physical"],
    cooldownTicks: 45,
    effects: [{ command: "DealDamage", amount: 2 }],
    description: "Fast repeated weapon damage."
  },
  {
    id: "flame-spear",
    name: "Flame Spear",
    tier: "BRONZE",
    type: "ACTIVE",
    size: 1,
    tags: ["weapon", "fire"],
    cooldownTicks: 75,
    effects: [
      { command: "DealDamage", amount: 1 },
      { command: "ApplyBurn", amount: 2, durationTicks: 120 }
    ],
    description: "A light hit that starts Burn."
  },
  {
    id: "wooden-shield",
    name: "Wooden Shield",
    tier: "BRONZE",
    type: "ACTIVE",
    size: 1,
    tags: ["armor"],
    cooldownTicks: 60,
    effects: [{ command: "GainArmor", amount: 3 }],
    description: "Basic repeatable armor gain."
  },
  {
    id: "spark-drum",
    name: "Spark Drum",
    tier: "SILVER",
    type: "ACTIVE",
    size: 2,
    tags: ["support"],
    cooldownTicks: 90,
    effects: [{ command: "ModifyCooldown", target: "ADJACENT_ALLY", amountTicks: -30 }],
    description: "A large support card that speeds adjacent allies."
  },
  {
    id: "fire-echo-seal",
    name: "Fire Echo Seal",
    tier: "SILVER",
    type: "PASSIVE",
    size: 1,
    tags: ["fire", "seal"],
    triggers: [
      {
        hook: "OnStatusApplied",
        conditions: { status: "Burn", appliedByOwner: true },
        maxTriggersPerTick: 1,
        effects: [{ command: "DealDamage", amount: 1 }]
      }
    ],
    description: "Echoes a small hit when its owner applies Burn."
  },
  {
    id: "gate-captain-saber",
    name: "Gate Captain Saber",
    tier: "SILVER",
    type: "ACTIVE",
    size: 1,
    tags: ["weapon", "physical"],
    cooldownTicks: 60,
    effects: [{ command: "DealDamage", amount: 3 }],
    description: "Steady captain weapon pressure."
  }
] as const satisfies readonly CardDefinition[];

export function getMonsterCardDefinitionsById(): ReadonlyMap<string, CardDefinition> {
  return new Map(MONSTER_CARD_DEFINITIONS.map((card) => [card.id, card]));
}
