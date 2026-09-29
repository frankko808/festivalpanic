import { beforeEach, describe, expect, it } from "vitest";
import { ACHIEVEMENTS, evaluatePlanAchievements } from "../data/achievements";
import { festivalMayorDialogue } from "../data/dialogues/festivalOutro";
import { createFestivalOutroMoments } from "../data/festivalOutroMoments";
import { DEFAULT_NEGOTIATION_FLAGS, type FestivalPlan } from "../data/festivalRules";
import { DialogueController } from "../dialogue/DialogueController";
import { gameState } from "../state/GameState";
import { loadSave } from "../state/storage";
import { formatDuration } from "../utils/formatDuration";
import { vi } from "vitest";

describe("Spielzeit und Festival-Erfolge", () => {
  beforeEach(() => gameState.resetRun());

  it("misst den aktiven Durchlauf über Szenen hinweg, aber nicht Titel oder Ergebnis", () => {
    gameState.advanceTime(500);
    expect(gameState.current.elapsedMs).toBe(0);
    gameState.setPhase("town-intro");
    gameState.advanceTime(200);
    gameState.setPhase("festival");
    gameState.advanceTime(150);
    expect(formatDuration(gameState.current.elapsedMs)).toBe("00:00");
    expect(gameState.current.elapsedMs).toBe(350);
    gameState.setPhase("results");
    gameState.advanceTime(200);
    expect(gameState.current.elapsedMs).toBe(350);
    expect(formatDuration(61_000)).toBe("01:01");
  });

  it("enthält weder den entfernten Akh-Erfolg noch einen Hoodie", () => {
    const plan: FestivalPlan = { endTime: 23, stage: "large", security: "standard", cups: "deposit", localShare: 50 };
    expect(evaluatePlanAchievements(plan, { ...DEFAULT_NEGOTIATION_FLAGS, youngListAccepts23: true })).not.toContain("akh-status");
    expect(Object.keys(ACHIEVEMENTS)).not.toContain("akh-status");
    vi.stubGlobal("window", { localStorage: { getItem: () => JSON.stringify({ highScore: 42, achievements: ["akh-status", "find-rudi"], equippedSkin: "akh-hoodie", unlockedSkins: ["default", "akh-hoodie"] }) } });
    expect(loadSave()).toMatchObject({ highScore: 42, achievements: ["find-rudi"] });
    expect(loadSave()).not.toHaveProperty("equippedSkin");
    expect(loadSave()).not.toHaveProperty("unlockedSkins");
    vi.unstubAllGlobals();
  });

  it("unterscheidet streng unter 20.000 € von genau 20.000 €", () => {
    const low: FestivalPlan = { endTime: 22, stage: "small", security: "standard", cups: "deposit", localShare: 50 };
    expect(evaluatePlanAchievements(low, DEFAULT_NEGOTIATION_FLAGS)).toContain("peter-zwegert");
    const exact: FestivalPlan = { ...low, stage: "large", cups: "single-use" };
    expect(evaluatePlanAchievements(exact, DEFAULT_NEGOTIATION_FLAGS)).not.toContain("peter-zwegert");
  });

  it("lässt Rudi nach abgebrochener Suche verschwunden, bis er gefunden wurde", () => {
    gameState.startRudiSearch();
    expect(gameState.current.festivalActivities.rudiSearchActive).toBe(true);
    expect(gameState.recordFestivalActivity("find-rudi", 500)).toBe(500);
    expect(gameState.current.festivalActivities.rudiSearchActive).toBe(false);
    expect(gameState.current.achievements).toContain("find-rudi");
  });
});

describe("Bürgermeisterinnen-Gespräch", () => {
  it("hat drei erste Themen und je drei sinnvolle zweite Antworten", () => {
    const opening = festivalMayorDialogue.nodes[festivalMayorDialogue.start];
    expect(opening?.choices).toHaveLength(3);
    for (const first of opening?.choices ?? []) {
      const followUp = festivalMayorDialogue.nodes[first.next];
      expect(followUp?.choices).toHaveLength(3);
      for (const second of followUp?.choices ?? []) {
        const dialogue = new DialogueController(festivalMayorDialogue);
        dialogue.choose((opening?.choices ?? []).indexOf(first));
        dialogue.choose((followUp?.choices ?? []).indexOf(second));
        expect(dialogue.current.speaker).toBe("Du");
        dialogue.advance();
        expect(dialogue.current.speaker).toBe("Bürgermeisterin");
        expect(dialogue.advance()).toBe("complete");
      }
    }
  });
});

describe("Festival-Outro", () => {
  it("zeigt vier GDD-Lernmomente und personalisiert Abstimmung und Bühne", () => {
    const plan: FestivalPlan = { endTime: 23, stage: "newcomer", security: "extra-team", cups: "deposit", localShare: 75 };
    const moments = createFestivalOutroMoments({ groupsInterviewed: 4, negotiations: 3, votes: 10, cost: 19_500, plan });
    expect(moments.map((moment) => moment.art)).toEqual(["voices", "negotiation", "council", "festival"]);
    expect(moments[2]?.memory).toContain("10 von 12");
    expect(moments[2]?.memory).toContain("19.500");
    expect(moments[3]?.memory).toContain("Newcomer-Bühne");
    expect(moments.every((moment) => moment.insight.length > 40)).toBe(true);
  });
});
