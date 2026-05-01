import type { CardDefinition } from "../../model/card.js";
import { shuffleDeterministic } from "../deterministic.js";
import type { RewardChoice } from "../RunState.js";

export function createRewardChoices(input: {
  readonly seed: string;
  readonly nodeIndex: number;
  readonly defeatedMonsterId?: string;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
}): readonly RewardChoice[] {
  return shuffleDeterministic(
    [...input.cardDefinitionsById.keys()],
    `${input.seed}:reward:${input.nodeIndex}:${input.defeatedMonsterId ?? "none"}`
  )
    .slice(0, 3)
    .map((cardDefinitionId, index) => ({
      id: `reward-${input.nodeIndex}-${index}`,
      type: "REWARD_CARD",
      cardDefinitionId
    }));
}
