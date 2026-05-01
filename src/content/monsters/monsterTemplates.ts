import burnApprenticeJson from "../../../data/monsters/burn_apprentice.json" with { type: "json" };
import drumTacticianJson from "../../../data/monsters/drum_tactician.json" with { type: "json" };
import fireEchoAdeptJson from "../../../data/monsters/fire_echo_adept.json" with { type: "json" };
import gateCaptainJson from "../../../data/monsters/gate_captain.json" with { type: "json" };
import rustBanditJson from "../../../data/monsters/rust_bandit.json" with { type: "json" };
import shieldGuardJson from "../../../data/monsters/shield_guard.json" with { type: "json" };
import trainingDummyJson from "../../../data/monsters/training_dummy.json" with { type: "json" };
import type { MonsterTemplate } from "./MonsterTemplate.js";

export const MONSTER_TEMPLATES = [
  trainingDummyJson,
  rustBanditJson,
  burnApprenticeJson,
  shieldGuardJson,
  drumTacticianJson,
  fireEchoAdeptJson,
  gateCaptainJson
] as readonly MonsterTemplate[];

export function getMonsterTemplateById(id: string): MonsterTemplate | undefined {
  return MONSTER_TEMPLATES.find((template) => template.id === id);
}

export function getEligibleMonsterTemplates(day: number, difficulty?: MonsterTemplate["difficulty"]): readonly MonsterTemplate[] {
  return MONSTER_TEMPLATES.filter(
    (template) =>
      template.minDay <= day &&
      day <= template.maxDay &&
      (difficulty === undefined || template.difficulty === difficulty)
  );
}
