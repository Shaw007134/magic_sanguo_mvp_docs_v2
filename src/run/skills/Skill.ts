import type { ModifierCondition, ModifierOperation } from "../../combat/modifiers/Modifier.js";
import type { ModifierHook } from "../../combat/modifiers/ModifierHooks.js";
import type { CardTier } from "../../model/card.js";

export interface SkillModifierTemplate {
  readonly hook: ModifierHook;
  readonly priority: number;
  readonly condition: ModifierCondition;
  readonly operation: ModifierOperation;
}

export interface SkillDefinition {
  readonly id: string;
  readonly name: string;
  readonly tier: CardTier;
  readonly description: string;
  readonly modifierTemplates: readonly SkillModifierTemplate[];
}

export interface SkillInstance {
  readonly instanceId: string;
  readonly definitionId: string;
}
