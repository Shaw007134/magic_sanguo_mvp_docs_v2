import type { CardDefinition, CardInstance, CardTier } from "../../model/card.js";
import { getMonsterTemplateById } from "../../content/monsters/monsterTemplates.js";
import { shuffleDeterministic } from "../deterministic.js";
import type { LevelUpRewardChoice, RewardChoice } from "../RunState.js";

const CARD_TIER_UPGRADES = {
  BRONZE: "SILVER",
  SILVER: "GOLD",
  GOLD: "JADE",
  JADE: "CELESTIAL"
} as const satisfies Partial<Record<CardTier, CardTier>>;

export function createRewardChoices(input: {
  readonly seed: string;
  readonly nodeIndex: number;
  readonly defeatedMonsterId?: string;
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly ownedCards?: readonly CardInstance[];
}): readonly RewardChoice[] {
  const rewardPool = input.defeatedMonsterId
    ? (getMonsterTemplateById(input.defeatedMonsterId)?.rewardPool ?? [])
    : [];
  const poolCards = rewardPool.filter((cardId) => input.cardDefinitionsById.has(cardId));
  const shuffledCards = shuffleDeterministic(
    [...new Set([...poolCards, ...input.cardDefinitionsById.keys()])],
    `${input.seed}:reward:${input.nodeIndex}:${input.defeatedMonsterId ?? "none"}`
  );
  const firstCard = poolCards[0] ?? shuffledCards[0] ?? "rusty-blade";
  const choices: RewardChoice[] = [
    {
      id: `reward-${input.nodeIndex}-card-0`,
      type: "REWARD_CARD",
      label: `Take ${input.cardDefinitionsById.get(firstCard)?.name ?? firstCard}`,
      cardDefinitionId: firstCard
    }
  ];

  const upgrade = findUpgradeableCard(input.ownedCards ?? [], input.cardDefinitionsById);
  if (upgrade) {
    choices.push({
      id: `reward-${input.nodeIndex}-upgrade`,
      type: "REWARD_UPGRADE",
      label: `Upgrade ${input.cardDefinitionsById.get(upgrade.card.definitionId)?.name ?? upgrade.card.definitionId}`,
      cardInstanceId: upgrade.card.instanceId,
      fromTier: upgrade.fromTier,
      toTier: upgrade.toTier
    });
  }

  choices.push({
    id: `reward-${input.nodeIndex}-gold`,
    type: "REWARD_GOLD",
    label: "Take 4 gold",
    gold: 4
  });

  for (const cardDefinitionId of shuffledCards) {
    if (choices.length >= 3) {
      break;
    }
    if (choices.some((choice) => choice.cardDefinitionId === cardDefinitionId)) {
      continue;
    }
    choices.push({
      id: `reward-${input.nodeIndex}-card-${choices.length}`,
      type: "REWARD_CARD",
      label: `Take ${input.cardDefinitionsById.get(cardDefinitionId)?.name ?? cardDefinitionId}`,
      cardDefinitionId
    });
  }

  return choices.slice(0, 3);
}

export function createLevelUpRewardChoices(input: {
  readonly seed: string;
  readonly level: number;
  readonly ownedCards: readonly CardInstance[];
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
}): readonly LevelUpRewardChoice[] {
  const shuffledCards = shuffleDeterministic(
    [...input.cardDefinitionsById.keys()],
    `${input.seed}:level-up:${input.level}`
  );
  const cardDefinitionId = shuffledCards[0] ?? "rusty-blade";
  const choices = [
    {
      id: `level-${input.level}-gold`,
      type: "LEVEL_GOLD" as const,
      label: "Gain 6 gold",
      gold: 6
    },
    {
      id: `level-${input.level}-card`,
      type: "LEVEL_CARD" as const,
      label: `Add ${input.cardDefinitionsById.get(cardDefinitionId)?.name ?? cardDefinitionId}`,
      cardDefinitionId
    }
  ];
  const upgrade = findUpgradeableCard(input.ownedCards, input.cardDefinitionsById);
  return upgrade
    ? [
        ...choices,
        {
          id: `level-${input.level}-upgrade`,
          type: "LEVEL_UPGRADE" as const,
          label: `Upgrade ${input.cardDefinitionsById.get(upgrade.card.definitionId)?.name ?? upgrade.card.definitionId}`,
          cardInstanceId: upgrade.card.instanceId,
          fromTier: upgrade.fromTier,
          toTier: upgrade.toTier
        }
      ]
    : [
        ...choices,
        {
          id: `level-${input.level}-gold-2`,
          type: "LEVEL_GOLD" as const,
          label: "Gain 3 gold",
          gold: 3
        }
      ];
}

function findUpgradeableCard(
  ownedCards: readonly CardInstance[],
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
) {
  for (const card of ownedCards) {
    const definition = cardDefinitionsById.get(card.definitionId);
    const fromTier = card.tierOverride ?? definition?.tier;
    const toTier = fromTier ? CARD_TIER_UPGRADES[fromTier as keyof typeof CARD_TIER_UPGRADES] : undefined;
    if (fromTier && toTier) {
      return { card, fromTier, toTier };
    }
  }
  return undefined;
}
