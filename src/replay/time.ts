const LOGIC_TICKS_PER_SECOND = 60;

export function formatTicksAsSeconds(ticks: number): string {
  return `${(ticks / LOGIC_TICKS_PER_SECOND).toFixed(2)}s`;
}
