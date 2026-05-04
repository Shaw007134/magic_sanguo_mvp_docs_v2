import type { EffectDefinition } from "../model/card.js";
import type { CombatCommand } from "./commands/CombatCommand.js";
import { ApplyBurnCommand } from "./commands/ApplyBurnCommand.js";
import {
  DealDamageCommand,
  type DealDamageConditionalMultiplierDefinition,
  type DealDamageScalingDefinition
} from "./commands/DealDamageCommand.js";
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
      return [new DealDamageCommand(effect["amount"], {
        critChancePercent: readNumber(effect["critChancePercent"]),
        critMultiplier: readNumber(effect["critMultiplier"]),
        scaling: parseScaling(effect["scaling"]),
        conditionalMultiplier: parseConditionalMultiplier(effect["conditionalMultiplier"])
      })];
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

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function parseScaling(value: unknown): DealDamageScalingDefinition | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const source = value["source"];
  const percent = value["percent"];
  if (
    (source === "OWNER_ARMOR_PERCENT" ||
      source === "OWNER_MAX_HP_PERCENT" ||
      source === "TARGET_MISSING_HP_PERCENT") &&
    typeof percent === "number"
  ) {
    return { source, percent };
  }
  return undefined;
}

function parseConditionalMultiplier(value: unknown): DealDamageConditionalMultiplierDefinition | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  if (typeof value["targetHpBelowPercent"] === "number" && typeof value["multiplier"] === "number") {
    return {
      targetHpBelowPercent: value["targetHpBelowPercent"],
      multiplier: value["multiplier"]
    };
  }
  return undefined;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
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
