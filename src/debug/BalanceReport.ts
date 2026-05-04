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

export const BALANCE_WARNING_FLAGS = [
  "TIMEOUT_OR_NEAR_TIMEOUT",
  "PLAYER_DEAD_TOO_FAST",
  "ENEMY_DEAD_TOO_FAST",
  "STALL_RISK",
  "RUNAWAY_COOLDOWN_RISK",
  "FREEZE_LOCK_RISK",
  "SLOW_STALL_RISK",
  "POISON_HEAL_STALL_RISK",
  "BURN_TOO_WEAK",
  "POISON_TOO_STRONG",
  "TERMINAL_TOO_BURSTY",
  "LOW_READABILITY_TRIGGER_SPAM",
  "LOW_CARD_CONTRIBUTION",
  "NO_CLEAR_TERMINAL",
  "TOO_MANY_ZERO_CONTRIBUTORS",
  "STARTER_BEATS_BOSS",
  "BOSS_TOO_FRAGILE",
  "LATE_BUILD_UNDERPERFORMS",
  "NO_OUTPUT_ENDPOINT"
] as const;

export type BalanceWarningFlag = (typeof BALANCE_WARNING_FLAGS)[number];

export interface BalanceSampleBuild {
  readonly id: string;
  readonly name: string;
  readonly archetype: string;
  readonly intendedPhase: "STARTER" | "MID" | "LATE" | "STRESS";
  readonly expectedBossViable: boolean;
  readonly expectedWeakness: string;
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
  readonly sampleBuilds: readonly Pick<BalanceSampleBuild, "id" | "name" | "archetype" | "intendedPhase" | "expectedBossViable" | "expectedWeakness" | "level" | "formationSlotCount" | "explanation">[];
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
    intendedPhase: "STARTER",
    expectedBossViable: false,
    expectedWeakness: "Armor-heavy enemies and bosses should outlast small physical chip unless a terminal is added.",
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
    intendedPhase: "STARTER",
    expectedBossViable: false,
    expectedWeakness: "Decaying Burn should pressure early Armor but should not carry boss fights alone.",
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
    intendedPhase: "STARTER",
    expectedBossViable: false,
    expectedWeakness: "Poison needs time and protection; bosses should punish this starter shell before inevitability takes over.",
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
    intendedPhase: "LATE",
    expectedBossViable: true,
    expectedWeakness: "Needs time to build Armor; fast Burn/status pressure can win before the terminal cycle stabilizes.",
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
    intendedPhase: "LATE",
    expectedBossViable: true,
    expectedWeakness: "Needs chip damage before execute scaling matters and has limited defense.",
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
    intendedPhase: "LATE",
    expectedBossViable: true,
    expectedWeakness: "Slow siege setup can be raced or disrupted before terminals repeat.",
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
    intendedPhase: "MID",
    expectedBossViable: true,
    expectedWeakness: "Can be pressured down before Poison stacks enough damage.",
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
    intendedPhase: "MID",
    expectedBossViable: true,
    expectedWeakness: "Needs both Burn density and reaction cards; low status uptime leaves passives quiet.",
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
    intendedPhase: "MID",
    expectedBossViable: false,
    expectedWeakness: "Engine-heavy shell lacks a dedicated output endpoint and can stall or lose to stronger threats.",
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
    intendedPhase: "MID",
    expectedBossViable: false,
    expectedWeakness: "Control buys time but has no strong terminal, so durable bosses can survive it.",
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
    intendedPhase: "LATE",
    expectedBossViable: true,
    expectedWeakness: "Many small pieces can become noisy if no reaction payoff becomes a top contributor.",
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
    intendedPhase: "STRESS",
    expectedBossViable: true,
    expectedWeakness: "Stress build should beat bosses, but if it wins instantly the boss durability target is too low.",
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
  { id: "siege-marshal", day: 10 },
  { id: "cinder-strategist", day: 10 }
] as const;

const BOSS_ENEMY_IDS = new Set(["gate-captain-elite", "siege-marshal", "cinder-strategist"]);

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
      intendedPhase: build.intendedPhase,
      expectedBossViable: build.expectedBossViable,
      expectedWeakness: build.expectedWeakness,
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
  const isBoss = BOSS_ENEMY_IDS.has(input.enemyId);
  const enemyActivationTotal = Object.entries(input.summary.activationsByCard)
    .filter(([sourceId]) => sourceId.startsWith("monster") || sourceId.startsWith(input.enemyId) || sourceId.includes(":"))
    .reduce((total, [, amount]) => total + amount, 0);

  if (elapsedSeconds >= 55) flags.add("TIMEOUT_OR_NEAR_TIMEOUT");
  if (input.result.winner === "ENEMY" && elapsedSeconds <= 10) flags.add("PLAYER_DEAD_TOO_FAST");
  if (input.result.winner === "PLAYER" && isBoss && elapsedSeconds < 8) flags.add("ENEMY_DEAD_TOO_FAST");
  if (input.result.winner === "PLAYER" && isBoss && input.build.intendedPhase === "STARTER") flags.add("STARTER_BEATS_BOSS");
  if (input.result.winner === "PLAYER" && isBoss && elapsedSeconds < 12) flags.add("BOSS_TOO_FRAGILE");
  if (input.result.winner !== "PLAYER" && (input.build.intendedPhase === "LATE" || input.build.intendedPhase === "STRESS") && !isBoss) flags.add("LATE_BUILD_UNDERPERFORMS");
  if (elapsedSeconds >= 45 && (input.healing + input.armorGained + input.summary.armorBlocked) > input.totalDirectDamage) flags.add("STALL_RISK");
  if (Math.max(0, ...Object.values(input.summary.activationsByCard)) >= 55) flags.add("RUNAWAY_COOLDOWN_RISK");
  if (sumValues(input.freezeApplications) >= 8 || (sumValues(input.freezeApplications) >= 4 && enemyActivationTotal <= 2)) flags.add("FREEZE_LOCK_RISK");
  if (sumValues(input.slowApplications) >= 14 && elapsedSeconds >= 20) flags.add("SLOW_STALL_RISK");
  if ((input.summary.statusDamage.Poison ?? 0) >= 25 && input.healing >= 10 && elapsedSeconds >= 35) flags.add("POISON_HEAL_STALL_RISK");
  if (input.build.archetype.includes("Burn") && (input.summary.statusDamage.Burn ?? 0) < 4 && elapsedSeconds >= 20) flags.add("BURN_TOO_WEAK");
  if ((input.summary.statusDamage.Poison ?? 0) > input.totalDirectDamage * 1.5 && elapsedSeconds >= 30) flags.add("POISON_TOO_STRONG");
  if (isBoss && elapsedSeconds < 15 && Math.max(0, ...Object.values(input.summary.damageByCard)) >= 50) flags.add("TERMINAL_TOO_BURSTY");
  if (Math.max(0, ...Object.values(input.triggerCountByCard)) > 35) flags.add("LOW_READABILITY_TRIGGER_SPAM");
  if (input.build.level >= 7 && input.summary.topContributors.length > 0 && input.summary.topContributors[0]?.score < 8 && elapsedSeconds >= 15) flags.add("NO_CLEAR_TERMINAL");
  if (!input.build.expectedBossViable && isBoss && elapsedSeconds >= 25 && input.result.winner !== "PLAYER") flags.add("NO_OUTPUT_ENDPOINT");
  if (elapsedSeconds >= 8 && Object.values(input.summary.damageByCard).filter((value) => value <= 0).length >= 4) flags.add("TOO_MANY_ZERO_CONTRIBUTORS");
  if (elapsedSeconds >= 8 && input.summary.topContributors.some((entry) => entry.score <= 1)) flags.add("LOW_CARD_CONTRIBUTION");

  return [...flags].sort();
}

function sumValues(values: Readonly<Record<string, number>>): number {
  return Object.values(values).reduce((total, value) => total + value, 0);
}

function roundSeconds(value: number): number {
  return Math.round(value * 100) / 100;
}

export function renderMarkdownReport(report: BalanceReport): string {
  const cardDefinitionsById = getActiveCardDefinitionsById();
  const warningCounts = countWarnings(report.entries);
  const totalFights = report.entries.length;
  const playerWins = report.entries.filter((entry) => entry.winner === "PLAYER").length;
  const timeoutCount = warningCounts.TIMEOUT_OR_NEAR_TIMEOUT ?? 0;
  const buildSummaries = summarizeByBuild(report.entries);
  const bossEntries = report.entries.filter((entry) => BOSS_ENEMY_IDS.has(entry.enemyId));
  const bossSummaries = summarizeBosses(bossEntries);
  const hotspots = report.entries
    .filter((entry) => entry.warningFlags.some((flag) => isSeriousWarning(flag)))
    .sort(compareEntryRisk)
    .slice(0, 12);
  const triggerOutliers = collectOutliers(report.entries, "triggerCountByCard", 20);
  const activationOutliers = collectOutliers(report.entries, "cardActivationsByCard", 45);
  const lines = [
    "# Phase 15C Balance Report",
    "",
    `Seed: ${report.seed}`,
    "",
    "## Executive Summary",
    "",
    `- Total fights: ${totalFights}`,
    `- Player win rate: ${formatPercent(playerWins / Math.max(1, totalFights))}`,
    `- Timeout or near-timeout count: ${timeoutCount}`,
    `- Most common warnings: ${formatWarningCounts(warningCounts, 5)}`,
    "",
    "## Build Summary",
    "",
    "| Build | Win Rate | Avg Time | Main Warnings |",
    "| --- | ---: | ---: | --- |",
    ...buildSummaries.map((summary) =>
      `| ${summary.buildName} | ${formatPercent(summary.playerWins / summary.fights)} | ${roundSeconds(summary.totalTime / summary.fights)}s | ${formatWarningCounts(summary.warningCounts, 3)} |`
    ),
    "",
    "## Boss Summary",
    "",
    "| Build | Boss | Winner | Time | Warnings |",
    "| --- | --- | --- | ---: | --- |",
    ...bossEntries.map((entry) =>
      `| ${entry.buildName} | ${entry.enemyName} | ${entry.winner} | ${entry.timeElapsedSeconds}s | ${entry.warningFlags.join(", ") || "None"} |`
    ),
    "",
    "## Boss Challenge Summary",
    "",
    "| Boss | Player Win Rate | Avg Time | Fast-Kill Count | Too-Fast Builds | Losing Builds |",
    "| --- | ---: | ---: | ---: | --- | --- |",
    ...bossSummaries.map((summary) =>
      `| ${summary.enemyName} | ${formatPercent(summary.playerWins / summary.fights)} | ${roundSeconds(summary.totalTime / summary.fights)}s | ${summary.fastKillCount} | ${summary.fastKillBuilds.join(", ") || "None"} | ${summary.losingBuilds.join(", ") || "None"} |`
    ),
    "",
    "## Build Legitimacy Notes",
    "",
    ...createBuildLegitimacyNotes(report),
    "",
    "## Warning Hotspots",
    "",
    hotspots.length > 0 ? "| Build | Enemy | Winner | Time | Warnings | Likely Design Cause |" : "No serious warning hotspots.",
    ...(hotspots.length > 0 ? [
      "| --- | --- | --- | ---: | --- | --- |",
      ...hotspots.map((entry) =>
        `| ${entry.buildName} | ${entry.enemyName} | ${entry.winner} | ${entry.timeElapsedSeconds}s | ${entry.warningFlags.join(", ")} | ${getLikelyDesignCause(entry)} |`
      )
    ] : []),
    "",
    "## Outcome Attribution Snapshot",
    "",
    "| Build | Enemy | Winner | Player Top | Enemy Top | Outcome Note |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.entries.map((entry) => {
      const playerTop = findTopContributor(entry, "PLAYER");
      const enemyTop = findTopContributor(entry, "ENEMY");
      return `| ${entry.buildName} | ${entry.enemyName} | ${entry.winner} | ${formatContributor(playerTop, entry, cardDefinitionsById)} | ${formatContributor(enemyTop, entry, cardDefinitionsById)} | ${createOutcomeNote(entry)} |`;
    }),
    "",
    "## Trigger / Activation Outliers",
    "",
    triggerOutliers.length > 0 ? "Trigger outliers:" : "Trigger outliers: None.",
    ...triggerOutliers.map((outlier) => `- ${outlier.sourceId}: ${outlier.count} triggers in ${outlier.buildName} vs ${outlier.enemyName}`),
    "",
    activationOutliers.length > 0 ? "Activation outliers:" : "Activation outliers: None.",
    ...activationOutliers.map((outlier) => `- ${outlier.sourceId}: ${outlier.count} activations in ${outlier.buildName} vs ${outlier.enemyName}`),
    "",
    "## Tuning Notes",
    "",
    ...createTuningNotes(warningCounts),
    "",
    "## Fight Detail",
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

interface BuildReportSummary {
  readonly buildId: string;
  readonly buildName: string;
  readonly fights: number;
  readonly playerWins: number;
  readonly totalTime: number;
  readonly warningCounts: Partial<Record<BalanceWarningFlag, number>>;
}

interface BossReportSummary {
  readonly enemyId: string;
  readonly enemyName: string;
  readonly fights: number;
  readonly playerWins: number;
  readonly totalTime: number;
  readonly fastKillCount: number;
  readonly fastKillBuilds: readonly string[];
  readonly losingBuilds: readonly string[];
}

interface ReportOutlier {
  readonly buildName: string;
  readonly enemyName: string;
  readonly sourceId: string;
  readonly count: number;
}

function summarizeByBuild(entries: readonly BalanceReportEntry[]): readonly BuildReportSummary[] {
  const byBuild = new Map<string, {
    buildId: string;
    buildName: string;
    fights: number;
    playerWins: number;
    totalTime: number;
    warningCounts: Partial<Record<BalanceWarningFlag, number>>;
  }>();
  for (const entry of entries) {
    const summary = byBuild.get(entry.buildId) ?? {
      buildId: entry.buildId,
      buildName: entry.buildName,
      fights: 0,
      playerWins: 0,
      totalTime: 0,
      warningCounts: {}
    };
    summary.fights += 1;
    summary.playerWins += entry.winner === "PLAYER" ? 1 : 0;
    summary.totalTime += entry.timeElapsedSeconds;
    for (const warning of entry.warningFlags) {
      summary.warningCounts[warning] = (summary.warningCounts[warning] ?? 0) + 1;
    }
    byBuild.set(entry.buildId, summary);
  }
  return [...byBuild.values()];
}

function summarizeBosses(entries: readonly BalanceReportEntry[]): readonly BossReportSummary[] {
  const byBoss = new Map<string, {
    enemyId: string;
    enemyName: string;
    fights: number;
    playerWins: number;
    totalTime: number;
    fastKillCount: number;
    fastKillBuilds: string[];
    losingBuilds: string[];
  }>();
  for (const entry of entries) {
    const summary = byBoss.get(entry.enemyId) ?? {
      enemyId: entry.enemyId,
      enemyName: entry.enemyName,
      fights: 0,
      playerWins: 0,
      totalTime: 0,
      fastKillCount: 0,
      fastKillBuilds: [],
      losingBuilds: []
    };
    summary.fights += 1;
    summary.playerWins += entry.winner === "PLAYER" ? 1 : 0;
    summary.totalTime += entry.timeElapsedSeconds;
    if (entry.warningFlags.includes("BOSS_TOO_FRAGILE") || entry.warningFlags.includes("ENEMY_DEAD_TOO_FAST")) {
      summary.fastKillCount += 1;
      summary.fastKillBuilds.push(entry.buildName);
    }
    if (entry.winner !== "PLAYER") {
      summary.losingBuilds.push(entry.buildName);
    }
    byBoss.set(entry.enemyId, summary);
  }
  return [...byBoss.values()];
}

function countWarnings(entries: readonly BalanceReportEntry[]): Partial<Record<BalanceWarningFlag, number>> {
  const counts: Partial<Record<BalanceWarningFlag, number>> = {};
  for (const entry of entries) {
    for (const warning of entry.warningFlags) {
      counts[warning] = (counts[warning] ?? 0) + 1;
    }
  }
  return counts;
}

function formatWarningCounts(
  counts: Partial<Record<BalanceWarningFlag, number>>,
  limit: number
): string {
  const ranked = Object.entries(counts)
    .filter((entry): entry is [BalanceWarningFlag, number] => entry[1] > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
  return ranked.length > 0 ? ranked.map(([warning, count]) => `${warning} (${count})`).join(", ") : "None";
}

function isSeriousWarning(flag: BalanceWarningFlag): boolean {
  return flag === "TIMEOUT_OR_NEAR_TIMEOUT" ||
    flag === "PLAYER_DEAD_TOO_FAST" ||
    flag === "STARTER_BEATS_BOSS" ||
    flag === "BOSS_TOO_FRAGILE" ||
    flag === "LATE_BUILD_UNDERPERFORMS" ||
    flag === "NO_OUTPUT_ENDPOINT" ||
    flag === "STALL_RISK" ||
    flag === "RUNAWAY_COOLDOWN_RISK" ||
    flag === "FREEZE_LOCK_RISK" ||
    flag === "POISON_HEAL_STALL_RISK" ||
    flag === "TERMINAL_TOO_BURSTY";
}

function findTopContributor(
  entry: BalanceReportEntry,
  side: "PLAYER" | "ENEMY"
): CombatResultSummary["topContributors"][number] | undefined {
  return entry.topContributors.find((contributor) => (
    side === "PLAYER" ? contributor.sourceId.startsWith(`${entry.buildId}-card-`) : contributor.sourceId.startsWith(`${entry.enemyId}:`)
  ));
}

function formatContributor(
  contributor: CombatResultSummary["topContributors"][number] | undefined,
  entry: BalanceReportEntry,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): string {
  if (!contributor) {
    return "None";
  }
  return `${resolveSourceName(contributor.sourceId, entry, cardDefinitionsById)} (${contributor.score})`;
}

function resolveSourceName(
  sourceId: string,
  entry: BalanceReportEntry,
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): string {
  const build = SAMPLE_BUILDS.find((candidate) => candidate.id === entry.buildId);
  const playerMatch = sourceId.match(new RegExp(`^${escapeRegExp(entry.buildId)}-card-(\\d+)$`));
  if (playerMatch && build) {
    const cardId = build.cardIds[Number(playerMatch[1]) - 1];
    return cardId ? cardDefinitionsById.get(cardId)?.name ?? sourceId : sourceId;
  }

  const enemyPrefix = `${entry.enemyId}:`;
  if (sourceId.startsWith(enemyPrefix)) {
    const afterPrefix = sourceId.slice(enemyPrefix.length);
    const cardId = afterPrefix.replace(/:\d+$/, "");
    return cardDefinitionsById.get(cardId)?.name ?? sourceId;
  }

  return sourceId;
}

function createOutcomeNote(entry: BalanceReportEntry): string {
  if (entry.warningFlags.includes("STARTER_BEATS_BOSS")) {
    return "Starter shell beat a boss; this is a diagnostic mismatch warning.";
  }
  if (entry.warningFlags.includes("BOSS_TOO_FRAGILE")) {
    return "Boss died before its engine could fully express.";
  }
  if (entry.warningFlags.includes("NO_OUTPUT_ENDPOINT")) {
    return "Engine/control shell lacks a clear output endpoint.";
  }
  if (entry.warningFlags.includes("STALL_RISK") || entry.warningFlags.includes("TIMEOUT_OR_NEAR_TIMEOUT")) {
    return "Likely stall or Armor mirror; inspect terminal contribution.";
  }
  if (entry.winner === "PLAYER") {
    return BOSS_ENEMY_IDS.has(entry.enemyId) ? "Player build cleared boss check." : "Player build handled this matchup.";
  }
  return "Enemy pressure beat this build.";
}

function getLikelyDesignCause(entry: BalanceReportEntry): string {
  if (entry.warningFlags.includes("ENEMY_DEAD_TOO_FAST") || entry.warningFlags.includes("BOSS_TOO_FRAGILE")) {
    return "Boss durability too low or terminal burst too high.";
  }
  if (entry.warningFlags.includes("STARTER_BEATS_BOSS")) {
    return "Starter shell is overperforming against boss durability.";
  }
  if (entry.warningFlags.includes("STALL_RISK") || entry.warningFlags.includes("TIMEOUT_OR_NEAR_TIMEOUT")) {
    return "Insufficient terminal pressure or Armor mirror.";
  }
  if (entry.warningFlags.includes("RUNAWAY_COOLDOWN_RISK")) {
    return "Activation count too high.";
  }
  if (entry.warningFlags.includes("PLAYER_DEAD_TOO_FAST")) {
    return "Build lacks defense or enemy pressure spikes too hard.";
  }
  if (entry.warningFlags.includes("SLOW_STALL_RISK")) {
    return "Control uptime too high or enemy lacks alternate threat.";
  }
  if (entry.warningFlags.includes("NO_OUTPUT_ENDPOINT")) {
    return "Engine has no clear terminal/output endpoint.";
  }
  if (entry.warningFlags.includes("LATE_BUILD_UNDERPERFORMS")) {
    return "Late build is failing below expected matchup tier.";
  }
  return "Review warning combination manually.";
}

function createBuildLegitimacyNotes(report: BalanceReport): readonly string[] {
  const lines = [
    "- Starter builds are diagnostic boss mismatch checks. If they beat a boss, the report flags that as a balance warning rather than treating it as expected progression."
  ];
  lines.push(...report.sampleBuilds.map((build) =>
    `- ${build.name}: ${build.intendedPhase} build. Boss viable: ${build.expectedBossViable ? "yes" : "no"}. Weakness: ${build.expectedWeakness}`
  ));
  const starterBossWins = report.entries.filter((entry) => entry.warningFlags.includes("STARTER_BEATS_BOSS"));
  if (starterBossWins.length > 0) {
    lines.push(`- Starter boss wins are diagnostic balance warnings, not expected progression wins: ${starterBossWins.map((entry) => `${entry.buildName} vs ${entry.enemyName}`).join("; ")}.`);
  }
  return lines;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compareEntryRisk(a: BalanceReportEntry, b: BalanceReportEntry): number {
  const warningDelta = b.warningFlags.length - a.warningFlags.length;
  if (warningDelta !== 0) return warningDelta;
  return b.timeElapsedSeconds - a.timeElapsedSeconds;
}

function collectOutliers(
  entries: readonly BalanceReportEntry[],
  field: "triggerCountByCard" | "cardActivationsByCard",
  threshold: number
): readonly ReportOutlier[] {
  return entries.flatMap((entry) =>
    Object.entries(entry[field])
      .filter(([, count]) => count >= threshold)
      .map(([sourceId, count]) => ({
        buildName: entry.buildName,
        enemyName: entry.enemyName,
        sourceId,
        count
      }))
  ).sort((a, b) => b.count - a.count || a.sourceId.localeCompare(b.sourceId)).slice(0, 12);
}

function createTuningNotes(counts: Partial<Record<BalanceWarningFlag, number>>): readonly string[] {
  const notes: string[] = [];
  if ((counts.TERMINAL_TOO_BURSTY ?? 0) > 0) {
    notes.push("- Terminal burst remains present; check Armor and missing-HP terminal numbers before adding stronger bosses.");
  }
  if ((counts.STARTER_BEATS_BOSS ?? 0) > 0 || (counts.BOSS_TOO_FRAGILE ?? 0) > 0) {
    notes.push("- Starter boss wins or fragile boss warnings mean enemy durability/pressure still needs review before judging player builds solved.");
  }
  if ((counts.RUNAWAY_COOLDOWN_RISK ?? 0) > 0) {
    notes.push("- Cooldown engine outliers remain; keep adjacent cooldown and broad Haste values modest.");
  }
  if ((counts.STALL_RISK ?? 0) > 0 || (counts.TIMEOUT_OR_NEAR_TIMEOUT ?? 0) > 0) {
    notes.push("- Some fights still approach stall; avoid raising Heal, Armor, Slow, or Freeze until those entries are reviewed.");
  }
  if ((counts.BURN_TOO_WEAK ?? 0) === 0) {
    notes.push("- Burn currently avoids weak-pressure flags after decay; future buffs should be small and aimed at readability.");
  }
  if ((counts.POISON_TOO_STRONG ?? 0) === 0 && (counts.POISON_HEAL_STALL_RISK ?? 0) === 0) {
    notes.push("- Poison/Heal is not currently tripping long-fight inevitability or stall flags.");
  }
  if (notes.length === 0) {
    notes.push("- No warning family dominates this report; use manual playtests for feel before changing numbers.");
  }
  return notes;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
