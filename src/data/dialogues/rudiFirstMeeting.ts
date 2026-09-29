import type { DialogueScript } from "../../dialogue/types";

export const rudiFirstMeeting: DialogueScript = {
  id: "rudi-first-meeting",
  start: "rudi-hi",
  nodes: {
    "rudi-hi": {
      id: "rudi-hi",
      speaker: "Rudi",
      text: "Hi.",
      choices: [
        { id: "say-hi", label: "Hi.", next: "reply-hi" },
        { id: "ask-raccoon", label: "Bist du ein Waschbär?", next: "reply-raccoon" },
        { id: "ask-speaking", label: "Warum sprichst du?", next: "reply-speaking" },
      ],
    },
    "reply-hi": {
      id: "reply-hi",
      speaker: "Rudi",
      text: "Starker Anfang.",
      next: "rudi-name",
    },
    "reply-raccoon": {
      id: "reply-raccoon",
      speaker: "Rudi",
      text: "Verfassungsrechtlich nicht abschließend geklärt.",
      next: "rudi-name",
    },
    "reply-speaking": {
      id: "reply-speaking",
      speaker: "Rudi",
      text: "Wir haben nur sechzig Minuten. Akzeptier es.",
      next: "rudi-name",
    },
    "rudi-name": {
      id: "rudi-name",
      speaker: "Rudi",
      text: "Ich bin Rudi.",
      next: "festival-was-planned",
    },
    "festival-was-planned": {
      id: "festival-was-planned",
      speaker: "Rudi",
      text: "Das Sommerfest sollte morgen stattfinden.",
      next: "festival-should",
    },
    "festival-should": {
      id: "festival-should",
      speaker: "Rudi",
      text: "Sollte.",
    },
  },
};
