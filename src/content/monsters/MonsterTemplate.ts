export type MonsterDifficulty = "TUTORIAL" | "NORMAL" | "ELITE" | "BOSS";

export type MonsterDefenseStyle = "HP" | "LOW_ARMOR" | "ARMOR" | "MODERATE_HP" | "ARMOR_HP";

export interface MonsterTemplateCardChoice {
  readonly cardId: string;
  readonly slot?: number;
}

export interface MonsterTemplate {
  readonly id: string;
  readonly name: string;
  readonly difficulty: MonsterDifficulty;
  readonly slotCount: number;
  readonly maxHp: number;
  readonly startingArmor: number;
  readonly requiredCards: readonly MonsterTemplateCardChoice[];
  readonly optionalCards: readonly MonsterTemplateCardChoice[];
  readonly minOptionalCards?: number;
  readonly maxOptionalCards?: number;
  readonly defenseStyle: MonsterDefenseStyle;
  readonly weakness: string;
  readonly rewardPool: readonly string[];
  readonly minDay: number;
  readonly maxDay: number;
  readonly engine: string;
  readonly payoff: string;
  readonly fixed: boolean;
}
