import type { DialogueScript } from "../../dialogue/types";

export const miaFirstMeeting: DialogueScript = {
  id: "mia-first-meeting",
  start: "kai-opening",
  nodes: {
    "kai-opening": {
      id: "kai-opening",
      speaker: "Mia",
      text: "Vorsicht, nicht auf das Kabel treten. Kalle behauptet, es sei stromlos. Kalle behauptet vieles.",
      next: "soundcheck",
    },
    soundcheck: {
      id: "soundcheck",
      speaker: "Mia",
      text: "Wir versuchen hier seit Wochen, einen Proberaum und eine kleine Open-Air-Bühne durchzubekommen. Und jetzt soll sogar das Sommerfest gestrichen werden.",
      next: "mia-opening",
    },
    "mia-opening": {
      id: "mia-opening",
      speaker: "Mia",
      text: "Bitte sag mir, dass du wegen des Festivals hier bist – und nicht wegen einer weiteren Lärmmessung.",
      choices: [
        { id: "ask-plan", label: "Was ist euer Problem mit dem bisherigen Plan?", next: "reply-plan" },
        { id: "ask-price", label: "Ihr habt vier Stimmen. Was kostet mich das?", next: "reply-price" },
        { id: "one-evening", label: "Das Festival ist doch nur einen Abend.", next: "reply-evening" },
      ],
    },
    "reply-plan": {
      id: "reply-plan",
      speaker: "Mia",
      text: "Das bisherige Konzept endet um 22 Uhr. Um 22 Uhr gehe ich normalerweise erst los.",
      next: "mia-demands",
    },
    "reply-price": {
      id: "reply-price",
      speaker: "Mia",
      text: "Es geht uns nicht darum, Stimmen zu verkaufen. Wir möchten, dass junge Leute im Programm vorkommen.",
      next: "rudi-both",
    },
    "rudi-both": {
      id: "rudi-both",
      speaker: "Rudi",
      text: "Fairer Hinweis. Fragen wir nach dem Programm.",
      next: "mia-demands",
    },
    "reply-evening": {
      id: "reply-evening",
      speaker: "Mia",
      text: "Genau. Deshalb könnte es wenigstens ein guter Abend sein.",
      next: "mia-demands",
    },
    "mia-demands": {
      id: "mia-demands",
      speaker: "Mia",
      text: "Wir wollen eine richtige Bühne. Und wenn schon Sommerfest, dann bis Mitternacht.",
      next: "young-list-demands",
    },
    "young-list-demands": {
      id: "young-list-demands",
      speaker: "Junge Liste · 4 Stimmen",
      text: "Forderungen: große Bühne + Ende 24 Uhr.",
      choices: [
        { id: "understood", label: "Verstanden.", next: "player-understood" },
        { id: "demanding", label: "Ganz schön anspruchsvoll.", next: "mia-ambitious" },
      ],
    },
    "player-understood": {
      id: "player-understood",
      speaker: "Du",
      text: "Verstanden.",
    },
    "mia-ambitious": {
      id: "mia-ambitious",
      speaker: "Mia",
      text: "Wir nennen es ambitioniert.",
    },
  },
};
