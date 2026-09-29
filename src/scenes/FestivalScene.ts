import Phaser from "phaser";
import { Player } from "../characters/Player";
import type { DialogueScript } from "../dialogue/types";
import {
  festivalAliDialogue,
  festivalFinaleDialogue,
  festivalMayorDialogue,
  festivalOpeningDialogue,
  createFestivalGroupDialogue,
} from "../data/dialogues/festivalOutro";
import {
  calculatePlanCost,
  calculateSupport,
  DEFAULT_FESTIVAL_PLAN,
  type FestivalPlan,
  type GroupId,
} from "../data/festivalRules";
import {
  getFestivalStagePresentation,
  type FestivalStagePresentation,
} from "../data/festivalPresentation";
import { addNpcCollision } from "../systems/addNpcCollision";
import { InteractionSystem } from "../systems/InteractionSystem";
import { gameState } from "../state/GameState";
import { DialogBox } from "../ui/DialogBox";
import { TownHud } from "../ui/TownHud";
import { createPlayerTexture } from "../utils/createPlaceholderTextures";
import { createWorldDepthLayer } from "../utils/createWorldDepthLayer";
import { setDepthIfChanged } from "../utils/setDepthIfChanged";
import { ACHIEVEMENTS } from "../data/achievements";
import { createFestivalOutroMoments } from "../data/festivalOutroMoments";
import { formatDuration } from "../utils/formatDuration";
import { FestivalOutro } from "../ui/FestivalOutro";
import type { FestivalGameKind } from "./FestivalGameScene";

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 900;
const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 540;
const CROWD_TEXTURES = [
  "festival-guest-0", "festival-guest-1", "festival-guest-2", "festival-guest-3",
  "festival-guest-4", "festival-guest-5", "festival-guest-6", "festival-guest-7",
  "festival-guest-8", "festival-guest-9", "festival-guest-10", "festival-guest-11",
  "npc-musician", "npc-jogger", "npc-gardener", "npc-technician",
] as const;

const GROUP_GUESTS: ReadonlyArray<{
  id: GroupId;
  name: string;
  texture: string;
  x: number;
  y: number;
}> = [
  { id: "young-list", name: "Mia", texture: "mia", x: 510, y: 535 },
  { id: "citizens-forum", name: "Herr Brömmel", texture: "broemmel", x: 860, y: 710 },
  { id: "green-local", name: "Nora", texture: "nora", x: 1065, y: 560 },
  { id: "budget-hawks", name: "Herr Centner", texture: "centner", x: 650, y: 704 },
] as const;

function rank(score: number): string {
  if (score >= 9_000) return "Bundesdorf-Legende";
  if (score >= 7_500) return "Kompromisskünstler:in";
  if (score >= 6_000) return "Mehrheitsbastler:in";
  if (score >= 4_500) return "Pommesbeauftragte:r";
  return "Rathauspraktikant:in";
}

function talk(id: string, speaker: string, text: string): DialogueScript {
  return { id, start: "line", nodes: { line: { id: "line", speaker, text } } };
}

export class FestivalScene extends Phaser.Scene {
  private player!: Player;
  private rudi!: Phaser.GameObjects.Image;
  private rudiLabel!: Phaser.GameObjects.Text;
  private hud!: TownHud;
  private dialog!: DialogBox;
  private interactions!: InteractionSystem;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private choiceKeys: Phaser.Input.Keyboard.Key[] = [];
  private actionArmed = true;
  private resultsVisible = false;
  private finaleStarted = false;
  private resultsReadyAt = 0;
  private outro?: FestivalOutro;
  private readonly staticObstacles: Phaser.GameObjects.Zone[] = [];
  private readonly guestSprites: Array<{ id: string; sprite: Phaser.GameObjects.Image; script: DialogueScript }> = [];
  private readonly activityZones: Array<{ kind: FestivalGameKind; name: string; zone: Phaser.GameObjects.Zone }> = [];
  private finaleZone?: Phaser.GameObjects.Zone;
  private plan: FestivalPlan = { ...DEFAULT_FESTIVAL_PLAN };
  private presentation!: FestivalStagePresentation;

  constructor() {
    super("FestivalScene");
  }

  create(data: { spawn?: { x: number; y: number }; resume?: boolean } = {}): void {
    this.staticObstacles.length = 0;
    this.guestSprites.length = 0;
    this.activityZones.length = 0;
    this.finaleZone = undefined;
    this.resultsVisible = false;
    this.finaleStarted = false;
    this.outro = undefined;
    gameState.setPhase("festival");
    this.plan = {
      ...(gameState.current.planning.finalPlan ??
        gameState.current.planning.savedPlan ??
        gameState.current.planning.draft ??
        DEFAULT_FESTIVAL_PLAN),
    };
    this.presentation = getFestivalStagePresentation(this.plan);

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.drawFestivalMarket();
    createPlayerTexture(this, gameState.current.appearance);
    const previewArea = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("area") : null;
    const previewSpawn = previewArea === "main-stage"
      ? { x: 530, y: 430 }
      : previewArea === "side-stage"
        ? { x: 1080, y: 455 }
        : previewArea === "finale"
          ? { x: 800, y: 350 }
          : { x: 800, y: 790 };
    const spawn = data.spawn ?? previewSpawn;
    this.player = new Player(this, spawn.x, spawn.y, "player");
    this.physics.add.collider(this.player, this.staticObstacles);
    this.createCrowds();
    this.createInteractiveGuests();
    this.createRudi();
    this.createFinalePoint();
    this.createActivityPoints();
    createWorldDepthLayer(this);

    this.hud = new TownHud(this);
    this.hud.setStatus(`SOMMERFEST  •  ${this.presentation.stageCount} ${this.presentation.stageCount === 1 ? "BÜHNE" : "BÜHNEN"}  •  ABENDPROGRAMM`);
    const earned = gameState.current.achievements.map((id) => ACHIEVEMENTS[id].title);
    this.hud.setQuest("Genieße das Festival und sprich mit den Gästen.\nSprich mit der Bürgermeisterin und geh dann zum leuchtenden Stern." +
      (earned.length ? `\nNEUE ERFOLGE: ${earned.join(" · ")}` : ""));
    this.dialog = new DialogBox(this);
    this.interactions = new InteractionSystem();
    this.configureKeys();
    this.registerInteractions();

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(450, 21, 24, 52);
    if (!data.resume) this.dialog.open(festivalOpeningDialogue, () => this.hud.setPrompt(""));
  }

  update(): void {
    this.updateRudi();
    if (this.resultsVisible) {
      this.player.updateMovement(false);
      if (this.time.now >= this.resultsReadyAt && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        this.scene.start("TitleScene");
      }
      return;
    }
    if (this.outro) {
      this.player.updateMovement(false);
      if (this.consumeAction()) this.outro.advance();
      return;
    }
    if (this.dialog.isOpen) {
      this.player.updateMovement(false);
      this.hud.setPrompt("");
      if (this.dialog.hasChoices) {
        const choice = this.choiceKeys.findIndex((key) => Phaser.Input.Keyboard.JustDown(key));
        if (choice >= 0) this.dialog.choose(choice);
        return;
      }
      if (this.consumeAction()) this.dialog.advance();
      return;
    }
    this.player.updateMovement(true);
    this.hud.setPrompt(this.interactions.update(this.player));
    if (this.consumeAction()) this.interactions.interact();
  }

  private configureKeys(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error("Keyboard input is required");
    this.interactKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.choiceKeys = [1, 2, 3].map((number) => keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE + number - 1));
    this.actionArmed = true;
  }

  private consumeAction(): boolean {
    const keys = [this.interactKey, this.spaceKey, this.enterKey];
    if (keys.every((key) => key.isUp)) this.actionArmed = true;
    if (!this.actionArmed) return false;
    if (keys.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      this.actionArmed = false;
      return true;
    }
    return false;
  }

  private drawFestivalMarket(): void {
    const ground = this.add.graphics().setDepth(0);
    ground.fillStyle(0x141a38, 1);
    ground.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ground.fillStyle(0x27345d, 1);
    ground.fillRect(0, 105, WORLD_WIDTH, 795);
    ground.fillStyle(0x6c5b70, 1);
    ground.fillRoundedRect(55, 118, 1490, 735, 34);
    ground.fillStyle(0x8b7480, 1);
    ground.fillRoundedRect(74, 137, 1452, 697, 26);

    for (let y = 142, row = 0; y < 832; y += 38, row += 1) {
      for (let x = row % 2 === 0 ? 80 : 101; x < 1525; x += 42) {
        const shade = (row * 7 + x / 42) % 5;
        ground.fillStyle(shade === 0 ? 0x957d86 : shade === 2 ? 0x826d7a : 0x8b7480, 0.78);
        ground.fillRoundedRect(x, y, 38, 34, 2);
        ground.fillStyle(0xc49a7b, 0.16);
        ground.fillRect(x + 3, y + 3, 30, 2);
      }
    }
    const bakedGround = this.add.renderTexture(0, 0, WORLD_WIDTH, WORLD_HEIGHT).setOrigin(0).setDepth(0);
    bakedGround.draw(ground, 0, 0);
    bakedGround.render();
    ground.destroy();

    this.drawTownHall(800, 44);
    this.drawShopFacade(82, 144, 235, "BÄCKEREI", 0xb6646f, 0xf1c46d);
    this.drawShopFacade(1283, 144, 235, "CAFÉ MONDLICHT", 0x477f85, 0x9fd7c5);
    this.drawShopFacade(86, 610, 205, "BLUMEN & CO.", 0x477d66, 0xf1a7bd);
    this.drawShopFacade(1309, 610, 205, "BUCH & BÜHNE", 0x5c557c, 0xc4a7df);
    this.drawStage(340, 224, 350, this.presentation.mainLabel, 0xd86179);
    if (this.presentation.stageCount === 2 && this.presentation.sideLabel) {
      this.drawStage(1260, 250, 300, this.presentation.sideLabel, 0x4d9d8b);
    }
    this.drawFountain(800, 430);
    this.drawFoodStall(500, 700, "POMMES", 0xe06a67);
    this.drawFoodStall(1100, 700, this.plan.cups === "deposit" ? "PFAND & LIMONADE" : "LIMONADE", 0x54a88d);
    this.drawTables();
    this.drawLightStrings();
    this.drawAmbientLights();
  }

  private drawTownHall(x: number, y: number): void {
    const g = this.add.graphics().setDepth(90);
    g.fillStyle(0x271f3d, 0.35); g.fillEllipse(x, y + 196, 470, 35);
    g.fillStyle(0x493b5f, 1); g.fillRect(x - 220, y + 45, 440, 150);
    g.fillStyle(0x72526c, 1); g.fillTriangle(x - 245, y + 48, x, y - 20, x + 245, y + 48);
    g.fillStyle(0x8d6274, 1); g.fillTriangle(x - 217, y + 45, x, y - 7, x + 217, y + 45);
    g.fillStyle(0xe0be78, 1); g.fillRect(x - 188, y + 64, 376, 112);
    g.fillStyle(0x5a405c, 1); g.fillRect(x - 45, y + 86, 90, 109);
    g.fillStyle(0xf5d67b, 1);
    [-150, -92, 92, 150].forEach((offset) => {
      g.fillRoundedRect(x + offset - 23, y + 79, 46, 49, 3);
      g.fillStyle(0xffeca5, 0.35); g.fillRect(x + offset - 18, y + 84, 36, 39);
      g.fillStyle(0xf5d67b, 1);
    });
    g.fillStyle(0x3a304f, 1); g.fillRect(x - 160, y + 136, 320, 9);
    this.add.text(x, y + 58, "RATHAUS", { fontFamily: "Courier New", fontSize: "21px", fontStyle: "bold", color: "#49364c" }).setOrigin(0.5).setDepth(92);
    this.addSolid(x, y + 105, 450, 195);
  }

  private drawShopFacade(x: number, y: number, width: number, label: string, wall: number, awning: number): void {
    const g = this.add.graphics().setDepth(86 + y);
    g.fillStyle(0x201c35, 0.34); g.fillEllipse(x + width / 2, y + 151, width + 24, 23);
    g.fillStyle(wall, 1); g.fillRoundedRect(x, y, width, 150, 8);
    g.fillStyle(0x3b304d, 1); g.fillTriangle(x - 10, y + 17, x + width / 2, y - 48, x + width + 10, y + 17);
    g.fillStyle(0x65455e, 1); g.fillTriangle(x + 4, y + 13, x + width / 2, y - 35, x + width - 4, y + 13);
    g.fillStyle(0xffe59a, 1); g.fillRect(x + 19, y + 43, 66, 55); g.fillRect(x + width - 85, y + 43, 66, 55);
    g.fillStyle(0xfff4c5, 0.33); g.fillRect(x + 25, y + 49, 54, 43); g.fillRect(x + width - 79, y + 49, 54, 43);
    g.fillStyle(0x44324a, 1); g.fillRect(x + width / 2 - 25, y + 80, 50, 70);
    g.fillStyle(awning, 1); g.fillRect(x + 9, y + 24, width - 18, 18);
    for (let stripe = 0; stripe < 6; stripe += 1) {
      g.fillStyle(stripe % 2 === 0 ? 0xfff0bd : awning, 1);
      g.fillTriangle(x + 14 + stripe * ((width - 28) / 6), y + 42, x + 14 + (stripe + 1) * ((width - 28) / 6), y + 42, x + 14 + (stripe + 0.5) * ((width - 28) / 6), y + 56);
    }
    this.add.text(x + width / 2, y + 17, label, { fontFamily: "Courier New", fontSize: "14px", fontStyle: "bold", color: "#fff6d3", stroke: "#30223f", strokeThickness: 3 }).setOrigin(0.5).setDepth(100 + y);
    this.addSolid(x + width / 2, y + 73, width, 150);
  }

  private drawStage(x: number, y: number, width: number, label: string, accent: number): void {
    const g = this.add.graphics().setDepth(120 + y);
    g.fillStyle(0x17182c, 0.42); g.fillEllipse(x, y + 82, width + 60, 31);
    g.fillStyle(0x29243f, 1); g.fillRoundedRect(x - width / 2, y - 84, width, 164, 8);
    g.fillStyle(0x453a61, 1); g.fillRect(x - width / 2 + 15, y - 68, width - 30, 126);
    g.fillStyle(accent, 1); g.fillRect(x - width / 2 + 20, y - 62, width - 40, 34);
    g.fillStyle(0x17182c, 1); g.fillRect(x - width / 2 + 25, y + 46, width - 50, 23);
    g.lineStyle(5, 0xffdf78, 1);
    g.lineBetween(x - width / 2 + 8, y - 82, x - width / 2 + 8, y + 72);
    g.lineBetween(x + width / 2 - 8, y - 82, x + width / 2 - 8, y + 72);
    g.lineBetween(x - width / 2 + 8, y - 80, x + width / 2 - 8, y - 80);
    for (let light = 0; light < 7; light += 1) {
      const lightX = x - width / 2 + 35 + light * ((width - 70) / 6);
      g.fillStyle(light % 2 === 0 ? 0xffdf78 : 0x67d5a2, 1); g.fillCircle(lightX, y - 80, 6);
      if (light === 2) {
        const glow = this.add.circle(lightX, y - 73, 16, 0xffdf78, 0.13).setDepth(122 + y);
        this.tweens.add({ targets: glow, alpha: 0.38, scale: 1.25, duration: 700 + light * 80, yoyo: true, repeat: -1 });
      }
    }
    this.add.text(x, y - 45, label, { fontFamily: "Courier New", fontSize: width > 320 ? "17px" : "15px", fontStyle: "bold", color: "#fff4c5", align: "center" }).setOrigin(0.5).setDepth(125 + y);
    const singer = this.add.image(x, y + 24, "npc-musician").setOrigin(0.5, 0.8).setScale(1.08).setDepth(128 + y);
    const technician = this.add.image(x - 65, y + 31, "npc-technician").setOrigin(0.5, 0.8).setScale(0.9).setDepth(128 + y);
    this.tweens.add({ targets: singer, y: singer.y - 5, duration: 360, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    this.tweens.add({ targets: technician, angle: 3, duration: 900, yoyo: true, repeat: -1 });
    this.addSolid(x, y - 3, width, 180);
  }

  private drawFountain(x: number, y: number): void {
    const g = this.add.graphics().setDepth(490);
    g.fillStyle(0x24233f, 0.4); g.fillEllipse(x, y + 44, 264, 64);
    g.fillStyle(0xb8c9d0, 1); g.fillEllipse(x, y + 22, 254, 102);
    g.fillStyle(0x6aaec1, 1); g.fillEllipse(x, y + 11, 222, 77);
    g.fillStyle(0x80d6dc, 1); g.fillEllipse(x, y + 5, 194, 59);
    g.fillStyle(0xd5e4de, 1); g.fillRect(x - 16, y - 70, 32, 75); g.fillEllipse(x, y - 69, 62, 22);
    g.fillStyle(0x9be8e7, 0.86); g.fillTriangle(x, y - 125, x - 17, y - 61, x + 17, y - 61);
    g.fillStyle(0xe8ffff, 0.85); g.fillCircle(x, y - 125, 8);
    for (let index = 0; index < 2; index += 1) {
      const ripple = this.add.ellipse(x, y + 5, 40, 12).setStrokeStyle(2, 0xe6ffff, 0.68).setDepth(492).setAlpha(0);
      this.tweens.add({ targets: ripple, scaleX: 4, scaleY: 2.7, alpha: { from: 0.75, to: 0 }, duration: 1700, delay: index * 420, repeat: -1 });
    }
    this.addSolid(x, y + 10, 245, 100);
  }

  private drawFoodStall(x: number, y: number, label: string, accent: number): void {
    const g = this.add.graphics().setDepth(100 + y);
    g.fillStyle(0x211d36, 0.38); g.fillEllipse(x, y + 58, 190, 29);
    g.fillStyle(0x5f453f, 1); g.fillRect(x - 77, y - 28, 12, 87); g.fillRect(x + 65, y - 28, 12, 87);
    g.fillStyle(0xffedbd, 1); g.fillRect(x - 88, y - 42, 176, 42);
    for (let stripe = 0; stripe < 8; stripe += 1) {
      g.fillStyle(stripe % 2 === 0 ? accent : 0xffedbd, 1);
      g.fillRect(x - 88 + stripe * 22, y - 42, 22, 22);
      g.fillTriangle(x - 88 + stripe * 22, y - 20, x - 66 + stripe * 22, y - 20, x - 77 + stripe * 22, y - 6);
    }
    g.fillStyle(0x805542, 1); g.fillRoundedRect(x - 94, y + 18, 188, 43, 4);
    this.add.text(x, y + 39, label, { fontFamily: "Courier New", fontSize: "13px", fontStyle: "bold", color: "#fff4c5" }).setOrigin(0.5).setDepth(104 + y);
    this.addSolid(x, y + 20, 190, 92);
  }

  private drawTables(): void {
    const g = this.add.graphics().setDepth(620);
    ([[760, 620], [955, 645], [1200, 605], [380, 615]] as const).forEach(([x, y], index) => {
      g.fillStyle(0x211d36, 0.3); g.fillEllipse(x, y + 28, 102, 20);
      g.fillStyle(index % 2 === 0 ? 0xb86a57 : 0x4f8f7b, 1); g.fillEllipse(x, y, 88, 31);
      g.fillStyle(0x6a463d, 1); g.fillRect(x - 7, y + 8, 14, 41);
      g.fillStyle(0xffdc78, 1); g.fillCircle(x, y - 6, 5);
      this.addSolid(x, y + 20, 80, 47);
    });
  }

  private drawLightStrings(): void {
    const g = this.add.graphics().setDepth(840);
    const rows = [116, 590];
    rows.forEach((baseY, row) => {
      g.lineStyle(3, 0x342a4a, 0.95);
      const points = new Phaser.Curves.Spline([[55, baseY], [400, baseY + 28], [800, baseY + 40], [1200, baseY + 28], [1545, baseY]]).getPoints(72);
      g.strokePoints(points);
      for (let x = 90, index = 0; x <= 1510; x += 86, index += 1) {
        const sag = Math.sin(((x - 55) / 1490) * Math.PI) * 40;
        const color = [0xffd763, 0xf27886, 0x68d5aa, 0xa986d6][(index + row) % 4] ?? 0xffffff;
        const glow = this.add.circle(x, baseY + sag, 13, color, 0.13).setDepth(841);
        const bulb = this.add.circle(x, baseY + sag, 4, color, 1).setDepth(842);
        if (index % 5 === 0) this.tweens.add({ targets: [glow, bulb], alpha: { from: 0.55, to: 1 }, duration: 620 + (index % 5) * 130, yoyo: true, repeat: -1 });
      }
    });
    for (let x = 90; x < 1540; x += 75) {
      const color = [0xe96c78, 0xffd45d, 0x67d5a2, 0x9b78cf][Math.floor(x / 75) % 4] ?? 0xffffff;
      g.fillStyle(color, 1); g.fillTriangle(x - 10, 122, x + 10, 122, x, 143);
    }
  }

  private drawAmbientLights(): void {
    for (let index = 0; index < 8; index += 1) {
      const x = 80 + (index * 151) % 1450;
      const y = 165 + (index * 97) % 650;
      const spark = this.add.circle(x, y, index % 3 === 0 ? 3 : 2, index % 2 === 0 ? 0xffe28a : 0x9af0cf, 0.72).setDepth(830);
      if (index % 2 === 0) this.tweens.add({ targets: spark, y: y - 22 - (index % 4) * 7, x: x + (index % 2 ? 8 : -8), alpha: 0.1, duration: 1250 + index * 47, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    }
  }

  private createCrowds(): void {
    this.createDancingCrowd(340, 420, this.presentation.mainCrowd, 330, 180, 0);
    if (this.presentation.stageCount === 2) {
      this.createDancingCrowd(1260, 445, this.presentation.sideCrowd, 300, 185, 3);
    }
    this.createDancingCrowd(800, 575, 10, 360, 90, 5);
    this.createDancingCrowd(800, 790, 7, 710, 62, 2);
  }

  private createDancingCrowd(centerX: number, centerY: number, count: number, spreadX: number, spreadY: number, offset: number): void {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let index = 0; index < count; index += 1) {
      const radius = Math.sqrt((index + 0.65) / Math.max(1, count));
      const angle = index * goldenAngle + offset * 0.73;
      const x = centerX + Math.cos(angle) * spreadX * 0.5 * radius + Math.sin(index * 2.1) * 5;
      const y = centerY + Math.sin(angle) * spreadY * 0.5 * radius + Math.cos(index * 1.7) * 4;
      const texture = CROWD_TEXTURES[(index + offset) % CROWD_TEXTURES.length] ?? "npc-clerk";
      const scale = 0.72 + ((index * 7 + offset) % 5) * 0.045;
      const guest = this.add.image(x, y, texture).setOrigin(0.5, 0.8).setScale(scale).setFlipX(index % 2 === 0).setDepth(100 + Math.round(y));
      if (index % 8 === 0) {
        this.tweens.add({ targets: guest, y: y - 4, duration: 480 + (index % 5) * 85, delay: (index % 7) * 65, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      } else if (index % 8 === 1) {
        this.tweens.add({ targets: guest, angle: index % 2 === 0 ? 2 : -2, duration: 650 + (index % 5) * 90, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      }
    }
  }

  private createInteractiveGuests(): void {
    const support = calculateSupport(this.plan, gameState.current.quest.negotiationFlags);
    const supporters = new Set<GroupId>(support.supporters);
    const cost = calculatePlanCost(this.plan, gameState.current.quest.negotiationFlags);
    GROUP_GUESTS.forEach((guest) => {
      const sprite = this.add.image(guest.x, guest.y, guest.texture).setOrigin(0.5, 0.8).setDepth(100 + guest.y);
      addNpcCollision(this, this.player, sprite);
      this.createNameLabel(sprite, guest.name, supporters.has(guest.id) ? "✓" : "•");
      this.guestSprites.push({ id: guest.id, sprite, script: createFestivalGroupDialogue(guest.id, this.plan, supporters.has(guest.id), cost) });
    });

    const mayor = this.add.image(800, 270, "mayor").setOrigin(0.5, 0.8).setDepth(370);
    addNpcCollision(this, this.player, mayor);
    this.createNameLabel(mayor, "Bürgermeisterin", "✦");
    this.guestSprites.push({ id: "mayor", sprite: mayor, script: festivalMayorDialogue });

    const samira = this.add.image(500, 675, "npc-red").setOrigin(0.5, 0.8).setDepth(775);
    addNpcCollision(this, this.player, samira);
    this.createNameLabel(samira, "Samira", "🍟");
    this.guestSprites.push({ id: "samira", sprite: samira, script: festivalAliDialogue });

    const pepe = this.add.image(1120, 660, "npc-green").setOrigin(0.5, 0.8).setDepth(760);
    addNpcCollision(this, this.player, pepe);
    this.createNameLabel(pepe, "Postbote Pepe", "♪");
    this.guestSprites.push({ id: "pepe", sprite: pepe, script: talk("festival-pepe", "Postbote Pepe", "Ich habe vorhin noch die letzten Einladungen verteilt. Schön zu sehen, dass tatsächlich so viele gekommen sind.") });
  }

  private createRudi(): void {
    this.rudi = this.add.image(this.player.x - 48, this.player.y + 18, "rudi").setOrigin(0.5, 0.8).setDepth(100 + this.player.y);
    this.rudiLabel = this.createNameLabel(this.rudi, "Rudi", "♥");
    const hiding = gameState.current.festivalActivities.rudiSearchActive && !gameState.current.festivalActivities.rudiFound;
    this.rudi.setVisible(!hiding);
    this.rudiLabel.setVisible(!hiding);
  }

  private createFinalePoint(): void {
    const x = 800;
    const y = 330;
    const glow = this.add.circle(x, y, 31, 0xffd75f, 0.16).setDepth(890);
    const star = this.add.text(x, y, "✦", { fontFamily: "Courier New", fontSize: "34px", fontStyle: "bold", color: "#fff0a6", stroke: "#49364c", strokeThickness: 5 }).setOrigin(0.5).setDepth(891);
    this.tweens.add({ targets: [glow, star], scale: 1.18, alpha: { from: 0.62, to: 1 }, duration: 760, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    this.finaleZone = this.add.zone(x, y, 64, 64).setDepth(892).setInteractive({ useHandCursor: true });
  }

  private createActivityPoints(): void {
    const activities: ReadonlyArray<{ kind: FestivalGameKind; name: string; x: number; y: number; color: number; complete: boolean }> = [
      { kind: "fries", name: "POMMES-RUSH", x: 500, y: 805, color: 0xd85f73, complete: gameState.current.festivalActivities.friesRushScore > 0 },
      { kind: "cans", name: "DOSENWERFEN", x: 1100, y: 805, color: 0x4f9a86, complete: gameState.current.festivalActivities.canTossScore > 0 },
      { kind: "find-rudi", name: "FINDE RUDI", x: 800, y: 760, color: 0x77609a, complete: gameState.current.festivalActivities.rudiFound },
    ];
    activities.forEach((activity) => {
      const sign = this.add.text(activity.x, activity.y, `${activity.complete ? "✓ " : "✦ "}${activity.name}`, {
        fontFamily: "Courier New", fontSize: "14px", fontStyle: "bold", color: "#fff8dc",
        backgroundColor: Phaser.Display.Color.IntegerToColor(activity.color).rgba,
        padding: { x: 10, y: 7 },
      }).setOrigin(0.5).setDepth(910);
      this.tweens.add({ targets: sign, y: activity.y - 3, duration: 780 + activities.indexOf(activity) * 120, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      const zone = this.add.zone(activity.x, activity.y, sign.width + 24, 58);
      this.activityZones.push({ kind: activity.kind, name: activity.name, zone });
    });
  }

  private registerInteractions(): void {
    this.guestSprites.forEach(({ id, sprite, script }) => {
      this.interactions.register({
        id: `festival-${id}`,
        displayName: id,
        object: sprite,
        range: 82,
        enabled: () => !this.resultsVisible,
        interact: () => {
          if (id === "mayor") {
            const complete = gameState.current.flags.festivalMayorConversationComplete;
            this.dialog.open(complete
              ? talk("mayor-afterword", "Bürgermeisterin", "Für nächstes Jahr beginnen wir die Gespräche früher. Heute sehe ich erst einmal, wie der beschlossene Plan funktioniert.")
              : festivalMayorDialogue, () => {
                if (!complete) {
                  gameState.completeFestivalMayorConversation();
                  this.hud.setQuest("Sprich mit den Gästen und erkunde das Festival.\nGehe zum leuchtenden Stern, wenn du bereit für den Abschluss bist.");
                }
              });
          } else this.dialog.open(script, () => undefined);
        },
        prompt: () => id === "mayor" ? "Mit der Bürgermeisterin sprechen" : `Mit ${this.nameForGuest(id)} sprechen`,
      });
    });

    this.interactions.register({
      id: "festival-rudi",
      displayName: "Rudi",
      object: this.rudi,
      range: 82,
      priority: -10,
      enabled: () => !this.resultsVisible,
      interact: () => this.dialog.open(talk("festival-rudi-chat", "Rudi", "Schau mal, wie voll der Platz ist. Die Pommes riechen gut – und für einmal haben wir Zeit, einfach zuzusehen."), () => undefined),
      prompt: () => "Mit Rudi sprechen",
    });

    this.activityZones.forEach(({ kind, name, zone }) => {
      this.interactions.register({
        id: `festival-game-${kind}`,
        displayName: name,
        object: zone,
        range: 82,
        priority: 6,
        enabled: () => !this.resultsVisible,
        interact: () => {
          if (kind === "find-rudi") gameState.startRudiSearch();
          this.scene.start("FestivalGameScene", {
            kind,
            returnScene: "FestivalScene",
            spawn: { x: this.player.x, y: this.player.y },
          });
        },
        prompt: () => `${name} spielen`,
      });
    });

    if (!this.finaleZone) throw new Error("Festival finale point is missing");
    this.interactions.register({
      id: "festival-finale",
      displayName: "Festivalabschluss",
      object: this.finaleZone,
      range: 86,
      priority: 10,
      enabled: () => !this.finaleStarted && !this.resultsVisible,
      interact: () => {
        this.finaleStarted = true;
        const openFinale = (): void => this.dialog.open(festivalFinaleDialogue, () => this.showOutro());
        if (gameState.current.flags.festivalMayorConversationComplete) openFinale();
        else this.dialog.open(festivalMayorDialogue, () => {
          gameState.completeFestivalMayorConversation();
          openFinale();
        });
      },
      prompt: () => "Festival abschließen und Auswertung ansehen",
    });
    this.finaleZone.on("pointerup", () => {
      if (!this.dialog.isOpen && !this.outro && !this.resultsVisible) {
        this.interactions.interactWith("festival-finale", this.player);
      }
    });
  }

  private nameForGuest(id: string): string {
    return GROUP_GUESTS.find((guest) => guest.id === id)?.name ?? (id === "samira" ? "Samira" : "Postbote Pepe");
  }

  private createNameLabel(target: Phaser.GameObjects.Image, name: string, suffix: string): Phaser.GameObjects.Text {
    return this.add.text(target.x, target.y - 47, `${name}  ${suffix}`, {
      fontFamily: "Courier New", fontSize: "13px", fontStyle: "bold", color: "#30223f",
      backgroundColor: "#fff1b8e8", padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(900);
  }

  private updateRudi(): void {
    if (!this.rudi?.active || !this.rudi.visible || !this.player?.active || this.resultsVisible) return;
    const targetX = this.player.x - this.player.facingDirection.x * 50 + this.player.facingDirection.y * 22;
    const targetY = this.player.y - this.player.facingDirection.y * 50 - this.player.facingDirection.x * 12;
    const previousX = this.rudi.x;
    this.rudi.x = Phaser.Math.Linear(this.rudi.x, targetX, 0.085);
    this.rudi.y = Phaser.Math.Linear(this.rudi.y, targetY, 0.085);
    if (Math.abs(this.rudi.x - previousX) > 0.15) this.rudi.setFlipX(this.rudi.x > previousX);
    setDepthIfChanged(this.rudi, 100 + Math.round(this.rudi.y));
    this.rudiLabel.setPosition(this.rudi.x, this.rudi.y - 47);
  }

  private showOutro(): void {
    this.hud.setPrompt("");
    const support = calculateSupport(this.plan, gameState.current.quest.negotiationFlags);
    const cost = calculatePlanCost(this.plan, gameState.current.quest.negotiationFlags);
    const negotiations = Object.values(gameState.current.quest.groupsNegotiated).filter(Boolean).length;
    this.outro = new FestivalOutro(this, createFestivalOutroMoments({
      groupsInterviewed: gameState.current.quest.groupsInterviewed,
      negotiations,
      votes: support.votes,
      cost,
      plan: this.plan,
    }), this.presentation.stageCount, support.votes, () => {
      this.outro = undefined;
      this.showResults();
    });
  }

  private showResults(): void {
    gameState.setPhase("results");
    this.resultsVisible = true;
    this.resultsReadyAt = this.time.now + 380;
    this.hud.setPrompt("");
    this.cameras.main.stopFollow();
    const support = calculateSupport(this.plan, gameState.current.quest.negotiationFlags);
    const cost = calculatePlanCost(this.plan, gameState.current.quest.negotiationFlags);
    const score = gameState.current.score;
    const activityScore = gameState.current.festivalActivities.friesRushScore
      + gameState.current.festivalActivities.canTossScore
      + (gameState.current.festivalActivities.rudiFound ? 500 : 0);
    const fixed = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor & Phaser.GameObjects.Components.Depth>(object: T, depth: number): T => object.setScrollFactor(0).setDepth(depth);

    fixed(this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT, 0x11152d, 0.9), 2000);
    fixed(this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 846, 454, 0x24213c, 0.98).setStrokeStyle(6, 0xffd878), 2001);
    fixed(this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 820, 428, 0x000000, 0).setStrokeStyle(2, 0x8f82ac, 0.75), 2002);
    fixed(this.add.text(480, 70, "SOMMERFEST GERETTET!", { fontFamily: "Courier New", fontSize: "34px", fontStyle: "bold", color: "#fff1a8", stroke: "#49364c", strokeThickness: 7 }).setOrigin(0.5), 2003);
    fixed(this.add.text(480, 112, this.presentation.mood, { fontFamily: "Trebuchet MS", fontSize: "16px", fontStyle: "bold", color: "#a9f4d0" }).setOrigin(0.5), 2003);
    fixed(this.add.text(275, 245, `${score}\nPUNKTE`, { fontFamily: "Courier New", fontSize: "35px", fontStyle: "bold", align: "center", color: "#ffdf78" }).setOrigin(0.5), 2003);
    fixed(this.add.text(275, 315, rank(score), { fontFamily: "Trebuchet MS", fontSize: "18px", fontStyle: "bold", align: "center", color: "#fff8dc", wordWrap: { width: 270 } }).setOrigin(0.5), 2003);
    fixed(this.add.text(610, 235, [
      `${this.presentation.stageCount} ${this.presentation.stageCount === 1 ? "Bühne" : "Bühnen"} · ${this.plan.endTime} Uhr`,
      `${support.votes}/12 Stimmen auf dem Fest`,
      `${cost.toLocaleString("de-DE")} EUR Festivalbudget`,
      this.plan.cups === "deposit" ? "Pfandbecher im Einsatz" : "Becher ohne Pfandsystem",
      `Festivalspiele: ${activityScore} Punkte`,
      `Highscore: ${gameState.persisted.highScore}`,
      `Spielzeit: ${formatDuration(gameState.current.elapsedMs)}`,
    ].join("\n"), { fontFamily: "Trebuchet MS", fontSize: "18px", lineSpacing: 10, color: "#fff8dc" }).setOrigin(0.5), 2003);
    const badges = gameState.current.achievements.map((id) => ACHIEVEMENTS[id].title);
    if (badges.length) fixed(this.add.text(480, 382, `ERFOLGE: ${badges.join(" · ")}`, {
      fontFamily: "Trebuchet MS", fontSize: "14px", fontStyle: "bold", color: "#a9f4d0",
      wordWrap: { width: 760 }, align: "center",
    }).setOrigin(0.5), 2003);

    const button = fixed(this.add.text(480, 426, "ZURÜCK ZUM TITEL", { fontFamily: "Courier New", fontSize: "18px", fontStyle: "bold", color: "#fff8dc", backgroundColor: "#d85f73", padding: { x: 20, y: 11 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }), 2004);
    button.on("pointerover", () => button.setScale(1.04).setColor("#fff1a8"));
    button.on("pointerout", () => button.setScale(1).setColor("#fff8dc"));
    button.on("pointerup", () => this.scene.start("TitleScene"));
    fixed(this.add.text(480, 474, "ENTER oder klicken", { fontFamily: "Courier New", fontSize: "13px", color: "#b8b0cd" }).setOrigin(0.5), 2003);

    for (let index = 0; index < 16; index += 1) {
      const color = [0xff725e, 0xffd45d, 0x67d5a2, 0x9b78cf][index % 4] ?? 0xffffff;
      const spark = fixed(this.add.circle(65 + (index * 139) % 830, 55 + (index % 5) * 96, 3, color, 0.7), 2002.5);
      this.tweens.add({ targets: spark, y: spark.y - 26, scale: 2.6, alpha: 0, duration: 950 + index * 27, delay: index * 115, repeat: -1, repeatDelay: 800 });
    }
  }

  private addSolid(x: number, y: number, width: number, height: number): void {
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    this.staticObstacles.push(zone);
  }
}
