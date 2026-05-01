import type { CardDefinition } from "../../model/card.js";
import { MonsterGenerator, type MonsterGenerationResult } from "../../content/monsters/MonsterGenerator.js";
import type { RunNode } from "../RunState.js";

export function createBattleEnemy(input: {
  readonly node: RunNode;
  readonly seed: string;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
}): MonsterGenerationResult {
  if (!input.node.monsterTemplateId) {
    throw new Error(`Battle node ${input.node.id} has no monster template.`);
  }
  return new MonsterGenerator().generateByTemplateId({
    templateId: input.node.monsterTemplateId,
    seed: `${input.seed}:${input.node.id}`,
    day: input.node.day,
    cardDefinitionsById: input.cardDefinitionsById
  });
}
