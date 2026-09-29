import { describe, expect, it } from "vitest";
import { planningResultText } from "../data/dialogues/planning";
import {
  DEFAULT_FESTIVAL_PLAN,
  calculatePlanCost,
  calculateSupport,
  type FestivalPlan,
} from "../data/festivalRules";
import { PLANNING_MODULES, updatePlanModule } from "../data/planningOptions";
import { gameState } from "../state/GameState";

const majorityPlan: FestivalPlan = {
  endTime: 22,
  stage: "small",
  security: "extra-team",
  cups: "deposit",
  localShare: 75,
};

function unlockPlanning(): void {
  gameState.resetRun();
  gameState.completeGroupInterview("young-list", "youth-culture");
  gameState.completeGroupInterview("citizens-forum", "resident-protection");
  gameState.completeGroupInterview("green-local", "sustainability");
  gameState.completeGroupInterview("budget-hawks", "budget-discipline");
  gameState.completeGroupSummary("seek-compromise");
}

describe("Planungspult", () => {
  it("startet mit dem Grundentwurf und zwei Sparfuchs-Stimmen", () => {
    expect(calculatePlanCost(DEFAULT_FESTIVAL_PLAN)).toBe(15_000);
    expect(calculateSupport(DEFAULT_FESTIVAL_PLAN)).toEqual({
      supporters: ["budget-hawks"],
      votes: 2,
      hasMajority: false,
    });
  });

  it("bietet genau fünf konfigurierbare Festivalmodule", () => {
    expect(PLANNING_MODULES.map((module) => module.id)).toEqual([
      "endTime",
      "stage",
      "security",
      "cups",
      "localShare",
    ]);
    expect(PLANNING_MODULES.every((module) => module.options.length >= 2)).toBe(true);
  });

  it("ändert einen Entwurf unveränderlich", () => {
    const changed = updatePlanModule(DEFAULT_FESTIVAL_PLAN, "endTime", 24);
    expect(changed.endTime).toBe(24);
    expect(DEFAULT_FESTIVAL_PLAN.endTime).toBe(22);
  });

  it("erkennt alle inhaltlich kompatiblen Gruppen", () => {
    expect(calculatePlanCost(majorityPlan)).toBe(21_000);
    expect(calculateSupport(majorityPlan)).toEqual({
      supporters: ["citizens-forum", "green-local"],
      votes: 6,
      hasMajority: false,
    });
  });

  it("macht eine Mehrheit vor den Verhandlungen für jede Kombination unmöglich", () => {
    const votes: number[] = [];

    for (const endTime of [22, 23, 24] as const) {
      for (const stage of ["small", "large"] as const) {
        for (const security of ["standard", "extra-team"] as const) {
          for (const cups of ["single-use", "deposit"] as const) {
            for (const localShare of [0, 50, 75] as const) {
              const support = calculateSupport({
                endTime,
                stage,
                security,
                cups,
                localShare,
              });
              votes.push(support.votes);
              expect(support.hasMajority).toBe(false);
            }
          }
        }
      }
    }

    expect(Math.max(...votes)).toBeLessThan(7);
  });

  it.each([
    [2, "nur wenige Gruppen"],
    [6, "noch keine Mehrheit"],
    [8, "Das würde durchkommen"],
    [11, "Eine breite Mehrheit"],
  ])("liefert für %i Stimmen Rudis vorgesehenen Kommentar", (votes, excerpt) => {
    expect(planningResultText(votes)).toContain(excerpt);
  });
});

describe("Planungsfortschritt", () => {
  it("speichert vor Freischaltung des Mehrheitsblicks keinen Entwurf", () => {
    gameState.resetRun();
    expect(gameState.saveFirstFestivalDraft(majorityPlan)).toBe(false);
    expect(gameState.current.planning.savedPlan).toBeUndefined();
  });

  it("speichert den ersten Entwurf genau einmal und startet drei Gesprächsmarken", () => {
    unlockPlanning();
    expect(gameState.saveFirstFestivalDraft(majorityPlan)).toBe(true);
    expect(gameState.saveFirstFestivalDraft(DEFAULT_FESTIVAL_PLAN)).toBe(false);
    expect(gameState.current.planning.savedPlan).toEqual(majorityPlan);

    expect(gameState.startNegotiationQuest()).toBe(true);
    expect(gameState.startNegotiationQuest()).toBe(false);
    expect(gameState.current.quest.negotiationTokensRemaining).toBe(3);
    expect(gameState.current.phase).toBe("negotiation");
  });
});
