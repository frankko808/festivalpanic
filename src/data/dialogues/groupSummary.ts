import type { DialogueScript } from "../../dialogue/types";

export const groupSummary: DialogueScript = {
  id: "group-summary",
  start: "four-groups",
  nodes: {
    "four-groups": {
      id: "four-groups",
      speaker: "Rudi",
      text: "Gut. Vier Gruppen.",
      next: "four-festivals",
    },
    "four-festivals": {
      id: "four-festivals",
      speaker: "Rudi",
      text: "Alle wollen ein Festival. Nur leider vier verschiedene.",
      choices: [
        { id: "seek-compromise", label: "Dann brauchen wir einen Kompromiss.", next: "reply-democratic" },
        { id: "seek-seven-votes", label: "Dann suchen wir sieben Stimmen.", next: "reply-mathematical" },
        { id: "cancel-festival", label: "Dann sagen wir das Festival ab.", next: "reply-resignation" },
      ],
    },
    "reply-democratic": {
      id: "reply-democratic",
      speaker: "Rudi",
      text: "Sehr demokratisch von dir.",
    },
    "reply-mathematical": {
      id: "reply-mathematical",
      speaker: "Rudi",
      text: "Sehr mathematisch von dir.",
    },
    "reply-resignation": {
      id: "reply-resignation",
      speaker: "Rudi",
      text: "Noch nicht. Jetzt kennen wir die Gründe der Gruppen – damit können wir arbeiten.",
    },
  },
};
