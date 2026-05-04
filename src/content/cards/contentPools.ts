import type { CardDefinition } from "../../model/card.js";

export type ContentStage = "starter" | "early" | "mid" | "late" | "boss";
export type CardRole =
  | "starter"
  | "engine"
  | "terminal"
  | "defense"
  | "connector"
  | "scaler"
  | "payoff";
export type ArchetypeName =
  | "Blade Tempo"
  | "Burn Engine"
  | "Armor Counter"
  | "Drum Command"
  | "Siege Fire"
  | "Hybrid Bruiser"
  | "Armor Terminal"
  | "Crit Execution";

export interface CardPoolMetadata {
  readonly role: CardRole;
  readonly archetypes: readonly ArchetypeName[];
  readonly stage: ContentStage;
  readonly quality: number;
  readonly buildVital?: boolean;
}

export interface TerminalDefinition {
  readonly cardId: string;
  readonly archetype: ArchetypeName;
  readonly supportCardIds: readonly string[];
  readonly weakness: string;
}

export const CARD_POOL_METADATA = {
  "training-staff": { role: "starter", archetypes: ["Hybrid Bruiser"], stage: "starter", quality: 1 },
  "rusty-blade": { role: "starter", archetypes: ["Blade Tempo"], stage: "starter", quality: 2, buildVital: true },
  "flame-spear": { role: "starter", archetypes: ["Burn Engine"], stage: "early", quality: 2, buildVital: true },
  "wooden-shield": { role: "defense", archetypes: ["Armor Counter"], stage: "starter", quality: 2, buildVital: true },
  "spark-drum": { role: "connector", archetypes: ["Drum Command"], stage: "early", quality: 3, buildVital: true },
  "fire-echo-seal": { role: "engine", archetypes: ["Burn Engine"], stage: "mid", quality: 3 },
  "gate-captain-saber": { role: "payoff", archetypes: ["Blade Tempo", "Hybrid Bruiser"], stage: "mid", quality: 3 },

  "militia-spear": { role: "starter", archetypes: ["Hybrid Bruiser"], stage: "starter", quality: 2, buildVital: true },
  "oil-flask": { role: "starter", archetypes: ["Burn Engine"], stage: "starter", quality: 2, buildVital: true },
  "iron-guard": { role: "defense", archetypes: ["Armor Counter", "Armor Terminal"], stage: "starter", quality: 2, buildVital: true },
  "patrol-spear": { role: "starter", archetypes: ["Blade Tempo"], stage: "early", quality: 2 },
  "field-drum": { role: "connector", archetypes: ["Drum Command", "Siege Fire"], stage: "early", quality: 3, buildVital: true },
  "guarded-torch": { role: "starter", archetypes: ["Hybrid Bruiser", "Burn Engine"], stage: "early", quality: 2 },
  "twin-hook": { role: "payoff", archetypes: ["Blade Tempo"], stage: "mid", quality: 3 },
  "shield-wall": { role: "defense", archetypes: ["Armor Counter", "Armor Terminal"], stage: "mid", quality: 4, buildVital: true },
  "counter-stance": { role: "payoff", archetypes: ["Armor Counter"], stage: "mid", quality: 3 },
  "veteran-plate": { role: "defense", archetypes: ["Armor Counter", "Armor Terminal"], stage: "mid", quality: 4, buildVital: true },
  "duelists-dao": { role: "terminal", archetypes: ["Blade Tempo"], stage: "late", quality: 5 },
  "frontline-bulwark": { role: "defense", archetypes: ["Armor Counter", "Armor Terminal"], stage: "mid", quality: 4 },
  "fire-arrow-cart": { role: "engine", archetypes: ["Burn Engine", "Siege Fire"], stage: "mid", quality: 3, buildVital: true },
  "ember-banner": { role: "engine", archetypes: ["Burn Engine"], stage: "early", quality: 3, buildVital: true },
  "cinder-seal": { role: "scaler", archetypes: ["Burn Engine"], stage: "late", quality: 5 },
  "siege-crossbow": { role: "terminal", archetypes: ["Siege Fire"], stage: "mid", quality: 4 },
  "rallying-beat": { role: "connector", archetypes: ["Drum Command"], stage: "mid", quality: 4 },
  "burning-shield": { role: "defense", archetypes: ["Hybrid Bruiser", "Burn Engine"], stage: "mid", quality: 3 },

  "vanguard-saber": { role: "starter", archetypes: ["Blade Tempo"], stage: "early", quality: 3 },
  "execution-halberd": { role: "terminal", archetypes: ["Crit Execution", "Blade Tempo"], stage: "late", quality: 5 },
  "left-flank-blade": { role: "payoff", archetypes: ["Blade Tempo"], stage: "mid", quality: 4 },
  "discipline-drill": { role: "connector", archetypes: ["Drum Command"], stage: "mid", quality: 4 },
  "spear-and-shield-line": { role: "starter", archetypes: ["Hybrid Bruiser", "Armor Counter"], stage: "early", quality: 3 },
  "captains-finisher": { role: "terminal", archetypes: ["Crit Execution"], stage: "late", quality: 5 },
  "war-drum": { role: "connector", archetypes: ["Drum Command", "Siege Fire"], stage: "early", quality: 4, buildVital: true },
  "command-gong": { role: "engine", archetypes: ["Drum Command", "Siege Fire"], stage: "late", quality: 5 },
  "battle-standard": { role: "defense", archetypes: ["Drum Command", "Armor Terminal"], stage: "mid", quality: 4, buildVital: true },
  "frontline-banner": { role: "defense", archetypes: ["Hybrid Bruiser", "Armor Counter"], stage: "early", quality: 3 },
  "guard-captain": { role: "payoff", archetypes: ["Hybrid Bruiser"], stage: "mid", quality: 4 },
  "signal-tower": { role: "engine", archetypes: ["Drum Command"], stage: "late", quality: 5 },
  "iron-bastion-strike": { role: "terminal", archetypes: ["Armor Terminal"], stage: "late", quality: 5 },
  "warlords-mandate": { role: "terminal", archetypes: ["Hybrid Bruiser"], stage: "late", quality: 5 },
  "kindling-spear": { role: "starter", archetypes: ["Burn Engine"], stage: "early", quality: 3 },
  "siege-brazier": { role: "payoff", archetypes: ["Siege Fire", "Burn Engine"], stage: "mid", quality: 4 },
  "flame-ram": { role: "terminal", archetypes: ["Siege Fire"], stage: "late", quality: 5 },
  "burning-trebuchet": { role: "terminal", archetypes: ["Siege Fire"], stage: "boss", quality: 6 },
  "fire-cart-battery": { role: "engine", archetypes: ["Siege Fire", "Burn Engine"], stage: "late", quality: 5 },
  "siege-command": { role: "connector", archetypes: ["Siege Fire", "Drum Command"], stage: "late", quality: 5 }
} as const satisfies Record<string, CardPoolMetadata>;

export const STARTER_SHOP_POOL = ["rusty-blade", "wooden-shield", "oil-flask"] as const;
export const STARTER_EVENT_POOL = ["rusty-blade", "wooden-shield", "oil-flask", "iron-guard", "militia-spear"] as const;
export const EARLY_SHOP_POOL = [
  "rusty-blade",
  "wooden-shield",
  "oil-flask",
  "militia-spear",
  "iron-guard",
  "patrol-spear",
  "field-drum",
  "guarded-torch",
  "vanguard-saber",
  "frontline-banner",
  "kindling-spear"
] as const;
export const MID_SHOP_POOL = [
  ...EARLY_SHOP_POOL,
  "twin-hook",
  "shield-wall",
  "counter-stance",
  "veteran-plate",
  "fire-arrow-cart",
  "ember-banner",
  "rallying-beat",
  "burning-shield",
  "left-flank-blade",
  "discipline-drill",
  "war-drum",
  "battle-standard",
  "guard-captain",
  "siege-brazier",
  "siege-crossbow"
] as const;
export const LATE_SHOP_POOL = [
  ...MID_SHOP_POOL,
  "duelists-dao",
  "cinder-seal",
  "execution-halberd",
  "captains-finisher",
  "command-gong",
  "signal-tower",
  "iron-bastion-strike",
  "warlords-mandate",
  "flame-ram",
  "burning-trebuchet",
  "fire-cart-battery",
  "siege-command"
] as const;

export const EARLY_REWARD_POOL = EARLY_SHOP_POOL;
export const MID_REWARD_POOL = MID_SHOP_POOL;
export const LATE_REWARD_POOL = LATE_SHOP_POOL;

export const TERMINAL_POOL = [
  "execution-halberd",
  "captains-finisher",
  "iron-bastion-strike",
  "warlords-mandate",
  "flame-ram",
  "burning-trebuchet",
  "siege-crossbow"
] as const;

export const BUILD_VITAL_SUPPORT_POOL = [
  "rusty-blade",
  "wooden-shield",
  "oil-flask",
  "iron-guard",
  "field-drum",
  "ember-banner",
  "shield-wall",
  "veteran-plate",
  "fire-arrow-cart",
  "war-drum",
  "battle-standard"
] as const;

export const BOSS_REWARD_POOL = [
  "iron-bastion-strike",
  "warlords-mandate",
  "execution-halberd",
  "burning-trebuchet",
  "command-gong",
  "signal-tower",
  "siege-command"
] as const;

export const SKILL_REWARD_POOL = [
  "weapon-drill",
  "fire-study",
  "lasting-embers",
  "quick-hands",
  "shield-craft",
  "drumline-training",
  "siege-engineering",
  "disciplined-formation"
] as const;

export const ARCHETYPE_POOLS = {
  "Blade Tempo": ["rusty-blade", "patrol-spear", "twin-hook", "vanguard-saber", "left-flank-blade", "execution-halberd", "duelists-dao"],
  "Burn Engine": ["oil-flask", "flame-spear", "fire-arrow-cart", "ember-banner", "cinder-seal", "kindling-spear", "siege-brazier"],
  "Armor Counter": ["wooden-shield", "iron-guard", "shield-wall", "counter-stance", "veteran-plate", "frontline-bulwark"],
  "Drum Command": ["field-drum", "spark-drum", "rallying-beat", "war-drum", "command-gong", "discipline-drill", "signal-tower"],
  "Siege Fire": ["siege-crossbow", "fire-arrow-cart", "war-drum", "flame-ram", "burning-trebuchet", "fire-cart-battery", "siege-command"],
  "Hybrid Bruiser": ["militia-spear", "guarded-torch", "spear-and-shield-line", "frontline-banner", "guard-captain", "burning-shield", "warlords-mandate"],
  "Armor Terminal": ["iron-guard", "shield-wall", "veteran-plate", "battle-standard", "frontline-bulwark", "iron-bastion-strike"],
  "Crit Execution": ["execution-halberd", "captains-finisher", "duelists-dao", "vanguard-saber", "discipline-drill"]
} as const satisfies Record<ArchetypeName, readonly string[]>;

export const IRON_WARLORD_TERMINALS = [
  {
    cardId: "iron-bastion-strike",
    archetype: "Armor Terminal",
    supportCardIds: ["iron-guard", "shield-wall", "veteran-plate", "battle-standard"],
    weakness: "Needs Armor before it fires and has a slow 5 second cooldown."
  },
  {
    cardId: "warlords-mandate",
    archetype: "Hybrid Bruiser",
    supportCardIds: ["frontline-banner", "guard-captain", "burning-shield", "spear-and-shield-line"],
    weakness: "Needs max HP growth and time to reach its 6 second cooldown."
  },
  {
    cardId: "execution-halberd",
    archetype: "Crit Execution",
    supportCardIds: ["vanguard-saber", "left-flank-blade", "war-drum", "duelists-dao"],
    weakness: "Needs the enemy chipped below 35% HP and occupies 2 slots."
  },
  {
    cardId: "burning-trebuchet",
    archetype: "Siege Fire",
    supportCardIds: ["war-drum", "command-gong", "siege-command", "fire-arrow-cart", "oil-flask"],
    weakness: "Very slow without drum acceleration and needs missing HP or Burn pressure to shine."
  }
] as const satisfies readonly TerminalDefinition[];

export function getShopPoolForLevel(level: number): readonly string[] {
  if (level <= 2) return EARLY_SHOP_POOL;
  if (level <= 7) return MID_SHOP_POOL;
  return LATE_SHOP_POOL;
}

export function getRewardPoolForLevel(level: number): readonly string[] {
  if (level <= 2) return EARLY_REWARD_POOL;
  if (level <= 7) return MID_REWARD_POOL;
  return LATE_REWARD_POOL;
}

export function getCardPoolMetadata(cardId: string): CardPoolMetadata | undefined {
  return CARD_POOL_METADATA[cardId as keyof typeof CARD_POOL_METADATA];
}

export function getCardQualityScore(cardId: string): number {
  return getCardPoolMetadata(cardId)?.quality ?? 1;
}

export function filterKnownCards(
  cardIds: readonly string[],
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): readonly string[] {
  return cardIds.filter((cardId) => cardDefinitionsById.has(cardId));
}
