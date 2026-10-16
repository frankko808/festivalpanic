import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("phaser", () => ({ default: {
  Scene: class {},
  Math: { FloatBetween: () => 0 },
} }));

import { FestivalGameScene } from "../scenes/FestivalGameScene";
import { RhythmScene } from "../scenes/RhythmScene";
import { gameState } from "../state/GameState";

function textStub() {
  return {
    setText() { return this; }, setFontSize() { return this; },
    setColor() { return this; }, setAlign() { return this; },
    setScale() { return this; }, setVisible() { return this; },
  };
}

function prepare(scene: object, now: number) {
  Object.assign(scene, {
    time: { now }, cameras: { main: { flash: vi.fn(), shake: vi.fn() } },
    tweens: { add: vi.fn() }, resultText: textStub(), footerText: textStub(),
    noteText: textStub(), progressText: textStub(), friesStatus: textStub(),
    deadline: 1_000, taskStartedAt: 0, noteStartedAt: 0,
  });
}

describe("Minispiel-Wertung in den Szenen", () => {
  beforeEach(() => gameState.resetRun());

  it("vergibt bei Lina schnell mehr und nach Ablauf keine Teilpunkte", () => {
    const play = (now: number) => {
      gameState.resetRun();
      const scene = new RhythmScene();
      prepare(scene, now);
      Object.assign(scene, { notes: ["A"], points: 0, index: 0 });
      (scene as unknown as { handleKey(key: string): void }).handleKey("A");
      return gameState.current.score;
    };
    expect(play(100)).toBeGreaterThan(play(900));
    expect(play(1_000)).toBe(0);

    const scene = new RhythmScene();
    prepare(scene, 1_000);
    Object.assign(scene, { notes: ["A", "S"], index: 1, points: 5, hits: 1 });
    (scene as unknown as { finish(): void }).finish();
    expect(gameState.current.score).toBe(0);
  });

  it.each(["fries", "cans"])("verwirft bei %s gesammelte Punkte, wenn die Frist endet", (kind) => {
    const scene = new FestivalGameScene();
    prepare(scene, 1_000);
    Object.assign(scene, { kind, friesScore: 280, canScore: 400, canCursor: { x: 480 } });
    const controls = scene as unknown as { serveFries(index: number): void; throwBall(): void };
    if (kind === "fries") controls.serveFries(0);
    else controls.throwBall();
    expect(gameState.current.score).toBe(0);
    expect(gameState.current.festivalActivities.friesRushScore).toBe(0);
    expect(gameState.current.festivalActivities.canTossScore).toBe(0);
  });

  it("belohnt schnelle Pommes-Eingaben höher und ignoriert weitere Eingaben nach Abschluss", () => {
    const play = (now: number) => {
      gameState.resetRun();
      const scene = new FestivalGameScene();
      prepare(scene, now);
      Object.assign(scene, { kind: "fries", friesOrders: Array(8).fill(0), friesIndex: 7 });
      const controls = scene as unknown as { serveFries(index: number): void };
      controls.serveFries(0);
      const score = gameState.current.score;
      controls.serveFries(0);
      expect(gameState.current.score).toBe(score);
      return score;
    };
    expect(play(100)).toBeGreaterThan(play(900));
  });

  it("gibt für eine zu späte Rudi-Auswahl keine Punkte und lässt die Suche aktiv", () => {
    gameState.startRudiSearch();
    const scene = new FestivalGameScene();
    prepare(scene, 1_000);
    Object.assign(scene, { rudiIndex: 0 });
    (scene as unknown as { chooseRudiCard(index: number): void }).chooseRudiCard(0);
    expect(gameState.current.score).toBe(0);
    expect(gameState.current.festivalActivities.rudiFound).toBe(false);
    expect(gameState.current.festivalActivities.rudiSearchActive).toBe(true);
  });
});
