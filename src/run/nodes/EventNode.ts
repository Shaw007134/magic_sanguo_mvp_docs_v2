import type { CardDefinition } from "../../model/card.js";
import { shuffleDeterministic } from "../deterministic.js";
import type { EventChoice } from "../RunState.js";

const CARD_EVENT_CHOICES = [
  { label: "Take a Rusty Blade", cardDefinitionId: "rusty-blade" },
  { label: "Take a Wooden Shield", cardDefinitionId: "wooden-shield" },
  { label: "Take an Oil Flask", cardDefinitionId: "oil-flask" },
  { label: "Take an Iron Guard", cardDefinitionId: "iron-guard" },
  { label: "Take a Militia Spear", cardDefinitionId: "militia-spear" }
] as const;

export function createEventChoices(input: {
  readonly seed: string;
  readonly nodeIndex: number;
  readonly cardDefinitionsById?: ReadonlyMap<string, CardDefinition>;
  readonly starter?: boolean;
}): readonly EventChoice[] {
  const availableCardChoices = CARD_EVENT_CHOICES.filter((choice) =>
    input.cardDefinitionsById ? input.cardDefinitionsById.has(choice.cardDefinitionId) : true
  );
  const cardChoices = input.starter
    ? availableCardChoices
    : shuffleDeterministic(availableCardChoices, `${input.seed}:event:${input.nodeIndex}`);

  const choices: EventChoice[] = [
    {
      id: `event-${input.nodeIndex}-card-0`,
      type: "EVENT_CARD",
      label: cardChoices[0]?.label ?? "Take a Rusty Blade",
      cardDefinitionId: cardChoices[0]?.cardDefinitionId ?? "rusty-blade"
    },
    {
      id: `event-${input.nodeIndex}-card-1`,
      type: "EVENT_CARD",
      label: cardChoices[1]?.label ?? "Take a Wooden Shield",
      cardDefinitionId: cardChoices[1]?.cardDefinitionId ?? "wooden-shield"
    },
    {
      id: `event-${input.nodeIndex}-gold`,
      type: "EVENT_GOLD",
      label: "Take 3 gold",
      gold: 3
    },
    {
      id: `event-${input.nodeIndex}-heal`,
      type: "EVENT_HEAL",
      label: "Rest for 8 HP",
      heal: 8
    }
  ];
  return choices.slice(0, 3);
}
