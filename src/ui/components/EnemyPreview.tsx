import type { MonsterGenerationResult } from "../../content/monsters/MonsterGenerator.js";
import type { CardDefinition } from "../../model/card.js";

export interface EnemyPreviewProps {
  readonly monster: MonsterGenerationResult;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
}

export function EnemyPreview({ monster, cardDefinitionsById }: EnemyPreviewProps) {
  const instancesById = new Map(monster.cardInstances.map((card) => [card.instanceId, card]));

  return (
    <section className="panel enemy-panel">
      <div className="panel-heading">
        <h2>Enemy</h2>
        <span>{monster.formation.displayName}</span>
      </div>
      <div className="enemy-stats">
        <span>{monster.formation.maxHp} HP</span>
        <span>{monster.formation.startingArmor} Armor</span>
      </div>
      <div className="formation-grid">
        {monster.formation.slots.map((slot) => {
          const instance = slot.cardInstanceId ? instancesById.get(slot.cardInstanceId) : undefined;
          const definition = instance ? cardDefinitionsById.get(instance.definitionId) : undefined;
          if (slot.locked) {
            return (
              <div className="formation-slot locked" key={slot.slotIndex}>
                <span>Slot {slot.slotIndex}</span>
                <strong>Size 2 footprint</strong>
              </div>
            );
          }
          return (
            <div className="enemy-slot" key={slot.slotIndex}>
              <span>Slot {slot.slotIndex}</span>
              {definition ? (
                <>
                  <strong>{definition.name}</strong>
                  <small>Size {definition.size}</small>
                  <p>{definition.description}</p>
                </>
              ) : (
                <em>Empty</em>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
