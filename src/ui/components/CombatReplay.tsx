import type { ReplayTimeline } from "../../model/result.js";

export interface CombatReplayProps {
  readonly timeline: ReplayTimeline;
}

export function CombatReplay({ timeline }: CombatReplayProps) {
  return (
    <section className="panel replay-panel">
      <div className="panel-heading">
        <h2>Replay</h2>
        <span>{timeline.events.length} events</span>
      </div>
      <ol className="event-list">
        {timeline.events.map((event, index) => (
          <li key={`${event.tick}-${event.type}-${index}`}>
            <span className="event-tick">T{event.tick}</span>
            <strong>{event.type}</strong>
            <span>{formatEventPayload(event.payload)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function formatEventPayload(payload: Readonly<Record<string, unknown>> | undefined): string {
  if (!payload) {
    return "";
  }
  const visibleEntries = Object.entries(payload).filter(([key]) => key !== "enemyFormationId" && key !== "playerFormationId");
  return visibleEntries.map(([key, value]) => `${key}: ${String(value)}`).join(" · ");
}
