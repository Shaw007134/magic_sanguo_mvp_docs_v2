import type { CombatResultSummary } from "../../model/result.js";

export interface ResultSummaryProps {
  readonly summary: CombatResultSummary;
}

export function ResultSummary({ summary }: ResultSummaryProps) {
  return (
    <section className="panel summary-panel">
      <div className="panel-heading">
        <h2>Summary</h2>
        <span>{summary.winner}</span>
      </div>
      <div className="summary-grid">
        <div>
          <strong>{summary.ticksElapsed}</strong>
          <span>Ticks</span>
        </div>
        <div>
          <strong>{summary.playerFinalHp}</strong>
          <span>Player HP</span>
        </div>
        <div>
          <strong>{summary.enemyFinalHp}</strong>
          <span>Enemy HP</span>
        </div>
        <div>
          <strong>{summary.armorBlocked}</strong>
          <span>Armor blocked</span>
        </div>
      </div>
      <MetricList title="Damage by card" values={summary.damageByCard} />
      <MetricList title="Status damage" values={summary.statusDamage} />
      <MetricList title="Armor gained" values={summary.armorGainedByCard} />
      <MetricList title="Activations" values={summary.activationsByCard} />
      <MetricList title="Triggers" values={summary.triggerCountByCard} />
    </section>
  );
}

function MetricList({ title, values }: { readonly title: string; readonly values: Readonly<Record<string, number>> }) {
  const entries = Object.entries(values);
  return (
    <div className="metric-list">
      <h3>{title}</h3>
      {entries.length > 0 ? (
        <ul>
          {entries.map(([key, value]) => (
            <li key={key}>
              <span>{key}</span>
              <strong>{value}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>None</p>
      )}
    </div>
  );
}
