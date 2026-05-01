export const PROJECT_NAME = "Magic Sanguo";

export function getLogicTicksPerSecond(): number {
  return 60;
}

export * from "./model/index.js";
export * from "./combat/CombatEngine.js";
export * from "./combat/ResolutionStack.js";
export * from "./combat/commands/CombatCommand.js";
export * from "./combat/commands/ApplyBurnCommand.js";
export * from "./combat/commands/DealDamageCommand.js";
export * from "./combat/commands/GainArmorCommand.js";
export * from "./combat/commands/ModifyCooldownCommand.js";
export * from "./validation/cardValidation.js";
export * from "./validation/formationValidation.js";
export * from "./validation/validationResult.js";
