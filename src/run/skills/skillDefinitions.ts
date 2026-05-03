import type { Modifier } from "../../combat/modifiers/Modifier.js";
import type { SkillDefinition, SkillInstance } from "./Skill.js";

export const SKILL_DEFINITIONS = [
  {
    id: "weapon-drill",
    name: "Weapon Drill",
    tier: "BRONZE",
    description: "Weapon cards deal +1 damage.",
    modifierTemplates: [
      {
        hook: "BeforeDealDamage",
        priority: 10,
        condition: { sourceHasTag: "weapon" },
        operation: { type: "ADD_DAMAGE", value: 1 }
      }
    ]
  },
  {
    id: "fire-study",
    name: "Fire Study",
    tier: "BRONZE",
    description: "Fire damage is multiplied by 1.25.",
    modifierTemplates: [
      {
        hook: "BeforeDealDamage",
        priority: 20,
        condition: { damageType: "FIRE" },
        operation: { type: "MULTIPLY_DAMAGE", value: 1.25 }
      }
    ]
  },
  {
    id: "lasting-embers",
    name: "Lasting Embers",
    tier: "SILVER",
    description: "Burn lasts 1 second longer.",
    modifierTemplates: [
      {
        hook: "OnStatusApplied",
        priority: 10,
        condition: { always: true },
        operation: { type: "ADD_STATUS_DURATION", value: 60 }
      }
    ]
  },
  {
    id: "quick-hands",
    name: "Quick Hands",
    tier: "SILVER",
    description: "Cooldowns recover 25% faster.",
    modifierTemplates: [
      {
        hook: "BeforeCooldownRecover",
        priority: 10,
        condition: { always: true },
        operation: { type: "MULTIPLY_COOLDOWN_RECOVERY_RATE", value: 1.25 }
      }
    ]
  }
] as const satisfies readonly SkillDefinition[];

export function getSkillDefinitionsById(): ReadonlyMap<string, SkillDefinition> {
  return new Map(SKILL_DEFINITIONS.map((skill) => [skill.id, skill]));
}

export function createSkillModifiers(input: {
  readonly ownedSkills: readonly SkillInstance[];
  readonly skillDefinitionsById?: ReadonlyMap<string, SkillDefinition>;
  readonly ownerId: string;
}): readonly Modifier[] {
  const skillDefinitionsById = input.skillDefinitionsById ?? getSkillDefinitionsById();
  return input.ownedSkills.flatMap((skill) => {
    const definition = skillDefinitionsById.get(skill.definitionId);
    if (!definition) {
      return [];
    }
    return definition.modifierTemplates.map((template, index) => ({
      id: `${skill.instanceId}:modifier:${index}`,
      sourceId: skill.instanceId,
      ownerId: input.ownerId,
      hook: template.hook,
      priority: template.priority,
      condition: template.condition,
      operation: template.operation
    }));
  });
}
