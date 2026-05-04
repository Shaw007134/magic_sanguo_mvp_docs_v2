import type { CardDefinition, CardInstance } from "../../model/card.js";
import type { CombatResultSummary } from "../../model/result.js";
import { formatTicksAsSeconds } from "../../replay/time.js";

export interface ResultSummaryProps {
  readonly summary: CombatResultSummary;
  readonly cardInstancesById?: ReadonlyMap<string, CardInstance>;
  readonly cardDefinitionsById?: ReadonlyMap<string, CardDefinition>;
}

export function ResultSummary({ summary, cardInstancesById = new Map(), cardDefinitionsById = new Map() }: ResultSummaryProps) {
  const resolveName = (sourceId: string) => resolveSourceName(sourceId, cardInstancesById, cardDefinitionsById);
  return (
    <section className="panel summary-panel">
      <div className="panel-heading">
        <h2>Summary</h2>
        <span>{summary.winner}</span>
      </div>
      <div className="summary-grid">
        <div>
          <strong>{formatTicksAsSeconds(summary.ticksElapsed)}</strong>
          <span>Duration</span>
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
      <MetricList title="Top contributors" values={Object.fromEntries(summary.topContributors.map((entry) => [entry.sourceId, entry.score]))} resolveName={resolveName} />
      <MetricList title="Damage by card" values={summary.damageByCard} resolveName={resolveName} />
      <MetricList title="Status damage" values={summary.statusDamage} resolveName={formatStatusName} />
      <MetricList title="Critical hits" values={summary.critCountByCard ?? {}} resolveName={resolveName} />
      <MetricList title="Critical damage" values={summary.criticalDamageByCard ?? {}} resolveName={resolveName} />
      <MetricList title="Armor gained" values={summary.armorGainedByCard} resolveName={resolveName} />
      <MetricList title="Activations" values={summary.activationsByCard} resolveName={resolveName} />
      <MetricList title="Triggers" values={summary.triggerCountByCard} resolveName={resolveName} />
    </section>
  );
}

function MetricList({
  title,
  values,
  resolveName
}: {
  readonly title: string;
  readonly values: Readonly<Record<string, number>>;
  readonly resolveName: (sourceId: string) => string;
}) {
  const entries = Object.entries(values).filter(([, value]) => value !== 0);
  return (
    <div className="metric-list">
      <h3>{title}</h3>
      {entries.length > 0 ? (
        <ul>
          {entries.map(([key, value]) => (
            <li key={key}>
              <span>{resolveName(key)}</span>
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

function resolveSourceName(
  sourceId: string,
  cardInstancesById: ReadonlyMap<string, CardInstance>,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): string {
  const instance = cardInstancesById.get(sourceId);
  const definition = instance ? cardDefinitionsById.get(instance.definitionId) : undefined;
  return definition?.name ?? sourceId;
}

function formatStatusName(sourceId: string): string {
  return sourceId === "Burn" ? "Burn" : sourceId;
}
