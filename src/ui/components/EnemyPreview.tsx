import type { MonsterGenerationResult } from "../../content/monsters/MonsterGenerator.js";
import type { CardDefinition } from "../../model/card.js";
import { getCardDisplayInfo } from "../presentation/cardDisplay.js";

export interface EnemyPreviewProps {
  readonly monster: MonsterGenerationResult;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
}

export function EnemyPreview({ monster, cardDefinitionsById }: EnemyPreviewProps) {
  const instancesById = new Map(monster.cardInstances.map((card) => [card.instanceId, card]));

  return (
    <section className="panel enemy-panel">
      <div className="panel-heading">
        <h2>Enemy Formation</h2>
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
            return null;
          }
          const display = definition ? getCardDisplayInfo(definition) : undefined;
          return (
            <div
              className={`enemy-slot${definition?.size === 2 ? " size-two-card" : ""}`}
              data-size={definition?.size ?? 1}
              key={slot.slotIndex}
            >
              <span className="slot-label">Slot {slot.slotIndex}</span>
              {definition && display ? (
                <>
                  <strong>{display.name}</strong>
                  <small>
                    {display.typeLabel} · {display.tier} · size {display.size}
                  </small>
                  <span className="card-summary">{display.summary}</span>
                  <p>{definition.description}</p>
                  {definition.size === 2 ? <span className="footprint-label">Size 2</span> : null}
                </>
              ) : (
                <span className="empty-slot-label">Empty</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
