import type { MonsterTemplate } from "./MonsterTemplate.js";

export const MONSTER_TEMPLATES = [
  {
    id: "training-dummy",
    name: "Training Dummy",
    difficulty: "TUTORIAL",
    slotCount: 4,
    maxHp: 18,
    startingArmor: 2,
    requiredCards: [{ cardId: "training-staff", slot: 2 }],
    optionalCards: [],
    defenseStyle: "HP",
    weakness: "Any starter attack can beat it.",
    rewardPool: ["rusty-blade", "wooden-shield"],
    minDay: 1,
    maxDay: 1,
    engine: "None; it repeats one simple slow attack.",
    payoff: "Low direct damage teaches cooldown pacing.",
    fixed: true
  },
  {
    id: "rust-bandit",
    name: "Rust Bandit",
    difficulty: "NORMAL",
    slotCount: 4,
    maxHp: 24,
    startingArmor: 1,
    requiredCards: [{ cardId: "rusty-blade", slot: 1 }],
    optionalCards: [{ cardId: "rusty-blade" }, { cardId: "training-staff" }, { cardId: "wooden-shield" }],
    defenseStyle: "LOW_ARMOR",
    weakness: "Armor gain or faster damage beats repeated small hits.",
    rewardPool: ["rusty-blade", "wooden-shield"],
    minDay: 2,
    maxDay: 4,
    engine: "Fast Rusty Blade attacks start immediately and keep repeating.",
    payoff: "Repeated Physical damage wins if the player cannot stabilize.",
    fixed: false
  },
  {
    id: "burn-apprentice",
    name: "Burn Apprentice",
    difficulty: "NORMAL",
    slotCount: 4,
    maxHp: 22,
    startingArmor: 0,
    requiredCards: [{ cardId: "flame-spear", slot: 2 }],
    optionalCards: [{ cardId: "training-staff" }, { cardId: "wooden-shield" }, { cardId: "rusty-blade" }],
    defenseStyle: "MODERATE_HP",
    weakness: "Burst it down before Burn ticks stack up.",
    rewardPool: ["flame-spear", "fire-echo-seal"],
    minDay: 2,
    maxDay: 5,
    engine: "Flame Spear applies Burn on a repeatable cooldown.",
    payoff: "Burn DOT pressures HP while ignoring Armor.",
    fixed: false
  },
  {
    id: "shield-guard",
    name: "Shield Guard",
    difficulty: "NORMAL",
    slotCount: 4,
    maxHp: 28,
    startingArmor: 4,
    requiredCards: [{ cardId: "wooden-shield", slot: 1 }],
    optionalCards: [{ cardId: "wooden-shield" }, { cardId: "rusty-blade" }, { cardId: "training-staff" }],
    defenseStyle: "ARMOR",
    weakness: "Burn beats it because Burn ignores Armor.",
    rewardPool: ["wooden-shield", "flame-spear"],
    minDay: 3,
    maxDay: 6,
    engine: "Repeated Wooden Shield activations keep Armor coming.",
    payoff: "It outlasts weak direct damage and chips back slowly.",
    fixed: false
  },
  {
    id: "drum-tactician",
    name: "Drum Tactician",
    difficulty: "NORMAL",
    slotCount: 4,
    maxHp: 30,
    startingArmor: 0,
    requiredCards: [
      { cardId: "spark-drum", slot: 2 },
      { cardId: "rusty-blade", slot: 1 }
    ],
    optionalCards: [{ cardId: "flame-spear" }, { cardId: "wooden-shield" }],
    defenseStyle: "MODERATE_HP",
    weakness: "Burst is the MVP answer until disruption exists later.",
    rewardPool: ["spark-drum", "rusty-blade"],
    minDay: 4,
    maxDay: 7,
    engine: "Spark Drum accelerates adjacent ally cooldowns.",
    payoff: "Faster ally activations turn modest cards into a tempo plan.",
    fixed: false
  },
  {
    id: "fire-echo-adept",
    name: "Fire Echo Adept",
    difficulty: "ELITE",
    slotCount: 4,
    maxHp: 34,
    startingArmor: 2,
    requiredCards: [
      { cardId: "fire-echo-seal", slot: 1 },
      { cardId: "flame-spear", slot: 2 }
    ],
    optionalCards: [{ cardId: "wooden-shield" }, { cardId: "rusty-blade" }],
    defenseStyle: "MODERATE_HP",
    weakness: "Burst or enough HP can survive the Burn plus echo window.",
    rewardPool: ["fire-echo-seal", "flame-spear", "spark-drum"],
    minDay: 5,
    maxDay: 8,
    engine: "Flame Spear applies Burn and Fire Echo Seal reacts to the application.",
    payoff: "Burn damage combines with trigger damage for a bigger fire turn.",
    fixed: false
  },
  {
    id: "gate-captain",
    name: "First Boss: Gate Captain",
    difficulty: "BOSS",
    slotCount: 4,
    maxHp: 46,
    startingArmor: 6,
    requiredCards: [
      { cardId: "gate-captain-saber", slot: 1 },
      { cardId: "wooden-shield", slot: 2 },
      { cardId: "spark-drum", slot: 3 }
    ],
    optionalCards: [],
    defenseStyle: "ARMOR_HP",
    weakness: "Balanced damage plus Burn can beat its Armor and HP.",
    rewardPool: ["gate-captain-saber", "spark-drum", "wooden-shield", "flame-spear"],
    minDay: 9,
    maxDay: 9,
    engine: "Mixed weapon, shield, and cooldown support form a stable boss loop.",
    payoff: "Steady direct damage lands while Armor and HP keep the captain alive.",
    fixed: true
  }
] as const satisfies readonly MonsterTemplate[];

export function getMonsterTemplateById(id: string): MonsterTemplate | undefined {
  return MONSTER_TEMPLATES.find((template) => template.id === id);
}

export function getEligibleMonsterTemplates(day: number, difficulty?: MonsterTemplate["difficulty"]): readonly MonsterTemplate[] {
  return MONSTER_TEMPLATES.filter(
    (template) =>
      template.minDay <= day &&
      day <= template.maxDay &&
      (difficulty === undefined || template.difficulty === difficulty)
  );
}
