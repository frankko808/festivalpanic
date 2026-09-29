import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gameState } from "../state/GameState";
import { loadRunSave } from "../state/storage";

const values = new Map<string, string>();
const localStorage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); },
  removeItem: (key: string) => { values.delete(key); },
};

describe("Fortsetzen-Spielstand", () => {
  beforeEach(() => {
    values.clear();
    vi.stubGlobal("window", { localStorage });
    gameState.resetRun();
  });
  afterEach(() => {
    gameState.resetRun();
    vi.unstubAllGlobals();
  });

  it("speichert Lauf und Position und setzt beide nach einem Neustart fort", () => {
    gameState.completeRudiMeeting();
    gameState.awardPoints(125);
    gameState.captureResumePoint({ scene: "ParkScene", x: 1110, y: 390 });
    gameState.flushRunSave();
    expect(loadRunSave()).toMatchObject({ version: 1, point: { scene: "ParkScene", x: 1110, y: 390 }, run: { score: 125 } });
    gameState.resetRun(true);
    expect(gameState.hasResume).toBe(true);
    expect(gameState.resumeSavedRun()).toMatchObject({ scene: "ParkScene", x: 1110, y: 390 });
    expect(gameState.current.score).toBe(125);
  });

  it("entfernt den Lauf bei neuem Spiel oder abgeschlossener Auswertung", () => {
    gameState.completeRudiMeeting();
    gameState.captureResumePoint({ scene: "TownScene", x: 410, y: 470 });
    gameState.flushRunSave();
    gameState.resetRun();
    expect(loadRunSave()).toBeUndefined();
    gameState.completeRudiMeeting();
    gameState.captureResumePoint({ scene: "TownScene", x: 410, y: 470 });
    gameState.flushRunSave();
    gameState.setPhase("results");
    expect(loadRunSave()).toBeUndefined();
  });

  it("speichert weder Test-Checkpoints noch beschädigte Daten", () => {
    gameState.loadFestivalCheckpoint();
    gameState.captureResumePoint({ scene: "FestivalScene", x: 800, y: 790 });
    gameState.flushRunSave();
    expect(loadRunSave()).toBeUndefined();
    values.set("festival-panic-run-v1", '{"version":1,"run":{}}');
    expect(loadRunSave()).toBeUndefined();
  });

  it("lässt einen echten Lauf beim Öffnen eines Debug-Checkpoints unangetastet", () => {
    gameState.completeRudiMeeting();
    gameState.captureResumePoint({ scene: "TownScene", x: 520, y: 420 });
    gameState.flushRunSave();
    gameState.loadFestivalCheckpoint();
    gameState.flushRunSave();
    expect(loadRunSave()?.point).toMatchObject({ scene: "TownScene", x: 520, y: 420 });
  });

  it("behält Laden und Rückweg beim Fortsetzen eines Geschäfts", () => {
    gameState.completeRudiMeeting();
    gameState.captureResumePoint({ scene: "ShopInteriorScene", x: 490, y: 430, shopId: "cafe", returnSpawn: { x: 610, y: 920 } });
    gameState.flushRunSave();
    gameState.resetRun(true);
    expect(gameState.resumeSavedRun()).toMatchObject({ scene: "ShopInteriorScene", shopId: "cafe", returnSpawn: { x: 610, y: 920 } });
  });

  it("kehrt nach einer unterbrochenen Abstimmung mit Beschluss zum Festival zurück", () => {
    gameState.completeRudiMeeting();
    gameState.captureResumePoint({ scene: "CouncilChamberScene", x: 480, y: 468 });
    gameState.flushRunSave();
    gameState.recordCouncilVote(7);
    gameState.flushRunSave();
    gameState.resetRun(true);
    expect(gameState.resumeSavedRun()).toMatchObject({ scene: "FestivalScene", x: 800, y: 790 });
  });
});
