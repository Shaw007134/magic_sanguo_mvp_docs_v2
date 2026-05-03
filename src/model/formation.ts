export const COMBATANT_KINDS = ["PLAYER", "MONSTER", "BOSS", "ASYNC_PLAYER"] as const;
export const FORMATION_SLOT_COUNT = 4;
export const MIN_FORMATION_SLOT_INDEX = 1;
export const MAX_FORMATION_SLOT_INDEX = FORMATION_SLOT_COUNT;

export type CombatantKind = (typeof COMBATANT_KINDS)[number];

export interface SkillSnapshot {
  readonly id: string;
  readonly definitionId?: string;
}

export interface RelicSnapshot {
  readonly id: string;
}

export interface AiProfile {
  readonly id: string;
}

export interface FormationSlotSnapshot {
  readonly slotIndex: number;
  readonly cardInstanceId?: string;
  readonly locked?: boolean;
}

export interface FormationSnapshot {
  readonly id: string;
  readonly kind: CombatantKind;
  readonly displayName: string;
  readonly level: number;
  readonly maxHp: number;
  readonly startingArmor: number;
  readonly slots: readonly FormationSlotSnapshot[];
  readonly skills: readonly SkillSnapshot[];
  readonly relics: readonly RelicSnapshot[];
  readonly aiProfile?: AiProfile;
}
