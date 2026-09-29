import type { DialogueScript } from "../../dialogue/types";
import type { GroupId } from "../festivalRules";

export const groupFollowUps: Readonly<Record<GroupId, DialogueScript>> = {
  "young-list": {
    id: "mia-follow-up",
    start: "reminder",
    nodes: {
      reminder: {
        id: "reminder",
        speaker: "Mia",
        text: "Große Bühne, Mitternacht. Das wäre für die Bands ideal. Mir ist klar, dass die Nachbarschaft das anders sieht.",
        next: "context",
      },
      context: { id: "context", speaker: "Mia", text: "Uns geht es nicht nur um Lautstärke. Jugendliche brauchen einen Ort, an dem sie sichtbar Teil dieser Stadt sind." },
    },
  },
  "citizens-forum": {
    id: "broemmel-follow-up",
    start: "reminder",
    nodes: {
      reminder: {
        id: "reminder",
        speaker: "Herr Brömmel",
        text: "22 Uhr, Sicherheitsteam und morgens keine Flaschen vor meiner Haustür.",
        next: "context",
      },
      context: { id: "context", speaker: "Herr Brömmel", text: "Ich will das Fest nicht verhindern. Ich möchte nur am nächsten Morgen meine Straße wiedererkennen." },
    },
  },
  "green-local": {
    id: "nora-follow-up",
    start: "reminder",
    nodes: {
      reminder: {
        id: "reminder",
        speaker: "Nora",
        text: "Spätestens 23 Uhr, Pfandsystem und mindestens 75 Prozent lokale Stände.",
        next: "context",
      },
      context: { id: "context", speaker: "Nora", text: "Ein gutes Fest darf Spaß machen, ohne seinen Müll und sein Geld anschließend aus der Stadt zu tragen." },
    },
  },
  "budget-hawks": {
    id: "centner-follow-up",
    start: "reminder",
    nodes: {
      reminder: {
        id: "reminder",
        speaker: "Herr Centner",
        text: "Höchstens 20.000 Euro. Die Grenze muss im endgültigen Plan nachvollziehbar bleiben.",
        next: "context",
      },
      context: { id: "context", speaker: "Herr Centner", text: "Ich bin nicht gegen Freude. Ich bin gegen Freude, deren Rechnung erst im nächsten Haushalt auftaucht." },
    },
  },
};
