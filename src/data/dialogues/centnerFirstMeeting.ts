import type { DialogueScript } from "../../dialogue/types";

export const centnerFirstMeeting: DialogueScript = {
  id: "centner-first-meeting",
  start: "foyer-opening",
  nodes: {
    "foyer-opening": {
      id: "foyer-opening",
      speaker: "Herr Centner",
      text: "Da sind meine Belege. Ein Windstoß, ein offenes Fenster und plötzlich führt der Marktplatz meine Buchhaltung.",
      next: "receipt-thanks",
    },
    "receipt-thanks": {
      id: "receipt-thanks",
      speaker: "Herr Centner",
      text: "Danke. Jetzt kann ich die Kosten wieder nachvollziehen. Setzen wir uns kurz an die Zahlen.",
      next: "centner-opening",
    },
    "centner-opening": {
      id: "centner-opening",
      speaker: "Herr Centner",
      text: "Haben Sie schon eine Kostenschätzung für das Festival?",
      choices: [
        { id: "hello", label: "Hallo erstmal.", next: "reply-hello" },
        { id: "what", label: "Was?", next: "reply-what" },
        { id: "unknown", label: "Noch wissen wir das nicht.", next: "reply-unknown" },
      ],
    },
    "reply-hello": {
      id: "reply-hello",
      speaker: "Herr Centner",
      text: "Entschuldigung. Guten Tag. Ich hatte gerade drei fehlende Belege und eine offene Rechnung im Kopf.",
      next: "rudi-likes",
    },
    "rudi-likes": {
      id: "rudi-likes",
      speaker: "Rudi",
      text: "Dann wissen wir immerhin, womit wir das Gespräch anfangen.",
      next: "budget-limit",
    },
    "reply-what": {
      id: "reply-what",
      speaker: "Herr Centner",
      text: "Das Festival.",
      next: "budget-limit",
    },
    "reply-unknown": {
      id: "reply-unknown",
      speaker: "Herr Centner",
      text: "Dann sollten wir rechnen, bevor wir jemandem etwas versprechen.",
      next: "budget-limit",
    },
    "budget-limit": {
      id: "budget-limit",
      speaker: "Herr Centner",
      text: "Wir sind nicht grundsätzlich gegen das Fest. Aber die Stadt gibt höchstens zwanzigtausend Euro aus.",
      next: "hawks-condition",
    },
    "hawks-condition": {
      id: "hawks-condition",
      speaker: "Sparfüchse · 2 Stimmen",
      text: "Bedingung: Gesamtkosten höchstens 20.000 EUR.",
      choices: [
        { id: "one-euro", label: "Und wenn es 20.001 EUR kostet?", next: "reply-no" },
        { id: "besides-money", label: "Was ist Ihnen denn wichtig außer Geld?", next: "reply-less" },
        { id: "understood", label: "Verstanden.", next: "player-understood" },
      ],
    },
    "reply-no": {
      id: "reply-no",
      speaker: "Herr Centner",
      text: "Nein.",
    },
    "reply-less": {
      id: "reply-less",
      speaker: "Herr Centner",
      text: "Dass die Kosten verlässlich sind. Ein günstiger Plan, der später teurer wird, hilft niemandem.",
    },
    "player-understood": {
      id: "player-understood",
      speaker: "Du",
      text: "Verstanden.",
    },
  },
};
