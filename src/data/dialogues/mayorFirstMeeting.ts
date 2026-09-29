import type { DialogueScript } from "../../dialogue/types";

export const mayorFirstMeeting: DialogueScript = {
  id: "mayor-first-meeting",
  start: "mayor-help",
  nodes: {
    "mayor-help": {
      id: "mayor-help",
      speaker: "Bürgermeisterin",
      text: "Endlich Hilfe!",
      next: "council-vote",
    },
    "council-vote": {
      id: "council-vote",
      speaker: "Bürgermeisterin",
      text: "Der Stadtrat muss heute über das Sommerfest abstimmen.",
      next: "council-majority",
    },
    "council-majority": {
      id: "council-majority",
      speaker: "Bürgermeisterin",
      text: "Zwölf Ratsmitglieder. Wir brauchen sieben Stimmen.",
      next: "groups-hate-plan",
    },
    "groups-hate-plan": {
      id: "groups-hate-plan",
      speaker: "Bürgermeisterin",
      text: "Der bisherige Entwurf überzeugt keine der vier Gruppen. Jede hat andere Gründe dafür.",
      choices: [
        { id: "ask-demands", label: "Was wollen die denn?", next: "reply-find-out" },
        { id: "vote-anyway", label: "Dann stimmen Sie einfach trotzdem ab.", next: "reply-lose" },
        { id: "their-problem", label: "Können wir die Einwände übergehen?", next: "reply-our-problem" },
      ],
    },
    "reply-find-out": {
      id: "reply-find-out",
      speaker: "Bürgermeisterin",
      text: "Genau das müssen Sie herausfinden.",
      next: "locations",
    },
    "reply-lose": {
      id: "reply-lose",
      speaker: "Bürgermeisterin",
      text: "Das könnten wir. Dann verlieren wir.",
      next: "locations",
    },
    "reply-our-problem": {
      id: "reply-our-problem",
      speaker: "Bürgermeisterin",
      text: "Dann hätten wir weder eine Mehrheit noch ein Fest, das von der Stadt getragen wird.",
      next: "rudi-empty-market",
    },
    "rudi-empty-market": {
      id: "rudi-empty-market",
      speaker: "Rudi",
      text: "Ein leerer Marktplatz wäre jedenfalls keine gute Lösung.",
      next: "locations",
    },
    locations: {
      id: "locations",
      speaker: "Bürgermeisterin",
      text: "Brömmel ist im Wohnviertel. Mia hilft am Kulturkai, Nora arbeitet im Stadtpark und Herr Centner sitzt im Rathausfoyer. Reden Sie mit ihnen – nicht nur über sie.",
      next: "rudi-map",
    },
    "rudi-map": {
      id: "rudi-map",
      speaker: "Rudi",
      text: "Vier Gruppen, drei Stadtteile und ich habe sehr kurze Beine. Los geht's.",
    },
  },
};
