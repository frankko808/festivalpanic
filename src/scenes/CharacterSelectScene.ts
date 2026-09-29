import Phaser from "phaser";
import { gameState } from "../state/GameState";
import type { CharacterAppearance } from "../state/storage";
import { APPEARANCE_OPTIONS, drawPlayer } from "../utils/createPlaceholderTextures";

type AppearanceKey = keyof CharacterAppearance;

export class CharacterSelectScene extends Phaser.Scene {
  private appearance: CharacterAppearance = {
    skin: 1,
    hair: 0,
    hairColor: 0,
    top: 0,
    bottom: 0,
    accessory: 0,
  };
  private preview?: Phaser.GameObjects.Graphics;
  private readonly valueTexts = new Map<AppearanceKey, Phaser.GameObjects.Text>();
  private confirmed = false;
  private enterKey?: Phaser.Input.Keyboard.Key;
  private enterArmed = false;

  constructor() {
    super("CharacterSelectScene");
  }

  create(): void {
    this.appearance = { ...gameState.current.appearance };
    this.cameras.main.setBackgroundColor("#f6e7b7");
    this.drawBackground();

    this.add
      .text(480, 42, "WER RETTET DAS FESTIVAL?", {
        fontFamily: "Courier New",
        fontSize: "34px",
        fontStyle: "bold",
        color: "#3b3152",
      })
      .setOrigin(0.5);
    this.add
      .text(480, 78, "Stell deinen ganz eigenen Festival-Look zusammen.", {
        fontFamily: "Courier New",
        fontSize: "17px",
        color: "#6a5268",
      })
      .setOrigin(0.5);

    this.add.rectangle(230, 292, 330, 386, 0xfffbdf).setStrokeStyle(5, 0x3b3152);
    this.add.rectangle(230, 292, 306, 362, 0xfff2bd).setStrokeStyle(2, 0xe6b968);
    this.add
      .text(230, 126, "DEIN FESTIVAL-LOOK", {
        fontFamily: "Courier New",
        fontSize: "17px",
        fontStyle: "bold",
        color: "#8b5360",
      })
      .setOrigin(0.5);
    this.add.ellipse(230, 390, 176, 34, 0x3b3152, 0.12);
    this.preview = this.add.graphics().setPosition(158, 184).setScale(4);
    this.updatePreview();
    this.add
      .rectangle(715, 286, 460, 350, 0xfff7d7, 0.78)
      .setStrokeStyle(3, 0xe2bb70, 0.8)
      .setDepth(0);

    const selectorRows: ReadonlyArray<[AppearanceKey, string]> = [
      ["skin", "HAUTTON"],
      ["hair", "FRISUR"],
      ["hairColor", "HAARFARBE"],
      ["top", "OBERTEIL"],
      ["bottom", "BEINKLEID"],
      ["accessory", "ACCESSOIRE"],
    ];
    selectorRows.forEach(([key, label], index) =>
      this.createSelector(key, label, 500, 151 + index * 54),
    );

    const surprise = this.add
      .text(230, 458, "✦ ÜBERRASCH MICH ✦", {
        fontFamily: "Courier New",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#fff8dc",
        backgroundColor: "#db6b72",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    surprise.on("pointerover", () => surprise.setScale(1.04));
    surprise.on("pointerout", () => surprise.setScale(1));
    surprise.on("pointerup", () => this.randomizeAppearance());

    const confirm = this.add
      .text(715, 486, "SO RETTE ICH DAS FEST!", {
        align: "center",
        fontFamily: "Courier New",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#fff8dc",
        backgroundColor: "#3b3152",
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    confirm.on("pointerover", () => confirm.setColor("#ffe16f").setScale(1.03));
    confirm.on("pointerout", () => confirm.setColor("#fff8dc").setScale(1));
    confirm.on("pointerup", () => this.confirmSelection());
    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.enterArmed = Boolean(this.enterKey?.isUp);
  }

  update(): void {
    if (!this.enterKey || this.confirmed) {
      return;
    }
    if (this.enterKey.isUp) {
      this.enterArmed = true;
      return;
    }
    if (this.enterArmed && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.enterArmed = false;
      this.confirmSelection();
    }
  }

  private createSelector(key: AppearanceKey, label: string, x: number, y: number): void {
    this.add
      .text(x, y, label, {
        fontFamily: "Courier New",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#8b5360",
      })
      .setOrigin(0, 0.5);
    const left = this.add
      .text(x + 112, y, "◀", {
        fontFamily: "Courier New",
        fontSize: "20px",
        color: "#fff8dc",
        backgroundColor: "#3b3152",
        padding: { x: 9, y: 4 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    const value = this.add
      .text(x + 225, y, "", {
        fontFamily: "Courier New",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#3b3152",
      })
      .setOrigin(0.5);
    const right = this.add
      .text(x + 338, y, "▶", {
        fontFamily: "Courier New",
        fontSize: "20px",
        color: "#fff8dc",
        backgroundColor: "#3b3152",
        padding: { x: 9, y: 4 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    left.on("pointerup", () => this.cycle(key, -1));
    right.on("pointerup", () => this.cycle(key, 1));
    this.valueTexts.set(key, value);
    this.updateValue(key);
  }

  private cycle(key: AppearanceKey, delta: number): void {
    const options = APPEARANCE_OPTIONS[key];
    const current = this.appearance[key];
    this.appearance[key] = Phaser.Math.Wrap(current + delta, 0, options.length);
    this.updateValue(key);
    this.updatePreview();
  }

  private updateValue(key: AppearanceKey): void {
    const option = APPEARANCE_OPTIONS[key][this.appearance[key]];
    this.valueTexts.get(key)?.setText(option ?? "-");
  }

  private updatePreview(): void {
    if (!this.preview) {
      return;
    }
    this.preview.clear();
    drawPlayer(this.preview, this.appearance);
  }

  private randomizeAppearance(): void {
    (Object.keys(APPEARANCE_OPTIONS) as AppearanceKey[]).forEach((key) => {
      this.appearance[key] = Phaser.Math.Between(0, APPEARANCE_OPTIONS[key].length - 1);
      this.updateValue(key);
    });
    this.updatePreview();
  }

  private confirmSelection(): void {
    if (this.confirmed) {
      return;
    }
    this.confirmed = true;
    gameState.setAppearance(this.appearance);
    gameState.setPhase("town-intro");
    this.cameras.main.fadeOut(180, 59, 49, 82);
    this.time.delayedCall(190, () => this.scene.start("TownScene"));
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xf6e7b7, 1);
    graphics.fillRect(0, 0, 960, 540);
    graphics.fillStyle(0xf1dca5, 0.5);
    for (let x = 0; x < 960; x += 96) graphics.fillRect(x, 108, 48, 384);
    graphics.lineStyle(1, 0xd8bd82, 0.5);
    for (let y = 156; y < 492; y += 56) graphics.lineBetween(0, y, 960, y);
    graphics.fillStyle(0xffffff, 0.22);
    for (let x = 18; x < 950; x += 84) {
      graphics.fillCircle(x, 198 + (x % 3) * 67, 3);
      graphics.fillCircle(x + 31, 314 + (x % 2) * 53, 2);
    }
    graphics.fillStyle(0xf3d995, 1);
    graphics.fillRect(0, 482, 960, 58);
    graphics.fillStyle(0xe3bd72, 1);
    for (let x = 0; x < 960; x += 64) {
      graphics.fillRect(x, 485, 2, 55);
      graphics.fillRect(x + 9, 505 + (x % 128 === 0 ? 0 : 12), 38, 4);
    }
    graphics.lineStyle(4, 0xb98b5d, 0.7);
    graphics.lineBetween(0, 483, 960, 483);
    graphics.lineStyle(3, 0x7a5872, 1);
    graphics.lineBetween(0, 108, 960, 108);
    const pennants = [0xf06c59, 0x6cc6a4, 0xf2c94c, 0x9a6fd1];
    for (let x = 24; x < 950; x += 52) {
      graphics.fillStyle(pennants[Math.floor(x / 52) % pennants.length] ?? 0xf06c59, 1);
      graphics.fillTriangle(x, 109, x + 24, 109, x + 12, 132 + (x % 3));
    }
    graphics.fillStyle(0xffdf78, 1);
    for (let y = 172; y <= 450; y += 46) {
      graphics.fillCircle(46, y, 5);
      graphics.fillCircle(914, y, 5);
      graphics.fillStyle(0xffffff, 0.75);
      graphics.fillCircle(44, y - 2, 2);
      graphics.fillCircle(912, y - 2, 2);
      graphics.fillStyle(0xffdf78, 1);
    }
    graphics.lineStyle(2, 0x8b6675, 0.7);
    graphics.lineBetween(46, 162, 46, 462);
    graphics.lineBetween(914, 162, 914, 462);
    graphics.fillStyle(0xffffff, 0.55);
    graphics.fillCircle(70, 58, 20);
    graphics.fillCircle(94, 58, 27);
    graphics.fillCircle(121, 60, 18);
    graphics.fillCircle(846, 65, 18);
    graphics.fillCircle(868, 61, 25);
    graphics.fillCircle(895, 66, 16);
  }
}
