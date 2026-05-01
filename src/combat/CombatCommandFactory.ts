import type { EffectDefinition } from "../model/card.js";
import type { CombatCommand } from "./commands/CombatCommand.js";
import { ApplyBurnCommand } from "./commands/ApplyBurnCommand.js";
import { DealDamageCommand } from "./commands/DealDamageCommand.js";
import { GainArmorCommand } from "./commands/GainArmorCommand.js";
import { ModifyCooldownCommand } from "./commands/ModifyCooldownCommand.js";
import type { MutableCardRuntimeState, RuntimeCombatant } from "./types.js";

export function createCombatCommands(
  effects: readonly EffectDefinition[],
  sourceCard: MutableCardRuntimeState,
  sourceCombatant: RuntimeCombatant
): CombatCommand[] {
  const commands: CombatCommand[] = [];

  for (const effect of effects) {
    commands.push(...createCombatCommandsForEffect(effect, sourceCard, sourceCombatant));
  }

  return commands;
}

function createCombatCommandsForEffect(
  effect: EffectDefinition,
  sourceCard: MutableCardRuntimeState,
  sourceCombatant: RuntimeCombatant
): CombatCommand[] {
  switch (effect["command"]) {
    case "DealDamage":
      if (typeof effect["amount"] !== "number") {
        return [];
      }
      return [new DealDamageCommand(effect["amount"])];
    case "GainArmor":
      if (typeof effect["amount"] !== "number") {
        return [];
      }
      return [new GainArmorCommand(effect["amount"])];
    case "ApplyBurn":
      if (typeof effect["amount"] !== "number" || typeof effect["durationTicks"] !== "number") {
        return [];
      }
      return [new ApplyBurnCommand(effect["amount"], effect["durationTicks"])];
    case "ModifyCooldown":
      if (typeof effect["amountTicks"] !== "number") {
        return [];
      }
      return createModifyCooldownCommands(effect, sourceCard, sourceCombatant);
    default:
      return [];
  }
}

function createModifyCooldownCommands(
  effect: EffectDefinition,
  sourceCard: MutableCardRuntimeState,
  sourceCombatant: RuntimeCombatant
): CombatCommand[] {
  if (typeof effect["targetCardInstanceId"] === "string") {
    return [new ModifyCooldownCommand(effect["targetCardInstanceId"], effect["amountTicks"] as number)];
  }

  const target = effect["target"];
  if (target === "SELF") {
    return [new ModifyCooldownCommand(sourceCard.instanceId, effect["amountTicks"] as number)];
  }

  if (target === "ADJACENT_ALLY") {
    return sourceCombatant.cards
      .filter((card) => Math.abs(card.slotIndex - sourceCard.slotIndex) === 1)
      .sort((left, right) => left.slotIndex - right.slotIndex || left.instanceId.localeCompare(right.instanceId))
      .map((card) => new ModifyCooldownCommand(card.instanceId, effect["amountTicks"] as number));
  }

  return [];
}
