import type { DialogueScript } from "../../dialogue/types";

export const broemmelFirstMeeting: DialogueScript = {
  id: "broemmel-first-meeting",
  start: "street-opening",
  nodes: {
    "street-opening": {
      id: "street-opening",
      speaker: "Herr Brömmel",
      text: "Entschuldigen Sie. Ich sammle gerade die Kronkorken vom letzten Stadtfest ein. Es ist September.",
      next: "neighbourhood",
    },
    neighbourhood: {
      id: "neighbourhood",
      speaker: "Herr Brömmel",
      text: "Ich wohne direkt gegenüber der Bühne. Wenn der Bass einsetzt, vibriert bei uns das Gewürzregal nach alphabetischer Reihenfolge.",
      next: "broemmel-opening",
    },
    "broemmel-opening": {
      id: "broemmel-opening",
      speaker: "Herr Brömmel",
      text: "Sie gehören doch zu dem Festival, oder?",
      choices: [
        { id: "yes", label: "Ja.", next: "reply-yes" },
        { id: "how-know", label: "Woher wissen Sie das?", next: "reply-how-know" },
        { id: "depends", label: "Kommt darauf an, ob Sie dafür sind.", next: "reply-depends" },
      ],
    },
    "reply-yes": {
      id: "reply-yes",
      speaker: "Herr Brömmel",
      text: "Dachte ich mir.",
      next: "young-people",
    },
    "reply-how-know": {
      id: "reply-how-know",
      speaker: "Herr Brömmel",
      text: "Sie stehen neben einem Waschbären mit Namensschild.",
      next: "rudi-point",
    },
    "rudi-point": {
      id: "rudi-point",
      speaker: "Rudi",
      text: "Er hat einen Punkt.",
      next: "young-people",
    },
    "reply-depends": {
      id: "reply-depends",
      speaker: "Herr Brömmel",
      text: "Dann lautet meine Antwort: kommt darauf an.",
      next: "young-people",
    },
    "young-people": {
      id: "young-people",
      speaker: "Herr Brömmel",
      text: "Ich möchte, dass junge Menschen hier feiern können.",
      next: "not-hear",
    },
    "not-hear": {
      id: "not-hear",
      speaker: "Herr Brömmel",
      text: "Aber Menschen wohnen direkt am Platz. Auch deren Abend zählt.",
      next: "last-year",
    },
    "last-year": {
      id: "last-year",
      speaker: "Herr Brömmel",
      text: "Letztes Jahr lagen morgens Flaschen vor unserer Haustür. Wir wollen deshalb zwei Dinge.",
      next: "forum-demands",
    },
    "forum-demands": {
      id: "forum-demands",
      speaker: "Bürgerforum · 3 Stimmen",
      text: "Forderungen: Ende spätestens 22 Uhr + zusätzliches Sicherheitsteam.",
      choices: [
        {
          id: "contradiction",
          label: "Das widerspricht ziemlich genau der Jungen Liste.",
          next: "reply-interests",
        },
        { id: "problem", label: "Dann haben wir ein Problem.", next: "reply-your-problem" },
        { id: "too-early", label: "22 Uhr ist wirklich früh.", next: "reply-night" },
      ],
    },
    "reply-interests": {
      id: "reply-interests",
      speaker: "Herr Brömmel",
      text: "Das nennt man unterschiedliche Interessen.",
      next: "rudi-job",
    },
    "rudi-job": {
      id: "rudi-job",
      speaker: "Rudi",
      text: "Das bekommen wir nur mit einem konkreten Zeit- und Sicherheitsplan zusammen.",
    },
    "reply-your-problem": {
      id: "reply-your-problem",
      speaker: "Herr Brömmel",
      text: "Sie haben ein Problem.",
    },
    "reply-night": {
      id: "reply-night",
      speaker: "Herr Brömmel",
      text: "Ich bin 58. Für mich ist 22 Uhr praktisch Nacht.",
    },
  },
};
