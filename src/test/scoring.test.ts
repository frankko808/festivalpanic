import { beforeEach, describe, expect, it } from "vitest";
import { canThrowPoints, completionBonuses, councilPoints, roundPoints, speedPoints } from "../data/scoring";
import { gameState } from "../state/GameState";

describe("graduelle Wertung", () => {
  beforeEach(() => gameState.resetRun());

  it("belohnt jede weitere Stimme gleich, auch beim zweiten Versuch", () => {
    expect(councilPoints(6, true)).toBe(0);
    for (let votes = 7; votes < 12; votes += 1) {
      expect(councilPoints(votes + 1, true) - councilPoints(votes, true)).toBe(200);
      expect(councilPoints(votes + 1, false) - councilPoints(votes, false)).toBe(200);
    }
    expect(councilPoints(12, true)).toBe(2_500);
    expect(councilPoints(12, false)).toBe(1_750);
  });

  it("vergibt den Abstimmungsbonus nur einmal", () => {
    gameState.recordCouncilVote(9);
    const score = gameState.current.score;
    gameState.recordCouncilVote(12);
    expect(gameState.current.score).toBe(score);
  });

  it("belohnt kürzere Spielzeit und niedrigere Kosten mit begrenzten Boni", () => {
    expect(completionBonuses(600_000, 18_000)).toEqual({ time: 800, budget: 200 });
    expect(completionBonuses(1_200_000, 19_000)).toEqual({ time: 400, budget: 100 });
    expect(completionBonuses(1_800_000, 20_000)).toEqual({ time: 0, budget: 0 });
    expect(completionBonuses(2_400_000, 27_000)).toEqual({ time: 0, budget: 0 });
    expect(completionBonuses(0, 0)).toEqual({ time: 1_200, budget: 500 });
  });

  it("bucht Abschlussboni einmalig und aktualisiert den Rekord", () => {
    const run = gameState.current;
    run.planning.finalPlan = { endTime: 22, stage: "small", security: "extra-team", cups: "deposit", localShare: 75 };
    gameState.setPhase("festival");
    for (let tick = 0; tick < 2_400; tick += 1) gameState.advanceTime(250);
    const before = run.score;
    gameState.setPhase("results");
    const bonus = run.completionBonus!;
    expect(bonus.time).toBe(800);
    expect(run.score).toBe(before + bonus.time + bonus.budget);
    expect(gameState.persisted.highScore).toBeGreaterThanOrEqual(run.score);
    gameState.setPhase("results");
    expect(run.score).toBe(before + bonus.time + bonus.budget);
    gameState.setPhase("festival");
    gameState.setPhase("results");
    expect(run.score).toBe(before + bonus.time + bonus.budget);
  });

  it("speichert Rudis tatsächliche zeitabhängige Punkte und verhindert Wiederholung", () => {
    expect(gameState.recordFestivalActivity("find-rudi", 245)).toBe(245);
    expect(gameState.current.festivalActivities.rudiScore).toBe(245);
    expect(gameState.recordFestivalActivity("find-rudi", 500)).toBe(0);
    expect(gameState.current.score).toBe(245);
  });
});

describe("Minispieltempo und Gesamtfrist", () => {
  it("bewertet schnelle richtige Eingaben höher als langsame", () => {
    for (const [maximum, decay] of [[5, 1_500], [40, 2_500], [500, 15_000]]) {
      expect(speedPoints(maximum!, 200, decay!)).toBeGreaterThan(speedPoints(maximum!, 1_400, decay!));
      expect(speedPoints(maximum!, 200, decay!)).toBeLessThanOrEqual(maximum!);
    }
  });

  it("verwirft auch perfekte Teilpunkte bei Zeitablauf oder unvollständiger Runde", () => {
    expect(roundPoints(320, true, 59_999, 60_000)).toBe(320);
    expect(roundPoints(320, true, 60_000, 60_000)).toBe(0);
    expect(roundPoints(320, true, 60_001, 60_000)).toBe(0);
    expect(roundPoints(280, false, 59_999, 60_000)).toBe(0);
  });

  it("verlangt beim Dosenwerfen sowohl Tempo als auch Präzision", () => {
    expect(canThrowPoints(480, 200)).toBeGreaterThan(canThrowPoints(480, 3_000));
    expect(canThrowPoints(480, 200)).toBeGreaterThan(canThrowPoints(510, 200));
    expect(canThrowPoints(220, 0)).toBe(0);
    expect(canThrowPoints(480, 200)).toBeLessThan(100);
  });
});
