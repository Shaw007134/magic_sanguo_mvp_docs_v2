import type { CardDefinition, CardInstance, CardTier } from "../../model/card.js";
import {
  BUILD_VITAL_SUPPORT_POOL,
  BOSS_REWARD_POOL,
  filterKnownCards,
  getCardQualityScore,
  getRewardPoolForLevel,
  isTerminalOrHighQualityBuildCard,
  TERMINAL_POOL
} from "../../content/cards/contentPools.js";
import { getMonsterTemplateById } from "../../content/monsters/monsterTemplates.js";
import { describeUpgradePreview, hasMeaningfulUpgrade } from "../../content/cards/effectiveCardDefinition.js";
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
  readonly level?: number;
  readonly boss?: boolean;
}): readonly RewardChoice[] {
  const level = input.level ?? 1;
  const rewardPool = input.defeatedMonsterId
    ? (getMonsterTemplateById(input.defeatedMonsterId)?.rewardPool ?? [])
    : [];
  const poolCards = rewardPool.filter((cardId) => input.cardDefinitionsById.has(cardId));
  const usedCards = (input.usedCardDefinitionIds ?? []).filter((cardId) => input.cardDefinitionsById.has(cardId));
  const curatedFallback = sortRewardCardIdsByLevel(shuffleDeterministic(
    filterKnownCards(getRewardPoolForLevel(level), input.cardDefinitionsById),
    `${input.seed}:reward-curated:${input.nodeIndex}:${level}`
  ), level);
  const buildVitalSupport = sortRewardCardIdsByLevel(shuffleDeterministic(
    filterKnownCards(BUILD_VITAL_SUPPORT_POOL, input.cardDefinitionsById),
    `${input.seed}:reward-support:${input.nodeIndex}:${level}`
  ), level);
  const terminalCards = level >= 5
    ? sortRewardCardIdsByLevel(shuffleDeterministic(
        filterKnownCards(input.boss ? BOSS_REWARD_POOL : TERMINAL_POOL, input.cardDefinitionsById),
        `${input.seed}:reward-terminal:${input.nodeIndex}:${level}`
      ), level)
    : [];
  const fallbackCards = shuffleDeterministic(
    [...input.cardDefinitionsById.keys()],
    `${input.seed}:reward:${input.nodeIndex}:${input.defeatedMonsterId ?? "none"}`
  );
  const orderedCards = [...new Set([
    ...usedCards,
    ...poolCards,
    ...curatedFallback,
    ...buildVitalSupport,
    ...terminalCards,
    ...fallbackCards
  ])];
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
  ensureLateBuildCardChoice({
    choices,
    level,
    orderedCards,
    anchorCards: [...terminalCards, ...curatedFallback],
    cardDefinitionsById: input.cardDefinitionsById,
    nodeIndex: input.nodeIndex
  });

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
  const level = input.level;
  const shuffledCards = shuffleDeterministic(
    filterKnownCards(getRewardPoolForLevel(level), input.cardDefinitionsById),
    `${input.seed}:level-up:${input.level}`
  );
  const cardDefinitionId = shuffledCards[0] ?? "rusty-blade";
  const skillDefinition = findUnownedSkill(input.ownedSkills ?? [], `${input.seed}:level-skill:${input.level}`);
  const upgrade = findUpgradeableCard(input.ownedCards, input.cardDefinitionsById);
  const choices: LevelUpRewardChoice[] = [];
  if (skillDefinition) {
    choices.push({
      id: `level-${input.level}-skill`,
      type: "LEVEL_SKILL",
      label: `Learn ${skillDefinition.name}`,
      skillDefinitionId: skillDefinition.id
    });
  }
  if (upgrade) {
    choices.push({
      id: `level-${input.level}-upgrade`,
      type: "LEVEL_UPGRADE",
      label: `Upgrade ${input.cardDefinitionsById.get(upgrade.card.definitionId)?.name ?? upgrade.card.definitionId}`,
      cardInstanceId: upgrade.card.instanceId,
      fromTier: upgrade.fromTier,
      toTier: upgrade.toTier,
      preview: upgrade.preview
    });
  }
  choices.push({
    id: `level-${input.level}-gold`,
    type: "LEVEL_GOLD",
    label: "Gain 6 gold",
    gold: 6
  });
  if (choices.length < 3) {
    choices.push({
      id: `level-${input.level}-card`,
      type: "LEVEL_CARD",
      label: `Add ${input.cardDefinitionsById.get(cardDefinitionId)?.name ?? cardDefinitionId}`,
      cardDefinitionId
    });
  }
  return choices.slice(0, 3);
}

function findUpgradeableCard(
  ownedCards: readonly CardInstance[],
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
) {
  for (const card of ownedCards) {
    const definition = cardDefinitionsById.get(card.definitionId);
    const fromTier = card.tierOverride ?? definition?.tier;
    const toTier = fromTier ? CARD_TIER_UPGRADES[fromTier as keyof typeof CARD_TIER_UPGRADES] : undefined;
    if (definition && fromTier && toTier && hasMeaningfulUpgrade({ card, baseDefinition: definition, toTier })) {
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

function ensureLateBuildCardChoice(input: {
  readonly choices: RewardChoice[];
  readonly level: number;
  readonly orderedCards: readonly string[];
  readonly anchorCards: readonly string[];
  readonly cardDefinitionsById: ReadonlyMap<string, CardDefinition>;
  readonly nodeIndex: number;
}): void {
  if (input.level < 7) {
    return;
  }
  if (
    input.choices.some((choice) =>
      choice.type === "REWARD_CARD" &&
      choice.cardDefinitionId !== undefined &&
      isTerminalOrHighQualityBuildCard(choice.cardDefinitionId)
    )
  ) {
    return;
  }

  const existingCardIds = new Set(input.choices.map((choice) => choice.cardDefinitionId).filter(Boolean));
  const anchor = [...input.anchorCards, ...input.orderedCards].find((cardId) =>
    !existingCardIds.has(cardId) &&
    input.cardDefinitionsById.has(cardId) &&
    isTerminalOrHighQualityBuildCard(cardId)
  );
  if (!anchor) {
    return;
  }

  const anchorChoice: RewardChoice = {
    id: `reward-${input.nodeIndex}-card-build-anchor`,
    type: "REWARD_CARD",
    label: `Take ${input.cardDefinitionsById.get(anchor)?.name ?? anchor}`,
    cardDefinitionId: anchor
  };
  if (input.choices.length < 2) {
    input.choices.push(anchorChoice);
    return;
  }
  input.choices[1] = anchorChoice;
}

function sortRewardCardIdsByLevel(cardIds: readonly string[], level: number): readonly string[] {
  return [...cardIds].sort((left, right) => sortRewardCardIds(left, right, level));
}

function sortRewardCardIds(left: string, right: string, level: number): number {
  if (level <= 2) {
    return earlyTierPenalty(left) - earlyTierPenalty(right) || left.localeCompare(right);
  }
  if (level >= 8) {
    return getCardQualityScore(right) - getCardQualityScore(left) || left.localeCompare(right);
  }
  return getCardQualityScore(right) - getCardQualityScore(left) || left.localeCompare(right);
}

function earlyTierPenalty(cardId: string): number {
  const quality = getCardQualityScore(cardId);
  return quality >= 5 ? 10 + quality : quality;
}
