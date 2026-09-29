import type { FestivalPlan } from "./festivalRules";

export interface FestivalStagePresentation {
  stageCount: 1 | 2;
  mainLabel: string;
  mainCrowd: number;
  sideLabel?: string;
  sideCrowd: number;
  mood: string;
}

/**
 * Turns the abstract stage choice into a concrete festival layout. The larger
 * concepts can support a second, smaller performance area without adding a
 * second planning option to the political rules.
 */
export function getFestivalStagePresentation(plan: FestivalPlan): FestivalStagePresentation {
  switch (plan.stage) {
    case "small":
      return {
        stageCount: 1,
        mainLabel: "MARKTPLATZBÜHNE",
        mainCrowd: 18,
        sideCrowd: 0,
        mood: "Klein, nahbar und erstaunlich tanzbar",
      };
    case "large":
      return {
        stageCount: 2,
        mainLabel: "GROSSE FESTIVALBÜHNE",
        mainCrowd: 24,
        sideLabel: "DJ-HOF",
        sideCrowd: 14,
        mood: "Großes Programm auf zwei gut besuchten Flächen",
      };
    case "newcomer":
      return {
        stageCount: 2,
        mainLabel: "NEWCOMER-BÜHNE",
        mainCrowd: 21,
        sideLabel: "AKUSTIK-ECKE",
        sideCrowd: 14,
        mood: "Lokale Talente auf zwei lebendigen Bühnen",
      };
  }
}
