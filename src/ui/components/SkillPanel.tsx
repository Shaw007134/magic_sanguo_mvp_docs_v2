import type { SkillInstance } from "../../run/skills/Skill.js";
import { getSkillDefinitionsById } from "../../run/skills/skillDefinitions.js";

export interface SkillPanelProps {
  readonly skills: readonly SkillInstance[];
}

export function SkillPanel({ skills }: SkillPanelProps) {
  const skillDefinitionsById = getSkillDefinitionsById();
  return (
    <section className="panel skill-panel">
      <div className="panel-heading">
        <h2>Skills</h2>
        <span>{skills.length}</span>
      </div>
      {skills.length === 0 ? (
        <p className="empty-slot-label">No skills yet</p>
      ) : (
        <div className="skill-list">
          {skills.map((skill) => {
            const definition = skillDefinitionsById.get(skill.definitionId);
            return definition ? (
              <article className="skill-card" key={skill.instanceId}>
                <strong>{definition.name}</strong>
                <span className="choice-meta">{definition.tier}</span>
                <p>{definition.description}</p>
              </article>
            ) : null;
          })}
        </div>
      )}
    </section>
  );
}
