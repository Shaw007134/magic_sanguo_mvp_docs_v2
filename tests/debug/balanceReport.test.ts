import { describe, expect, it } from "vitest";

import { getActiveCardDefinitionsById } from "../../src/content/cards/activeCards.js";
import {
  BALANCE_WARNING_FLAGS,
  createBalanceReport,
  createSampleFormation,
  REQUIRED_SAMPLE_BUILD_IDS,
  renderMarkdownReport,
  SAMPLE_BUILDS
} from "../../src/debug/BalanceReport.js";
import { createNewRun } from "../../src/run/RunManager.js";
import { validateFormationSnapshot } from "../../src/validation/formationValidation.js";

const activeCardsById = getActiveCardDefinitionsById();

describe("Phase 15D balance report", () => {
  it("declares every required sample build id exactly once", () => {
    const sampleIds = SAMPLE_BUILDS.map((build) => build.id);

    expect(new Set(sampleIds).size).toBe(sampleIds.length);
    expect(sampleIds).toEqual(expect.arrayContaining([...REQUIRED_SAMPLE_BUILD_IDS]));
    expect(sampleIds).toHaveLength(REQUIRED_SAMPLE_BUILD_IDS.length);
  });

  it("sample build fixtures create valid FormationSnapshot values", () => {
    for (const build of SAMPLE_BUILDS) {
      const sample = createSampleFormation(build, activeCardsById);
      const result = validateFormationSnapshot(sample.formation, {
        cardDefinitionsById: activeCardsById,
        cardInstancesById: new Map(sample.cardInstances.map((card) => [card.instanceId, card]))
      });

      expect(sample.formation.slots).toHaveLength(build.formationSlotCount);
      expect(result, build.id).toEqual({ valid: true, errors: [] });
    }
  });

  it("runs deterministically for the same seed without mutating RunState", () => {
    const manager = createNewRun("report-run-state");
    const before = structuredClone(manager.state);
    const first = createBalanceReport("balance-report-determinism");
    const second = createBalanceReport("balance-report-determinism");

    expect(second).toEqual(first);
    expect(manager.state).toEqual(before);
  });

  it("includes combat metrics, contributors, and warning flags", () => {
    const report = createBalanceReport("balance-report-fields");

    expect(report.entries.length).toBe(SAMPLE_BUILDS.length * 7);
    expect(report.entries.length).toBe(98);
    expect(report.sampleBuilds).toHaveLength(14);
    expect(report.entries.every((entry) => entry.seed === "balance-report-fields")).toBe(true);
    for (const buildId of REQUIRED_SAMPLE_BUILD_IDS) {
      expect(report.entries.some((entry) => entry.buildId === buildId && entry.enemyId === "gate-captain-elite"), buildId).toBe(true);
    }
    for (const entry of report.entries) {
      expect(entry.timeElapsedSeconds).toBeGreaterThan(0);
      expect(entry.warningFlags).toBeDefined();
      expect(entry.warningFlags.every((flag) => BALANCE_WARNING_FLAGS.includes(flag))).toBe(true);
      expect(entry.cardActivationsByCard).toBeDefined();
      expect(entry.damageByCard).toBeDefined();
      expect(entry.statusDamageByApplyingCard).toBeDefined();
      expect(entry.triggerCountByCard).toBeDefined();
      expect(entry.hasteApplications).toBeDefined();
      expect(entry.slowApplications).toBeDefined();
      expect(entry.freezeApplications).toBeDefined();
      expect(entry.critCountByCard).toBeDefined();
      expect(entry.criticalDamageByCard).toBeDefined();
      expect(entry.topContributors).toBeDefined();
      expect(entry.armorBlocked).toBeGreaterThanOrEqual(0);
      expect(entry.healing).toBeGreaterThanOrEqual(0);
      expect(entry.armorGained).toBeGreaterThanOrEqual(0);
      expect(entry.totalDirectDamage).toBeGreaterThanOrEqual(0);
      expect(entry.burnDamage).toBeGreaterThanOrEqual(0);
      expect(entry.poisonDamage).toBeGreaterThanOrEqual(0);
      expect(entry.topContributors.length).toBeGreaterThan(0);
    }
  });

  it("renders the readable Phase 15D Markdown sections deterministically", () => {
    const report = createBalanceReport("balance-report-markdown");
    const first = renderMarkdownReport(report);
    const second = renderMarkdownReport(report);

    expect(second).toBe(first);
    expect(first).toContain("## Executive Summary");
    expect(first).toContain("## Build Summary");
    expect(first).toContain("## Boss Summary");
    expect(first).toContain("## Boss Challenge Summary");
    expect(first).toContain("## Build Legitimacy Notes");
    expect(first).toContain("## Enhanced Build Summary");
    expect(first).toContain("## Warning Hotspots");
    expect(first).toContain("## Outcome Attribution Snapshot");
    expect(first).toContain("## Trigger / Activation Outliers");
    expect(first).toContain("## Tuning Notes");
    expect(first).toContain("## Fight Detail");
    expect(first).toContain("Gate Captain Elite");
    expect(first).toContain("Cinder Strategist");
    expect(first).toContain("Fast-Kill Count");
    expect(first).toContain("Likely Design Cause");
    expect(first).toContain("Wooden Shield");
    expect(first).toContain("Iron Guard");
    expect(first).toContain("Enhanced Burn Terminal");
    expect(first).toContain("Fire Cart Battery has +3 Burn from Siege Pitch.");
  });

  it("classifies boss challenge and build legitimacy warnings", () => {
    const report = createBalanceReport("balance-report-boss-classification");
    const markdown = renderMarkdownReport(report);
    const bossEntries = report.entries.filter((entry) =>
      ["gate-captain-elite", "siege-marshal", "cinder-strategist"].includes(entry.enemyId)
    );
    const starterBossWins = bossEntries.filter((entry) => entry.buildId.startsWith("starter-") && entry.winner === "PLAYER");
    const fragileBossWins = bossEntries.filter((entry) => entry.winner === "PLAYER" && entry.timeElapsedSeconds < 12);

    expect(bossEntries).toHaveLength(SAMPLE_BUILDS.length * 3);
    expect(markdown).toContain("| Boss | Player Win Rate | Avg Time | Fast-Kill Count | Too-Fast Builds | Losing Builds |");
    expect(markdown).toContain("Starter builds are diagnostic boss mismatch checks.");
    for (const entry of starterBossWins) {
      expect(entry.warningFlags).toContain("STARTER_BEATS_BOSS");
    }
    for (const entry of fragileBossWins) {
      expect(entry.warningFlags).toContain("BOSS_TOO_FRAGILE");
    }
  });
});
