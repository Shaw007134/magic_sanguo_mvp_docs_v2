import type { CardDefinition, CardInstance, CardTier } from "../../model/card.js";
import { getMonsterTemplateById } from "../../content/monsters/monsterTemplates.js";
import { describeUpgradePreview } from "../../content/cards/effectiveCardDefinition.js";
import { shuffleDeterministic } from "../deterministic.js";
import type { LevelUpRewardChoice, RewardChoice } from "../RunState.js";
import { SKILL_DEFINITIONS } from "../skills/skillDefinitions.js";
import type { SkillInstance } from "../skills/Skill.js";

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
  readonly usedCardDefinitionIds?: readonly string[];
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly ownedCards?: readonly CardInstance[];
  readonly ownedSkills?: readonly SkillInstance[];
}): readonly RewardChoice[] {
  const rewardPool = input.defeatedMonsterId
    ? (getMonsterTemplateById(input.defeatedMonsterId)?.rewardPool ?? [])
    : [];
  const poolCards = rewardPool.filter((cardId) => input.cardDefinitionsById.has(cardId));
  const usedCards = (input.usedCardDefinitionIds ?? []).filter((cardId) => input.cardDefinitionsById.has(cardId));
  const fallbackCards = shuffleDeterministic(
    [...input.cardDefinitionsById.keys()],
    `${input.seed}:reward:${input.nodeIndex}:${input.defeatedMonsterId ?? "none"}`
  );
  const orderedCards = [...new Set([...usedCards, ...poolCards, ...fallbackCards])];
  const choices: RewardChoice[] = [];
  for (const cardDefinitionId of orderedCards) {
    if (choices.length >= 2) {
      break;
    }
    choices.push({
      id: `reward-${input.nodeIndex}-card-${choices.length}`,
      type: "REWARD_CARD",
      label: `Take ${input.cardDefinitionsById.get(cardDefinitionId)?.name ?? cardDefinitionId}`,
      cardDefinitionId
    });
  }

  const upgrade = findUpgradeableCard(input.ownedCards ?? [], input.cardDefinitionsById);
  if (upgrade) {
    choices.push({
      id: `reward-${input.nodeIndex}-upgrade`,
      type: "REWARD_UPGRADE",
      label: `Upgrade ${input.cardDefinitionsById.get(upgrade.card.definitionId)?.name ?? upgrade.card.definitionId}`,
      cardInstanceId: upgrade.card.instanceId,
      fromTier: upgrade.fromTier,
      toTier: upgrade.toTier,
      preview: upgrade.preview
    });
  }

  if (choices.length < 3) {
    const skillDefinition = findUnownedSkill(input.ownedSkills ?? []);
    if (skillDefinition) {
      choices.push({
        id: `reward-${input.nodeIndex}-skill`,
        type: "REWARD_SKILL",
        label: `Learn ${skillDefinition.name}`,
        skillDefinitionId: skillDefinition.id
      });
    }
  }
  if (choices.length < 3) {
    choices.push({
      id: `reward-${input.nodeIndex}-gold`,
      type: "REWARD_GOLD",
      label: "Take 4 gold",
      gold: 4
    });
  }

  for (const cardDefinitionId of orderedCards) {
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
  readonly ownedSkills?: readonly SkillInstance[];
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
}): readonly LevelUpRewardChoice[] {
  const shuffledCards = shuffleDeterministic(
    [...input.cardDefinitionsById.keys()],
    `${input.seed}:level-up:${input.level}`
  );
  const cardDefinitionId = shuffledCards[0] ?? "rusty-blade";
  const skillDefinition = findUnownedSkill(input.ownedSkills ?? [], `${input.seed}:level-skill:${input.level}`);
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
    },
    ...(skillDefinition
      ? [
          {
            id: `level-${input.level}-skill`,
            type: "LEVEL_SKILL" as const,
            label: `Learn ${skillDefinition.name}`,
            skillDefinitionId: skillDefinition.id
          }
        ]
      : [])
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
          toTier: upgrade.toTier,
          preview: upgrade.preview
        }
      ]
        .slice(0, 3)
    : [
        ...choices,
        {
          id: `level-${input.level}-gold-2`,
          type: "LEVEL_GOLD" as const,
          label: "Gain 3 gold",
          gold: 3
        }
      ].slice(0, 3);
}

function findUpgradeableCard(
  ownedCards: readonly CardInstance[],
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
) {
  for (const card of ownedCards) {
    const definition = cardDefinitionsById.get(card.definitionId);
    const fromTier = card.tierOverride ?? definition?.tier;
    const toTier = fromTier ? CARD_TIER_UPGRADES[fromTier as keyof typeof CARD_TIER_UPGRADES] : undefined;
    if (definition && fromTier && toTier) {
      return {
        card,
        fromTier,
        toTier,
        preview: describeUpgradePreview({ card, baseDefinition: definition, toTier })
      };
    }
  }
  return undefined;
}

function findUnownedSkill(ownedSkills: readonly SkillInstance[], seed = "skill-reward") {
  const ownedDefinitionIds = new Set(ownedSkills.map((skill) => skill.definitionId));
  return shuffleDeterministic(SKILL_DEFINITIONS, seed).find((skill) => !ownedDefinitionIds.has(skill.id));
}
