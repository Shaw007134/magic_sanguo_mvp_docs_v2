import type { CombatCommand, CombatExecutionContext } from "./commands/CombatCommand.js";

export interface ResolutionStackLimits {
  readonly maxCommandsPerTick: number;
  readonly maxCommandsPerCombat: number;
  readonly maxTriggerDepth: number;
}

export interface ResolutionStackResult {
  readonly ok: boolean;
  readonly resolvedCommands: number;
  readonly error?: string;
}

export const DEFAULT_RESOLUTION_STACK_LIMITS: ResolutionStackLimits = {
  maxCommandsPerTick: 200,
  maxCommandsPerCombat: 20000,
  maxTriggerDepth: 50
};

export class ResolutionStack {
  readonly #limits: ResolutionStackLimits;
  readonly #stack: CombatCommand[] = [];
  #currentTick: number | undefined;
  #commandsResolvedThisTick = 0;
  #commandsResolvedThisCombat = 0;

  constructor(limits: ResolutionStackLimits = DEFAULT_RESOLUTION_STACK_LIMITS) {
    this.#limits = limits;
  }

  push(command: CombatCommand): void {
    this.#stack.push(command);
  }

  get size(): number {
    return this.#stack.length;
  }

  resolve(context: Omit<CombatExecutionContext, "resolutionStack">): ResolutionStackResult {
    if (this.#currentTick !== context.tick) {
      this.#currentTick = context.tick;
      this.#commandsResolvedThisTick = 0;
    }

    let resolvedCommands = 0;

    while (this.#stack.length > 0) {
      const commandDepth = Math.max(context.triggerDepth, this.#stack[this.#stack.length - 1]?.triggerDepth ?? 0);

      if (commandDepth > this.#limits.maxTriggerDepth) {
        return {
          ok: false,
          resolvedCommands,
          error: `ResolutionStack exceeded max trigger depth ${this.#limits.maxTriggerDepth}.`
        };
      }

      if (this.#commandsResolvedThisTick >= this.#limits.maxCommandsPerTick) {
        return {
          ok: false,
          resolvedCommands,
          error: `ResolutionStack exceeded max commands per tick ${this.#limits.maxCommandsPerTick}.`
        };
      }

      if (this.#commandsResolvedThisCombat >= this.#limits.maxCommandsPerCombat) {
        return {
          ok: false,
          resolvedCommands,
          error: `ResolutionStack exceeded max commands per combat ${this.#limits.maxCommandsPerCombat}.`
        };
      }

      const command = this.#stack.pop();
      if (!command) {
        break;
      }

      command.execute({
        ...context,
        triggerDepth: commandDepth,
        resolutionStack: this
      });
      this.#commandsResolvedThisTick += 1;
      this.#commandsResolvedThisCombat += 1;
      resolvedCommands += 1;
    }

    return {
      ok: true,
      resolvedCommands
    };
  }
}
