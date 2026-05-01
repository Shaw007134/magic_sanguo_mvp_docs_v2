export class CombatLog {
  readonly #entries: string[] = [];

  add(entry: string): void {
    this.#entries.push(entry);
  }

  toArray(): readonly string[] {
    return [...this.#entries];
  }
}
