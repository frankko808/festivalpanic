import type { DialogueScript } from "../../dialogue/types";

export const noraFirstMeeting: DialogueScript = {
  id: "nora-first-meeting",
  start: "park-thanks",
  nodes: {
    "park-thanks": {
      id: "park-thanks",
      speaker: "Nora",
      text: "Danke fürs Aufräumen. Der Park ist keine Kulisse – montags spielen hier Kinder, und morgens fressen die Enten leider alles, was glänzt.",
      next: "park-context",
    },
    "park-context": {
      id: "park-context",
      speaker: "Nora",
      text: "Beim letzten Fest waren die Wege am nächsten Tag voller Becher und Verpackungen. Deshalb bin ich bei neuen Versprechen etwas allergisch.",
      next: "nora-opening",
    },
    "nora-opening": {
      id: "nora-opening",
      speaker: "Nora",
      text: "Bevor wir über Stimmen reden: Was war von dem Müll eben am auffälligsten?",
      choices: [
        { id: "plastic-cup", label: "Plastikbecher.", next: "reply-plastic" },
        { id: "pizza-box", label: "Pizzakarton.", next: "reply-pizza" },
        { id: "trash-bin", label: "Mülleimer.", next: "reply-trash" },
      ],
    },
    "reply-plastic": {
      id: "reply-plastic",
      speaker: "Nora",
      text: "Genau.",
      next: "waste-last-year",
    },
    "reply-pizza": {
      id: "reply-pizza",
      speaker: "Nora",
      text: "Auch.",
      next: "waste-last-year",
    },
    "reply-trash": {
      id: "reply-trash",
      speaker: "Nora",
      text: "Ja. Und er hilft nur, wenn die Becher auch hineingelangen.",
      next: "waste-last-year",
    },
    "waste-last-year": {
      id: "waste-last-year",
      speaker: "Nora",
      text: "Letztes Jahr hatten wir nach dem Festival fast zweihundert Säcke Müll.",
      next: "rudi-cup",
    },
    "rudi-cup": {
      id: "rudi-cup",
      speaker: "Rudi",
      text: "Dann sollten wir ihm wenigstens keinen zweiten Sommer im Park gönnen.",
      next: "nora-demands",
    },
    "nora-demands": {
      id: "nora-demands",
      speaker: "Nora",
      text: "Wir stimmen nur zu, wenn um spätestens 23 Uhr Schluss ist, es ein Pfandsystem gibt und lokale Betriebe auf dem Fest stehen.",
      next: "green-demands",
    },
    "green-demands": {
      id: "green-demands",
      speaker: "Grün & Lokal · 3 Stimmen",
      text: "Forderungen: Ende spätestens 23 Uhr + Pfandsystem + mindestens 75 % lokale Stände.",
      choices: [
        { id: "why-local", label: "Warum lokale Stände?", next: "reply-local" },
        { id: "much", label: "75 Prozent ist ziemlich viel.", next: "reply-negotiate" },
        { id: "deposit", label: "Pfandsystem klingt machbar.", next: "reply-friends" },
      ],
    },
    "reply-local": {
      id: "reply-local",
      speaker: "Nora",
      text: "Weil das Fest auch der Stadt wirtschaftlich etwas bringen soll. Und weil wir für Pommes keine Lieferkette über drei Länder brauchen.",
    },
    "reply-negotiate": {
      id: "reply-negotiate",
      speaker: "Nora",
      text: "Deshalb verhandeln wir ja.",
    },
    "reply-friends": {
      id: "reply-friends",
      speaker: "Nora",
      text: "Dann sind wir zumindest bei einem Punkt schon Freunde.",
    },
  },
};
