import Phaser from "phaser";
import { gameState } from "../state/GameState";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    gameState.resetRun(true);
    this.scene.start("PreloadScene");
  }
}
