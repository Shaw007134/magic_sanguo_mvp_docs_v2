import type { CardDefinition, CardInstance } from "../../model/card.js";
import type { ReplayTimeline } from "../../model/result.js";
import { formatReplayEvent } from "../presentation/replayDisplay.js";

export interface CombatReplayProps {
  readonly timeline: ReplayTimeline;
  readonly cardInstancesById: ReadonlyMap<string, CardInstance>;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
}

export function CombatReplay({ timeline, cardInstancesById, cardDefinitionsById }: CombatReplayProps) {
  return (
    <section className="panel replay-panel">
      <div className="panel-heading">
        <h2>Replay</h2>
        <span>{timeline.events.length} events</span>
      </div>
      <ol className="event-list">
        {timeline.events.map((event, index) => (
          <li key={`${event.tick}-${event.type}-${index}`}>
            {formatReplayEvent(event, { cardInstancesById, cardDefinitionsById })}
          </li>
        ))}
      </ol>
    </section>
  );
}
