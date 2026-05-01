export const PROJECT_NAME = "Magic Sanguo";

export function getLogicTicksPerSecond(): number {
  return 60;
}

export * from "./model/index.js";
export * from "./combat/CombatEngine.js";
export * from "./validation/cardValidation.js";
export * from "./validation/formationValidation.js";
export * from "./validation/validationResult.js";
