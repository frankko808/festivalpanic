import type { DialogueScript } from "../../dialogue/types";

export const planningIntroduction: DialogueScript = {
  id: "planning-introduction",
  start: "build-festival",
  nodes: {
    "build-festival": {
      id: "build-festival",
      speaker: "Rudi",
      text: "Hier bauen wir jetzt unser Festival.",
      next: "decisions",
    },
    decisions: {
      id: "decisions",
      speaker: "Rudi",
      text: "Jede Entscheidung verändert Kosten und Zustimmung. Dein Ziel bleibt simpel.",
      next: "goal",
    },
    goal: {
      id: "goal",
      speaker: "Ziel",
      text: "MINDESTENS 7 STIMMEN",
    },
  },
};

export function planningResultText(votes: number): string {
  if (votes <= 3) {
    return "Mit diesem Entwurf tragen nur wenige Gruppen das Fest. Wir sollten die Gründe noch einmal ansehen.";
  }
  if (votes <= 6) {
    return "Fast, aber noch keine Mehrheit. Ein gezielter Kompromiss könnte den Unterschied machen.";
  }
  if (votes <= 9) {
    return "Das würde durchkommen. Jetzt könnten wir abstimmen. Oder wir versuchen, es besser zu machen.";
  }
  return "Eine breite Mehrheit. Der Plan berücksichtigt offenbar mehrere Interessen.";
}

export function createPlanningResultDialogue(votes: number): DialogueScript {
  return {
    id: `planning-result-${votes}`,
    start: "result",
    nodes: {
      result: {
        id: "result",
        speaker: "Rudi",
        text: planningResultText(votes),
      },
    },
  };
}
