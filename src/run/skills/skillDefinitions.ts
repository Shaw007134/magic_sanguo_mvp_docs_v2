import type { Modifier } from "../../combat/modifiers/Modifier.js";
import type { SkillDefinition, SkillInstance } from "./Skill.js";
import mvpSkillsJson from "../../../data/skills/mvp_skills.json" with { type: "json" };

export const SKILL_DEFINITIONS = mvpSkillsJson as readonly SkillDefinition[];

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
