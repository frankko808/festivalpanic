import Phaser from "phaser";
import { gameConfig } from "./config/gameConfig";
import "./style.css";
import { gameState } from "./state/GameState";
import { Player } from "./characters/Player";
import type { ResumePoint, ResumeSceneKey } from "./state/storage";
import { audioManager } from "./systems/AudioManager";

const game = new Phaser.Game(gameConfig);
const RESUME_SCENES = new Set<ResumeSceneKey>(["TownScene", "ParkScene", "KaiScene", "TownHallScene", "CouncilChamberScene", "ShopInteriorScene", "FestivalScene"]);
let nextResumeCaptureAt = 0;
let lastResumeScene = "";
const showPerformance = import.meta.env.DEV && new URLSearchParams(window.location.search).get("perf") === "1";
const performanceLabel = showPerformance ? document.createElement("output") : undefined;
if (performanceLabel) {
  performanceLabel.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:9999;padding:7px 10px;background:#17203a;color:#fff8dc;font:14px monospace;pointer-events:none";
  performanceLabel.setAttribute("aria-label", "Entwicklungsanzeige Bildrate");
  document.body.append(performanceLabel);
}
let performanceFrames = 0;
let performanceSlowFrames = 0;
let performanceElapsed = 0;
let performanceMaxFrame = 0;
let previousPerformanceStepAt = 0;
game.events.on(Phaser.Core.Events.STEP, (time: number, delta: number) => {
  if (performanceLabel && !document.hidden) {
    const now = performance.now();
    const frameMs = previousPerformanceStepAt ? now - previousPerformanceStepAt : delta;
    previousPerformanceStepAt = now;
    performanceFrames += 1;
    performanceElapsed += frameMs;
    if (frameMs > 25) performanceSlowFrames += 1;
    performanceMaxFrame = Math.max(performanceMaxFrame, frameMs);
    if (performanceElapsed >= 1000) {
      const fps = Math.round(performanceFrames * 1000 / performanceElapsed);
      performanceLabel.textContent = `${fps} FPS · ${performanceSlowFrames} langsame Frames · max ${Math.round(performanceMaxFrame)} ms`;
      performanceFrames = 0;
      performanceSlowFrames = 0;
      performanceElapsed = 0;
      performanceMaxFrame = 0;
    }
  }
  for (const scene of game.scene.getScenes(true)) {
    const sceneKey = scene.scene.key as ResumeSceneKey;
    if (!RESUME_SCENES.has(sceneKey)) continue;
    if (sceneKey === lastResumeScene && time < nextResumeCaptureAt) break;
    let player: Player | undefined;
    for (const body of scene.physics.world.bodies) {
      if (body.gameObject instanceof Player) { player = body.gameObject; break; }
    }
    if (!(player instanceof Player)) continue;
    const point: ResumePoint = { scene: sceneKey, x: Math.round(player.x), y: Math.round(player.y) };
    if (sceneKey === "ShopInteriorScene") {
      point.shopId = scene.data.get("shopId") as ResumePoint["shopId"];
      point.returnSpawn = scene.data.get("returnSpawn") as ResumePoint["returnSpawn"];
    }
    gameState.captureResumePoint(point);
    lastResumeScene = sceneKey;
    nextResumeCaptureAt = time + 250;
    break;
  }
  gameState.advanceTime(delta);
});
window.addEventListener("pagehide", () => gameState.flushRunSave());
window.addEventListener("pointerdown", () => audioManager.start());
window.addEventListener("keydown", (event) => {
  audioManager.start();
  if (event.key.toLowerCase() === "v" && !event.repeat) audioManager.toggleMute();
  else if (["e", "enter", " ", "1", "2", "3"].includes(event.key.toLowerCase()) && !event.repeat) audioManager.playSelect();
});

game.events.once(Phaser.Core.Events.READY, () => {
  game.canvas.tabIndex = 0;
  game.canvas.setAttribute("aria-label", "Festival Panic Spielfläche");
  game.canvas.addEventListener("pointerdown", () => game.canvas.focus());
  game.canvas.focus();
});
