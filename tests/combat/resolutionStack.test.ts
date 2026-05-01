import { describe, expect, it } from "vitest";

import { CombatLog } from "../../src/combat/CombatLog.js";
import type { CombatCommand, CombatExecutionContext } from "../../src/combat/commands/CombatCommand.js";
import { DealDamageCommand } from "../../src/combat/commands/DealDamageCommand.js";
import { GainArmorCommand } from "../../src/combat/commands/GainArmorCommand.js";
import { ModifyCooldownCommand } from "../../src/combat/commands/ModifyCooldownCommand.js";
import { ResolutionStack } from "../../src/combat/ResolutionStack.js";
import type { RuntimeCombatant } from "../../src/combat/types.js";
import type { ReplayEvent } from "../../src/model/result.js";

function createCombatant(id: string, hp = 20): RuntimeCombatant {
  return {
    side: id === "player" ? "PLAYER" : "ENEMY",
    formation: {
      id,
      kind: id === "player" ? "PLAYER" : "MONSTER",
      displayName: id,
      level: 1,
      maxHp: hp,
      startingArmor: 0,
      slots: [],
      skills: [],
      relics: []
    },
    hp,
    armor: 0,
    cards: [],
    statuses: []
  };
}

function createContext(
  stack: ResolutionStack,
  sourceCombatant = createCombatant("player"),
  targetCombatant = createCombatant("enemy")
): Omit<CombatExecutionContext, "resolutionStack"> {
  return {
    tick: 7,
    sourceCard: {
      instanceId: "source-card",
      definitionId: "source-def",
      ownerCombatantId: sourceCombatant.formation.id,
      slotIndex: 1,
      cooldownMaxTicks: 60,
      cooldownRemainingTicks: 0,
      cooldownRecoveryRate: 1,
      disabled: false,
      silenced: false,
      frozen: false,
      activationCount: 0
    },
    sourceCombatant,
    targetCombatant,
    combatLog: new CombatLog(),
    replayEvents: [],
    triggerDepth: 0
  };
}

describe("ResolutionStack", () => {
  it("resolves LIFO", () => {
    const order: string[] = [];
    class RecordCommand implements CombatCommand {
      constructor(readonly name: string) {}

      execute(): void {
        order.push(this.name);
      }
    }

    const stack = new ResolutionStack();
    stack.push(new RecordCommand("first"));
    stack.push(new RecordCommand("second"));

    const result = stack.resolve(createContext(stack));

    expect(result).toEqual({ ok: true, resolvedCommands: 2 });
    expect(order).toEqual(["second", "first"]);
  });

  it("DealDamageCommand reduces HP", () => {
    const stack = new ResolutionStack();
    const target = createCombatant("enemy", 12);
    stack.push(new DealDamageCommand(5));

    stack.resolve(createContext(stack, createCombatant("player"), target));

    expect(target.hp).toBe(7);
  });

  it("GainArmorCommand increases Armor", () => {
    const stack = new ResolutionStack();
    const source = createCombatant("player", 20);
    stack.push(new GainArmorCommand(4));

    stack.resolve(createContext(stack, source));

    expect(source.armor).toBe(4);
  });

  it("ModifyCooldownCommand reduces target card cooldown", () => {
    const stack = new ResolutionStack();
    const source = createCombatant("player", 20);
    source.cards.push({
      instanceId: "cooldown-card",
      definitionId: "cooldown-def",
      ownerCombatantId: "player",
      slotIndex: 1,
      cooldownMaxTicks: 60,
      cooldownRemainingTicks: 30,
      cooldownRecoveryRate: 1,
      disabled: false,
      silenced: false,
      frozen: false,
      activationCount: 0
    });
    stack.push(new ModifyCooldownCommand("cooldown-card", -10));

    stack.resolve(createContext(stack, source));

    expect(source.cards[0]?.cooldownRemainingTicks).toBe(20);
  });

  it("commands generate deterministic log and replay events", () => {
    const stack = new ResolutionStack();
    const replayEvents: ReplayEvent[] = [];
    const combatLog = new CombatLog();
    const context = {
      ...createContext(stack, createCombatant("player"), createCombatant("enemy", 10)),
      replayEvents,
      combatLog
    };
    stack.push(new GainArmorCommand(3));
    stack.push(new DealDamageCommand(2));

    stack.resolve(context);

    expect(combatLog.toArray()).toEqual([
      "7: player dealt 2 direct damage to enemy (0 blocked by armor).",
      "7: player gained 3 armor."
    ]);
    expect(replayEvents).toEqual([
      {
        tick: 7,
        type: "DAMAGE_DEALT",
        sourceId: "source-card",
        targetId: "enemy",
        payload: {
          command: "DealDamage",
          amount: 2,
          damageType: "DIRECT",
          ignoresArmor: false,
          armorBlocked: 0,
          hpDamage: 2,
          targetSide: "ENEMY",
          targetHp: 8,
          targetArmor: 0
        }
      },
      {
        tick: 7,
        type: "ARMOR_GAINED",
        sourceId: "source-card",
        targetId: "player",
        payload: {
          command: "GainArmor",
          amount: 3,
          armor: 3
        }
      }
    ]);
  });

  it("stops runaway command processing with a clear result", () => {
    class RunawayCommand implements CombatCommand {
      readonly name = "Runaway";

      execute(context: CombatExecutionContext): void {
        context.resolutionStack.push(this);
      }
    }

    const stack = new ResolutionStack({
      maxCommandsPerTick: 3,
      maxCommandsPerCombat: 20,
      maxTriggerDepth: 50
    });
    stack.push(new RunawayCommand());

    const result = stack.resolve(createContext(stack));

    expect(result.ok).toBe(false);
    expect(result.resolvedCommands).toBe(3);
    expect(result.error).toBe("ResolutionStack exceeded max commands per tick 3.");
  });
});
