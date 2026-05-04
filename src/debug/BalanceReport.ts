import { CombatEngine, LOGIC_TICKS_PER_SECOND, RUN_MAX_COMBAT_TICKS } from "../combat/CombatEngine.js";
import { createSkillModifiers } from "../run/skills/skillDefinitions.js";
import { getActiveCardDefinitionsById } from "../content/cards/activeCards.js";
import { MonsterGenerator } from "../content/monsters/MonsterGenerator.js";
import { getMonsterTemplateById } from "../content/monsters/monsterTemplates.js";
import type { CardDefinition, CardInstance } from "../model/card.js";
import type { FormationSnapshot, FormationSlotSnapshot } from "../model/formation.js";
import type { CombatResult, CombatResultSummary } from "../model/result.js";
import type { SkillInstance } from "../run/skills/Skill.js";

const REPORT_SEED = "phase-15a-balance-report";
export const BALANCE_REPORT_MAX_COMBAT_TICKS = RUN_MAX_COMBAT_TICKS;

export type BalanceWarningFlag =
  | "TIMEOUT_OR_NEAR_TIMEOUT"
  | "PLAYER_DEAD_TOO_FAST"
  | "ENEMY_DEAD_TOO_FAST"
  | "STALL_RISK"
  | "RUNAWAY_COOLDOWN_RISK"
  | "FREEZE_LOCK_RISK"
  | "SLOW_STALL_RISK"
  | "POISON_HEAL_STALL_RISK"
  | "BURN_TOO_WEAK"
  | "POISON_TOO_STRONG"
  | "TERMINAL_TOO_BURSTY"
  | "LOW_READABILITY_TRIGGER_SPAM"
  | "LOW_CARD_CONTRIBUTION"
  | "NO_CLEAR_TERMINAL"
  | "TOO_MANY_ZERO_CONTRIBUTORS";

export interface BalanceSampleBuild {
  readonly id: string;
  readonly name: string;
  readonly archetype: string;
  readonly level: number;
  readonly maxHp: number;
  readonly formationSlotCount: number;
  readonly cardIds: readonly string[];
  readonly skillIds?: readonly string[];
  readonly explanation: string;
}

export interface BalanceReportEntry {
  readonly buildId: string;
  readonly buildName: string;
  readonly intendedArchetype: string;
  readonly enemyId: string;
  readonly enemyName: string;
  readonly seed: string;
  readonly winner: CombatResult["winner"];
  readonly timeElapsedSeconds: number;
  readonly playerFinalHp: number;
  readonly enemyFinalHp: number;
  readonly totalDirectDamage: number;
  readonly burnDamage: number;
  readonly poisonDamage: number;
  readonly healing: number;
  readonly armorGained: number;
  readonly armorBlocked: number;
  readonly cardActivationsByCard: Readonly<Record<string, number>>;
  readonly damageByCard: Readonly<Record<string, number>>;
  readonly statusDamageByApplyingCard: CombatResultSummary["statusDamageByCard"];
  readonly triggerCountByCard: Readonly<Record<string, number>>;
  readonly hasteApplications: Readonly<Record<string, number>>;
  readonly slowApplications: Readonly<Record<string, number>>;
  readonly freezeApplications: Readonly<Record<string, number>>;
  readonly critCountByCard: Readonly<Record<string, number>>;
  readonly criticalDamageByCard: Readonly<Record<string, number>>;
  readonly topContributors: CombatResultSummary["topContributors"];
  readonly warningFlags: readonly BalanceWarningFlag[];
}

export interface BalanceReport {
  readonly generatedAt: string;
  readonly seed: string;
  readonly sampleBuilds: readonly Pick<BalanceSampleBuild, "id" | "name" | "archetype" | "level" | "formationSlotCount" | "explanation">[];
  readonly entries: readonly BalanceReportEntry[];
}

export const REQUIRED_SAMPLE_BUILD_IDS = [
  "starter-blade",
  "starter-burn",
  "starter-poison",
  "armor-terminal",
  "crit-execution",
  "siege-burn",
  "poison-heal",
  "burn-reaction",
  "haste-drum-tempo",
  "control-slow-freeze",
  "frequency-status-soup",
  "late-16-slot-combo"
] as const;

export const SAMPLE_BUILDS: readonly BalanceSampleBuild[] = [
  {
    id: "starter-blade",
    name: "Starter Blade",
    archetype: "Blade Tempo",
    level: 2,
    maxHp: 44,
    formationSlotCount: 4,
    cardIds: ["rusty-blade", "militia-spear", "quick-jab", "wooden-shield"],
    explanation: "Checks whether simple fast physical cards can clear onboarding fights without combo support."
  },
  {
    id: "starter-burn",
    name: "Starter Burn",
    archetype: "Burn Engine",
    level: 2,
    maxHp: 44,
    formationSlotCount: 4,
    cardIds: ["oil-flask", "flame-spear", "ember-needle", "guarded-torch"],
    explanation: "Checks whether decaying Burn has enough early pressure without becoming persistent Poison."
  },
  {
    id: "starter-poison",
    name: "Starter Poison",
    archetype: "Poison Inevitable",
    level: 2,
    maxHp: 44,
    formationSlotCount: 4,
    cardIds: ["poison-needle", "venom-prick", "toxic-lance", "field-medic"],
    explanation: "Checks early Poison pacing and whether persistence beats Armor too easily."
  },
  {
    id: "armor-terminal",
    name: "Armor Terminal",
    archetype: "Armor Terminal",
    level: 8,
    maxHp: 72,
    formationSlotCount: 12,
    cardIds: ["iron-guard", "shield-wall", "veteran-plate", "battle-standard", "frontline-bulwark", "iron-bastion-strike", "steady-wall-engine", "bastion-foundry"],
    skillIds: ["shield-craft"],
    explanation: "Checks whether Armor payoff terminals end fights without becoming immortal stall."
  },
  {
    id: "crit-execution",
    name: "Crit Execution",
    archetype: "Crit Execution",
    level: 8,
    maxHp: 68,
    formationSlotCount: 12,
    cardIds: ["iron-scout-saber", "vanguard-saber", "left-flank-blade", "flank-executioner", "execution-halberd", "redline-finisher", "last-order-halberd"],
    skillIds: ["weapon-drill"],
    explanation: "Checks direct-damage crit and missing-HP execution without adding crit support systems."
  },
  {
    id: "siege-burn",
    name: "Siege Burn",
    archetype: "Siege Fire",
    level: 8,
    maxHp: 70,
    formationSlotCount: 12,
    cardIds: ["war-drum", "fire-arrow-cart", "siege-brazier", "flame-ram", "fire-cart-battery", "siege-oil-chain", "burning-trebuchet", "siege-command"],
    skillIds: ["fire-study"],
    explanation: "Checks slow Burn siege terminals after Burn decay and drum acceleration."
  },
  {
    id: "poison-heal",
    name: "Poison + Heal",
    archetype: "Poison Inevitable / Medic Support",
    level: 7,
    maxHp: 66,
    formationSlotCount: 10,
    cardIds: ["poison-needle", "venom-prick", "venom-jar", "venom-pressure-cask", "field-medic", "herbal-poultice", "venom-leech", "venom-quartermaster", "menders-sash"],
    explanation: "Checks Poison long-fight pressure plus capped healing for stall risk."
  },
  {
    id: "burn-reaction",
    name: "Burn + Reaction",
    archetype: "Status Reaction",
    level: 7,
    maxHp: 64,
    formationSlotCount: 10,
    cardIds: ["oil-flask", "ember-needle", "fire-arrow-cart", "ember-banner", "toxic-flame-seal", "ash-and-venom-seal", "fever-drum", "banner-of-cinders", "poison-needle"],
    explanation: "Checks whether Burn tick reactions stay bounded and readable."
  },
  {
    id: "haste-drum-tempo",
    name: "Haste / Drum Tempo",
    archetype: "Drum Command",
    level: 7,
    maxHp: 64,
    formationSlotCount: 10,
    cardIds: ["field-drum", "war-drum", "command-runner", "cooling-fan", "battlefield-metronome", "rallying-beat", "discipline-drill", "signal-tower", "vanguard-saber"],
    skillIds: ["quick-hands"],
    explanation: "Checks whether cooldown and Haste engines create tempo without runaway activation counts."
  },
  {
    id: "control-slow-freeze",
    name: "Control Slow / Freeze",
    archetype: "Control Tempo",
    level: 7,
    maxHp: 64,
    formationSlotCount: 10,
    cardIds: ["mud-trap", "heavy-net", "frost-chain", "cold-spear", "rally-drummer", "green-smoke-lantern", "poisoned-net", "toxic-lance"],
    explanation: "Checks conservative Slow/Freeze control without permanent lockout."
  },
  {
    id: "frequency-status-soup",
    name: "Frequency Status Soup",
    archetype: "Frequency / Status Reaction",
    level: 8,
    maxHp: 70,
    formationSlotCount: 12,
    cardIds: ["quick-jab", "ember-needle", "venom-prick", "flame-spear", "toxic-lance", "fever-drum", "venom-leech", "ash-and-venom-seal", "green-smoke-lantern", "menders-sash", "toxin-brewer"],
    explanation: "Checks high-frequency trigger readability and low-card-contribution risk."
  },
  {
    id: "late-16-slot-combo",
    name: "Late 16-slot Combo Build",
    archetype: "Mixed 16-slot Combo",
    level: 10,
    maxHp: 84,
    formationSlotCount: 16,
    cardIds: [
      "battlefield-metronome",
      "command-runner",
      "war-drum",
      "signal-tower",
      "bastion-foundry",
      "fire-cart-battery",
      "banner-of-cinders",
      "venom-prick",
      "venom-quartermaster",
      "redline-finisher",
      "last-order-halberd"
    ],
    skillIds: ["quick-hands", "shield-craft"],
    explanation: "Stress-tests the expanded board with multiple engines, terminals, and reaction bridges."
  }
];

const ENEMY_SUITE = [
  { id: "training-dummy", day: 1 },
  { id: "shield-sergeant", day: 5 },
  { id: "drum-adept", day: 5 },
  { id: "cinder-captain", day: 7 },
  { id: "gate-captain-elite", day: 10 },
  { id: "siege-marshal", day: 10 }
] as const;

export function createBalanceReport(seed = REPORT_SEED): BalanceReport {
  const cardDefinitionsById = getActiveCardDefinitionsById();
  const entries: BalanceReportEntry[] = [];

  for (const build of SAMPLE_BUILDS) {
    const player = createSampleFormation(build, cardDefinitionsById);
    for (const enemyRef of ENEMY_SUITE) {
      const enemy = createEnemy(enemyRef.id, enemyRef.day, seed, cardDefinitionsById);
      const result = new CombatEngine().simulate({
        playerFormation: player.formation,
        enemyFormation: enemy.formation,
        cardInstancesById: new Map([...player.cardInstances, ...enemy.cardInstances].map((card) => [card.instanceId, card])),
        cardDefinitionsById,
        modifiers: createSkillModifiers({ ownedSkills: player.skills, ownerId: "player" }),
        maxCombatTicks: BALANCE_REPORT_MAX_COMBAT_TICKS
      });
      entries.push(createReportEntry({ build, enemyName: enemy.formation.displayName, enemyId: enemyRef.id, seed, result }));
    }
  }

  return {
    generatedAt: new Date(0).toISOString(),
    seed,
    sampleBuilds: SAMPLE_BUILDS.map((build) => ({
      id: build.id,
      name: build.name,
      archetype: build.archetype,
      level: build.level,
      formationSlotCount: build.formationSlotCount,
      explanation: build.explanation
    })),
    entries
  };
}

export function createSampleFormation(
  build: BalanceSampleBuild,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition> = getActiveCardDefinitionsById()
): { readonly formation: FormationSnapshot; readonly cardInstances: readonly CardInstance[]; readonly skills: readonly SkillInstance[] } {
  const cardInstances = build.cardIds.map((cardId, index) => ({
    instanceId: `${build.id}-card-${index + 1}`,
    definitionId: cardId
  }));
  const slots = placeCardsInSlots(build.formationSlotCount, cardInstances, cardDefinitionsById);
  const skills = (build.skillIds ?? []).map((skillId, index) => ({
    instanceId: `${build.id}-skill-${index + 1}`,
    definitionId: skillId
  }));
  return {
    formation: {
      id: "player",
      kind: "PLAYER",
      displayName: build.name,
      level: build.level,
      maxHp: build.maxHp,
      startingArmor: 0,
      slots,
      skills: skills.map((skill) => ({ id: skill.instanceId, definitionId: skill.definitionId })),
      relics: []
    },
    cardInstances,
    skills
  };
}

function placeCardsInSlots(
  formationSlotCount: number,
  cardInstances: readonly CardInstance[],
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): readonly FormationSlotSnapshot[] {
  const slots: FormationSlotSnapshot[] = Array.from({ length: formationSlotCount }, (_, index) => ({ slotIndex: index + 1 }));
  let cursor = 0;
  for (const card of cardInstances) {
    const definition = cardDefinitionsById.get(card.definitionId);
    if (!definition) {
      throw new Error(`Unknown card definition in balance fixture: ${card.definitionId}`);
    }
    while (cursor < slots.length && (slots[cursor]?.cardInstanceId || slots[cursor]?.locked)) {
      cursor += 1;
    }
    if (definition.size === 2) {
      while (
        cursor + 1 < slots.length &&
        (slots[cursor]?.cardInstanceId || slots[cursor]?.locked || slots[cursor + 1]?.cardInstanceId || slots[cursor + 1]?.locked)
      ) {
        cursor += 1;
      }
      if (cursor + 1 >= slots.length) {
        throw new Error(`Build ${card.instanceId} does not fit size 2 card ${card.definitionId}.`);
      }
      slots[cursor] = { slotIndex: cursor + 1, cardInstanceId: card.instanceId };
      slots[cursor + 1] = { slotIndex: cursor + 2, locked: true };
      cursor += 2;
    } else {
      if (cursor >= slots.length) {
        throw new Error(`Build does not fit card ${card.definitionId}.`);
      }
      slots[cursor] = { slotIndex: cursor + 1, cardInstanceId: card.instanceId };
      cursor += 1;
    }
  }
  return slots;
}

function createEnemy(
  templateId: string,
  day: number,
  seed: string,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
) {
  const template = getMonsterTemplateById(templateId);
  if (!template) {
    throw new Error(`Unknown monster template: ${templateId}`);
  }
  return new MonsterGenerator().generate({
    template,
    seed: `${seed}:enemy:${templateId}`,
    day,
    cardDefinitionsById
  });
}

function createReportEntry(input: {
  readonly build: BalanceSampleBuild;
  readonly enemyId: string;
  readonly enemyName: string;
  readonly seed: string;
  readonly result: CombatResult;
}): BalanceReportEntry {
  const summary = input.result.summary;
  const hasteApplications = summary.controlApplicationsByCard?.Haste ?? {};
  const slowApplications = summary.controlApplicationsByCard?.Slow ?? {};
  const freezeApplications = summary.controlApplicationsByCard?.Freeze ?? {};
  const totalDirectDamage = sumValues(summary.damageByCard);
  const healing = sumValues(summary.healingByCard);
  const armorGained = sumValues(summary.armorGainedByCard);
  const triggerCountByCard = summary.triggerCountByCard;
  return {
    buildId: input.build.id,
    buildName: input.build.name,
    intendedArchetype: input.build.archetype,
    enemyId: input.enemyId,
    enemyName: input.enemyName,
    seed: input.seed,
    winner: input.result.winner,
    timeElapsedSeconds: roundSeconds(input.result.ticksElapsed / LOGIC_TICKS_PER_SECOND),
    playerFinalHp: input.result.playerFinalHp,
    enemyFinalHp: input.result.enemyFinalHp,
    totalDirectDamage,
    burnDamage: summary.statusDamage.Burn ?? 0,
    poisonDamage: summary.statusDamage.Poison ?? 0,
    healing,
    armorGained,
    armorBlocked: summary.armorBlocked,
    cardActivationsByCard: summary.activationsByCard,
    damageByCard: summary.damageByCard,
    statusDamageByApplyingCard: summary.statusDamageByCard,
    triggerCountByCard,
    hasteApplications,
    slowApplications,
    freezeApplications,
    critCountByCard: summary.critCountByCard ?? {},
    criticalDamageByCard: summary.criticalDamageByCard ?? {},
    topContributors: summary.topContributors,
    warningFlags: collectWarningFlags({
      build: input.build,
      enemyId: input.enemyId,
      summary,
      result: input.result,
      totalDirectDamage,
      healing,
      armorGained,
      triggerCountByCard,
      hasteApplications,
      slowApplications,
      freezeApplications
    })
  };
}

function collectWarningFlags(input: {
  readonly build: BalanceSampleBuild;
  readonly enemyId: string;
  readonly summary: CombatResultSummary;
  readonly result: CombatResult;
  readonly totalDirectDamage: number;
  readonly healing: number;
  readonly armorGained: number;
  readonly triggerCountByCard: Readonly<Record<string, number>>;
  readonly hasteApplications: Readonly<Record<string, number>>;
  readonly slowApplications: Readonly<Record<string, number>>;
  readonly freezeApplications: Readonly<Record<string, number>>;
}): readonly BalanceWarningFlag[] {
  const flags = new Set<BalanceWarningFlag>();
  const elapsedSeconds = input.result.ticksElapsed / LOGIC_TICKS_PER_SECOND;
  const isBoss = input.enemyId.includes("boss") || input.enemyId.includes("marshal") || input.enemyId.includes("strategist") || input.enemyId.includes("elite");
  const enemyActivationTotal = Object.entries(input.summary.activationsByCard)
    .filter(([sourceId]) => sourceId.startsWith("monster") || sourceId.startsWith(input.enemyId) || sourceId.includes(":"))
    .reduce((total, [, amount]) => total + amount, 0);

  if (elapsedSeconds >= 55) flags.add("TIMEOUT_OR_NEAR_TIMEOUT");
  if (input.result.winner === "ENEMY" && elapsedSeconds <= 12) flags.add("PLAYER_DEAD_TOO_FAST");
  if (input.result.winner === "PLAYER" && isBoss && elapsedSeconds < 10) flags.add("ENEMY_DEAD_TOO_FAST");
  if (elapsedSeconds >= 45 && (input.healing + input.armorGained + input.summary.armorBlocked) > input.totalDirectDamage) flags.add("STALL_RISK");
  if (Math.max(0, ...Object.values(input.summary.activationsByCard)) >= 45) flags.add("RUNAWAY_COOLDOWN_RISK");
  if (sumValues(input.freezeApplications) >= 8 || (sumValues(input.freezeApplications) >= 4 && enemyActivationTotal <= 2)) flags.add("FREEZE_LOCK_RISK");
  if (sumValues(input.slowApplications) >= 12) flags.add("SLOW_STALL_RISK");
  if ((input.summary.statusDamage.Poison ?? 0) >= 25 && input.healing >= 10 && elapsedSeconds >= 35) flags.add("POISON_HEAL_STALL_RISK");
  if (input.build.archetype.includes("Burn") && (input.summary.statusDamage.Burn ?? 0) < 4 && elapsedSeconds >= 20) flags.add("BURN_TOO_WEAK");
  if ((input.summary.statusDamage.Poison ?? 0) > input.totalDirectDamage * 1.5 && elapsedSeconds >= 30) flags.add("POISON_TOO_STRONG");
  if (isBoss && Math.max(0, ...Object.values(input.summary.damageByCard)) >= 45) flags.add("TERMINAL_TOO_BURSTY");
  if (Math.max(0, ...Object.values(input.triggerCountByCard)) > 30) flags.add("LOW_READABILITY_TRIGGER_SPAM");
  if (input.summary.topContributors.length > 0 && input.summary.topContributors[0]?.score < 8 && elapsedSeconds >= 20) flags.add("NO_CLEAR_TERMINAL");
  if (Object.values(input.summary.damageByCard).filter((value) => value <= 0).length >= 4) flags.add("TOO_MANY_ZERO_CONTRIBUTORS");
  if (input.summary.topContributors.some((entry) => entry.score <= 1)) flags.add("LOW_CARD_CONTRIBUTION");

  return [...flags].sort();
}

function sumValues(values: Readonly<Record<string, number>>): number {
  return Object.values(values).reduce((total, value) => total + value, 0);
}

function roundSeconds(value: number): number {
  return Math.round(value * 100) / 100;
}

export function renderMarkdownReport(report: BalanceReport): string {
  const lines = [
    "# Phase 15A Balance Report",
    "",
    `Seed: ${report.seed}`,
    "",
    "| Build | Enemy | Winner | Time | Burn | Poison | Healing | Warnings |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | --- |"
  ];
  for (const entry of report.entries) {
    lines.push(`| ${entry.buildName} | ${entry.enemyName} | ${entry.winner} | ${entry.timeElapsedSeconds}s | ${entry.burnDamage} | ${entry.poisonDamage} | ${entry.healing} | ${entry.warningFlags.join(", ") || "None"} |`);
  }
  lines.push("");
  return lines.join("\n");
}
