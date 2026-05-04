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
  | "Crit Execution"
  | "Poison Inevitable"
  | "Medic Support"
  | "Control Tempo"
  | "Status Reaction";

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
  "siege-command": { role: "connector", archetypes: ["Siege Fire", "Drum Command"], stage: "late", quality: 5 },

  "poison-needle": { role: "starter", archetypes: ["Poison Inevitable"], stage: "early", quality: 2, buildVital: true },
  "field-medic": { role: "defense", archetypes: ["Medic Support", "Hybrid Bruiser"], stage: "early", quality: 2, buildVital: true },
  "toxic-lance": { role: "starter", archetypes: ["Poison Inevitable", "Hybrid Bruiser"], stage: "early", quality: 3 },
  "venom-jar": { role: "engine", archetypes: ["Poison Inevitable"], stage: "mid", quality: 3, buildVital: true },
  "herbal-poultice": { role: "defense", archetypes: ["Medic Support", "Armor Counter"], stage: "mid", quality: 3 },
  "rotting-wine": { role: "payoff", archetypes: ["Poison Inevitable"], stage: "late", quality: 4 },
  "war-chant": { role: "connector", archetypes: ["Control Tempo", "Drum Command"], stage: "early", quality: 2, buildVital: true },
  "mud-trap": { role: "connector", archetypes: ["Control Tempo"], stage: "early", quality: 2, buildVital: true },
  "command-banner": { role: "connector", archetypes: ["Control Tempo", "Drum Command"], stage: "mid", quality: 3 },
  "frost-chain": { role: "payoff", archetypes: ["Control Tempo"], stage: "mid", quality: 3 },
  "cold-spear": { role: "starter", archetypes: ["Control Tempo", "Hybrid Bruiser"], stage: "mid", quality: 3 },
  "rally-drummer": { role: "engine", archetypes: ["Control Tempo", "Drum Command"], stage: "mid", quality: 3 },
  "heavy-net": { role: "connector", archetypes: ["Control Tempo"], stage: "mid", quality: 3 },
  "venom-leech": { role: "connector", archetypes: ["Poison Inevitable", "Medic Support", "Status Reaction"], stage: "early", quality: 2 },
  "field-triage": { role: "defense", archetypes: ["Medic Support", "Armor Counter", "Status Reaction"], stage: "early", quality: 2 },
  "toxic-flame-seal": { role: "payoff", archetypes: ["Burn Engine", "Poison Inevitable", "Status Reaction"], stage: "mid", quality: 3 },
  "fever-drum": { role: "engine", archetypes: ["Burn Engine", "Drum Command", "Status Reaction"], stage: "mid", quality: 3 },
  "poisoned-net": { role: "connector", archetypes: ["Poison Inevitable", "Control Tempo", "Status Reaction"], stage: "mid", quality: 3 },
  "burning-remedy": { role: "payoff", archetypes: ["Medic Support", "Burn Engine", "Poison Inevitable", "Status Reaction"], stage: "mid", quality: 3 },

  "quick-jab": { role: "starter", archetypes: ["Blade Tempo"], stage: "early", quality: 2 },
  "ember-needle": { role: "starter", archetypes: ["Burn Engine", "Status Reaction"], stage: "early", quality: 2, buildVital: true },
  "venom-prick": { role: "starter", archetypes: ["Poison Inevitable", "Status Reaction"], stage: "early", quality: 2, buildVital: true },
  "self-starting-chant": { role: "connector", archetypes: ["Control Tempo", "Drum Command"], stage: "early", quality: 2 },
  "cooling-fan": { role: "connector", archetypes: ["Drum Command"], stage: "mid", quality: 3 },
  "battlefield-metronome": { role: "engine", archetypes: ["Control Tempo", "Drum Command"], stage: "mid", quality: 3 },
  "ash-and-venom-seal": { role: "payoff", archetypes: ["Burn Engine", "Poison Inevitable", "Status Reaction"], stage: "mid", quality: 4 },
  "green-smoke-lantern": { role: "connector", archetypes: ["Poison Inevitable", "Control Tempo", "Status Reaction"], stage: "mid", quality: 3 },
  "menders-sash": { role: "defense", archetypes: ["Medic Support", "Armor Counter", "Status Reaction"], stage: "early", quality: 2 },
  "toxin-brewer": { role: "connector", archetypes: ["Poison Inevitable", "Medic Support", "Status Reaction"], stage: "mid", quality: 3 },
  "scalding-medic": { role: "defense", archetypes: ["Medic Support", "Burn Engine"], stage: "mid", quality: 3 },
  "venom-pressure-cask": { role: "terminal", archetypes: ["Poison Inevitable"], stage: "late", quality: 5 },
  "redline-finisher": { role: "terminal", archetypes: ["Crit Execution", "Blade Tempo"], stage: "late", quality: 5 },
  "steady-wall-engine": { role: "terminal", archetypes: ["Armor Terminal", "Drum Command"], stage: "late", quality: 5 },

  "iron-scout-saber": { role: "starter", archetypes: ["Blade Tempo", "Crit Execution"], stage: "early", quality: 3 },
  "flank-executioner": { role: "payoff", archetypes: ["Crit Execution", "Blade Tempo"], stage: "mid", quality: 4 },
  "command-runner": { role: "connector", archetypes: ["Drum Command", "Control Tempo"], stage: "mid", quality: 4, buildVital: true },
  "war-kettle": { role: "connector", archetypes: ["Burn Engine", "Armor Counter"], stage: "mid", quality: 4 },
  "siege-oil-chain": { role: "terminal", archetypes: ["Siege Fire", "Burn Engine", "Control Tempo"], stage: "late", quality: 5 },
  "drumline-captain": { role: "engine", archetypes: ["Drum Command", "Armor Counter"], stage: "late", quality: 5 },
  "banner-of-cinders": { role: "engine", archetypes: ["Burn Engine", "Drum Command", "Status Reaction"], stage: "mid", quality: 4 },
  "venom-quartermaster": { role: "connector", archetypes: ["Poison Inevitable", "Medic Support", "Status Reaction"], stage: "mid", quality: 4 },
  "bastion-foundry": { role: "terminal", archetypes: ["Armor Terminal"], stage: "late", quality: 6 },
  "last-order-halberd": { role: "terminal", archetypes: ["Crit Execution"], stage: "late", quality: 6 }
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
  "kindling-spear",
  "poison-needle",
  "field-medic",
  "toxic-lance",
  "war-chant",
  "mud-trap",
  "venom-leech",
  "field-triage",
  "quick-jab",
  "ember-needle",
  "venom-prick",
  "self-starting-chant",
  "menders-sash",
  "iron-scout-saber"
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
  "siege-crossbow",
  "venom-jar",
  "herbal-poultice",
  "command-banner",
  "frost-chain",
  "cold-spear",
  "rally-drummer",
  "heavy-net",
  "toxic-flame-seal",
  "fever-drum",
  "poisoned-net",
  "burning-remedy",
  "cooling-fan",
  "battlefield-metronome",
  "ash-and-venom-seal",
  "green-smoke-lantern",
  "toxin-brewer",
  "scalding-medic",
  "flank-executioner",
  "command-runner",
  "war-kettle",
  "banner-of-cinders",
  "venom-quartermaster"
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
  "siege-command",
  "rotting-wine",
  "venom-pressure-cask",
  "redline-finisher",
  "steady-wall-engine",
  "siege-oil-chain",
  "drumline-captain",
  "bastion-foundry",
  "last-order-halberd"
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
  "siege-crossbow",
  "venom-pressure-cask",
  "redline-finisher",
  "steady-wall-engine",
  "siege-oil-chain",
  "bastion-foundry",
  "last-order-halberd"
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
  "battle-standard",
  "poison-needle",
  "field-medic",
  "venom-jar",
  "war-chant",
  "mud-trap",
  "venom-leech",
  "field-triage",
  "ember-needle",
  "venom-prick",
  "menders-sash",
  "command-runner"
] as const;

export const BOSS_REWARD_POOL = [
  "iron-bastion-strike",
  "warlords-mandate",
  "execution-halberd",
  "burning-trebuchet",
  "bastion-foundry",
  "last-order-halberd",
  "redline-finisher",
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
  "Blade Tempo": ["rusty-blade", "quick-jab", "iron-scout-saber", "patrol-spear", "twin-hook", "vanguard-saber", "left-flank-blade", "execution-halberd", "duelists-dao", "redline-finisher"],
  "Burn Engine": ["oil-flask", "flame-spear", "ember-needle", "fire-arrow-cart", "ember-banner", "cinder-seal", "kindling-spear", "siege-brazier", "war-kettle", "banner-of-cinders"],
  "Armor Counter": ["wooden-shield", "iron-guard", "shield-wall", "counter-stance", "veteran-plate", "frontline-bulwark", "menders-sash", "war-kettle", "drumline-captain"],
  "Drum Command": ["field-drum", "spark-drum", "cooling-fan", "command-runner", "battlefield-metronome", "rallying-beat", "war-drum", "command-gong", "discipline-drill", "signal-tower", "drumline-captain"],
  "Siege Fire": ["siege-crossbow", "fire-arrow-cart", "war-drum", "flame-ram", "burning-trebuchet", "fire-cart-battery", "siege-command", "siege-oil-chain"],
  "Hybrid Bruiser": ["militia-spear", "guarded-torch", "spear-and-shield-line", "frontline-banner", "guard-captain", "burning-shield", "warlords-mandate"],
  "Armor Terminal": ["iron-guard", "shield-wall", "veteran-plate", "battle-standard", "frontline-bulwark", "iron-bastion-strike", "steady-wall-engine", "bastion-foundry"],
  "Crit Execution": ["iron-scout-saber", "flank-executioner", "execution-halberd", "captains-finisher", "duelists-dao", "vanguard-saber", "discipline-drill", "redline-finisher", "last-order-halberd"],
  "Poison Inevitable": ["poison-needle", "venom-prick", "toxic-lance", "venom-jar", "rotting-wine", "field-medic", "venom-pressure-cask", "venom-quartermaster"],
  "Medic Support": ["field-medic", "herbal-poultice", "wooden-shield", "frontline-banner", "iron-guard", "menders-sash", "toxin-brewer", "scalding-medic", "venom-quartermaster"],
  "Control Tempo": ["war-chant", "self-starting-chant", "battlefield-metronome", "mud-trap", "command-banner", "frost-chain", "cold-spear", "rally-drummer", "heavy-net", "poisoned-net", "green-smoke-lantern", "siege-oil-chain"],
  "Status Reaction": ["venom-leech", "toxic-flame-seal", "fever-drum", "field-triage", "poisoned-net", "burning-remedy", "ash-and-venom-seal", "green-smoke-lantern", "menders-sash", "toxin-brewer", "banner-of-cinders", "venom-quartermaster"]
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

export function isTerminalOrHighQualityBuildCard(cardId: string): boolean {
  const metadata = getCardPoolMetadata(cardId);
  if (!metadata) {
    return false;
  }
  if (metadata.role === "terminal") {
    return true;
  }
  return metadata.quality >= 5 && (metadata.role === "engine" || metadata.role === "payoff");
}

export function isHighQualityShopCard(cardId: string): boolean {
  const metadata = getCardPoolMetadata(cardId);
  if (!metadata || metadata.quality < 5) {
    return false;
  }
  return metadata.role === "terminal" ||
    metadata.role === "payoff" ||
    metadata.role === "engine" ||
    metadata.role === "connector";
}

export function filterKnownCards(
  cardIds: readonly string[],
  cardDefinitionsById: ReadonlyMap<string, CardDefinition>
): readonly string[] {
  return cardIds.filter((cardId) => cardDefinitionsById.has(cardId));
}
