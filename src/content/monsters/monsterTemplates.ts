import banditDuelistJson from "../../../data/monsters/bandit_duelist.json" with { type: "json" };
import bannerGuardJson from "../../../data/monsters/banner_guard.json" with { type: "json" };
import burnApprenticeJson from "../../../data/monsters/burn_apprentice.json" with { type: "json" };
import cinderCaptainJson from "../../../data/monsters/cinder_captain.json" with { type: "json" };
import cinderStrategistJson from "../../../data/monsters/cinder_strategist.json" with { type: "json" };
import drumAdeptJson from "../../../data/monsters/drum_adept.json" with { type: "json" };
import drumTacticianJson from "../../../data/monsters/drum_tactician.json" with { type: "json" };
import fireEchoAdeptJson from "../../../data/monsters/fire_echo_adept.json" with { type: "json" };
import gateCaptainJson from "../../../data/monsters/gate_captain.json" with { type: "json" };
import gateCaptainEliteJson from "../../../data/monsters/gate_captain_elite.json" with { type: "json" };
import ironPatrolJson from "../../../data/monsters/iron_patrol.json" with { type: "json" };
import oilRaiderJson from "../../../data/monsters/oil_raider.json" with { type: "json" };
import rustBanditJson from "../../../data/monsters/rust_bandit.json" with { type: "json" };
import shieldSergeantJson from "../../../data/monsters/shield_sergeant.json" with { type: "json" };
import shieldGuardJson from "../../../data/monsters/shield_guard.json" with { type: "json" };
import siegeMarshalJson from "../../../data/monsters/siege_marshal.json" with { type: "json" };
import siegeTraineeJson from "../../../data/monsters/siege_trainee.json" with { type: "json" };
import trainingDummyJson from "../../../data/monsters/training_dummy.json" with { type: "json" };
import type { MonsterTemplate } from "./MonsterTemplate.js";

export const MONSTER_TEMPLATES = [
  trainingDummyJson,
  rustBanditJson,
  burnApprenticeJson,
  shieldGuardJson,
  drumTacticianJson,
  fireEchoAdeptJson,
  banditDuelistJson,
  oilRaiderJson,
  shieldSergeantJson,
  drumAdeptJson,
  siegeTraineeJson,
  bannerGuardJson,
  cinderCaptainJson,
  ironPatrolJson,
  gateCaptainJson,
  gateCaptainEliteJson,
  siegeMarshalJson,
  cinderStrategistJson
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
