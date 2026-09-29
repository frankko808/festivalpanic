import type { GroupId } from "./festivalRules";

export type ArgumentCardId =
  | "youth-culture"
  | "resident-protection"
  | "sustainability"
  | "budget-discipline";

export interface ArgumentCardDefinition {
  id: ArgumentCardId;
  groupId: GroupId;
  title: string;
  description: string;
}

export const ARGUMENT_CARDS: Readonly<Record<ArgumentCardId, ArgumentCardDefinition>> = {
  "youth-culture": {
    id: "youth-culture",
    groupId: "young-list",
    title: "JUGENDKULTUR",
    description: "Jugendliche brauchen öffentliche Orte für Freizeit, Kultur und Begegnung.",
  },
  "resident-protection": {
    id: "resident-protection",
    groupId: "citizens-forum",
    title: "ANWOHNERSCHUTZ",
    description: "Politische Entscheidungen betreffen unterschiedliche Gruppen und ihre Interessen.",
  },
  sustainability: {
    id: "sustainability",
    groupId: "green-local",
    title: "NACHHALTIGKEIT",
    description: "Ökologische und lokale Interessen können politische Entscheidungen beeinflussen.",
  },
  "budget-discipline": {
    id: "budget-discipline",
    groupId: "budget-hawks",
    title: "HAUSHALTSDISZIPLIN",
    description: "Politische Vorhaben müssen auch finanziert werden.",
  },
};

export const ARGUMENT_CARD_ORDER: readonly ArgumentCardId[] = [
  "youth-culture",
  "resident-protection",
  "sustainability",
  "budget-discipline",
];
