import type { CombatCommand, CombatExecutionContext } from "../commands/CombatCommand.js";
import type { CardDefinition } from "../../model/card.js";
import type { MutableCardRuntimeState, RuntimeCombatant } from "../types.js";

export class TriggeredCombatCommand implements CombatCommand {
  readonly name: string;

  constructor(
    readonly wrappedCommand: CombatCommand,
    readonly sourceCard: MutableCardRuntimeState,
    readonly sourceCardDefinition: CardDefinition,
    readonly sourceCombatant: RuntimeCombatant,
    readonly targetCombatant: RuntimeCombatant,
    readonly triggerDepth: number
  ) {
    this.name = wrappedCommand.name;
  }

  execute(context: CombatExecutionContext): void {
    this.wrappedCommand.execute({
      ...context,
      sourceCard: this.sourceCard,
      sourceCardDefinition: this.sourceCardDefinition,
      sourceCombatant: this.sourceCombatant,
      targetCombatant: this.targetCombatant,
      triggerDepth: this.triggerDepth
    });
  }
}
