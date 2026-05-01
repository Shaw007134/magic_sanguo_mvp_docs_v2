export const PROJECT_NAME = "Magic Sanguo";

export function getLogicTicksPerSecond(): number {
  return 60;
}

export * from "./model/index.js";
export * from "./combat/CombatEngine.js";
export * from "./combat/CombatResultSummaryBuilder.js";
export * from "./combat/DamageCalculator.js";
export * from "./combat/ResolutionStack.js";
export * from "./combat/commands/CombatCommand.js";
export * from "./combat/commands/ApplyBurnCommand.js";
export * from "./combat/commands/DealDamageCommand.js";
export * from "./combat/commands/GainArmorCommand.js";
export * from "./combat/commands/ModifyCooldownCommand.js";
export * from "./combat/status/Burn.js";
export * from "./combat/status/StatusEffect.js";
export * from "./combat/status/StatusEffectSystem.js";
export * from "./combat/modifiers/Modifier.js";
export * from "./combat/modifiers/ModifierHooks.js";
export * from "./combat/modifiers/ModifierSystem.js";
export * from "./combat/triggers/TriggerDefinition.js";
export * from "./combat/triggers/TriggerRuntimeState.js";
export * from "./combat/triggers/TriggerSystem.js";
export * from "./replay/ReplayEvent.js";
export * from "./replay/ReplayTimeline.js";
export * from "./validation/cardValidation.js";
export * from "./validation/formationValidation.js";
export * from "./validation/validationResult.js";
