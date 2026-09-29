import Phaser from "phaser";
import { BootScene } from "../scenes/BootScene";
import { CharacterSelectScene } from "../scenes/CharacterSelectScene";
import { PreloadScene } from "../scenes/PreloadScene";
import { PlanningScene } from "../scenes/PlanningScene";
import { TitleScene } from "../scenes/TitleScene";
import { TownScene } from "../scenes/TownScene";
import { KaiScene, ParkScene, TownHallScene } from "../scenes/AdventureScene";
import { RhythmScene } from "../scenes/RhythmScene";
import { CouncilChamberScene } from "../scenes/CouncilChamberScene";
import { CouncilVoteScene } from "../scenes/CouncilVoteScene";
import { FestivalScene } from "../scenes/FestivalScene";
import { ShopInteriorScene } from "../scenes/ShopInteriorScene";
import { FestivalGameScene } from "../scenes/FestivalGameScene";

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
// Cap the backing buffer so high-DPI screens do not multiply the pixel cost
// of every world frame. Pixel art stays nearest-neighbor scaled by Phaser.
export const RENDER_RESOLUTION = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));

export const gameConfig = Object.assign({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#17203a",
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  antialiasGL: false,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PreloadScene, TitleScene, CharacterSelectScene, TownScene, ShopInteriorScene, PlanningScene, ParkScene, KaiScene, TownHallScene, CouncilChamberScene, CouncilVoteScene, FestivalScene, FestivalGameScene, RhythmScene],
}, { resolution: RENDER_RESOLUTION }) as Phaser.Types.Core.GameConfig;
