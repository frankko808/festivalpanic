import Phaser from "phaser";
import { gameState } from "../state/GameState";

export class TitleScene extends Phaser.Scene {
  private started = false;
  private enterKey?: Phaser.Input.Keyboard.Key;
  private enterArmed = false;
  private confirmationOpen = false;

  constructor() {
    super("TitleScene");
  }

  create(): void {
    this.started = false;
    this.confirmationOpen = false;
    gameState.setPhase("title");
    this.cameras.main.setBackgroundColor("#5cb9a7");
    this.drawFestivalBackdrop();

    const festivalTitle = this.add
      .text(480, 102, "FESTIVAL", {
        fontFamily: "Courier New",
        fontSize: "68px",
        fontStyle: "bold",
        color: "#fff1a8",
        stroke: "#3e3151",
        strokeThickness: 10,
      })
      .setOrigin(0.5);
    const panicTitle = this.add
      .text(480, 169, "PANIC!", {
        fontFamily: "Courier New",
        fontSize: "74px",
        fontStyle: "bold",
        color: "#ff725e",
        stroke: "#3e3151",
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setAngle(-2);
    this.tweens.add({
      targets: festivalTitle,
      y: 97,
      duration: 1250,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
    this.tweens.add({
      targets: panicTitle,
      y: 175,
      angle: 1.5,
      scaleX: 1.025,
      scaleY: 1.025,
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
    this.add.rectangle(480, 238, 540, 38, 0x17203a, 0.58).setStrokeStyle(2, 0xffd878, 0.65);
    this.add
      .text(480, 238, "Rette das Sommerfest. Irgendwie.", {
        fontFamily: "Courier New",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#fff8dc",
      })
      .setOrigin(0.5);

    const hasResume = gameState.hasResume;
    const button = this.add
      .text(480, hasResume ? 290 : 305, hasResume ? "SPIEL FORTSETZEN" : "SPIEL STARTEN", {
        fontFamily: "Courier New",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#fff8dc",
        backgroundColor: "#3e3151",
        padding: { x: 26, y: 15 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setColor("#ffe06f").setScale(1.04));
    button.on("pointerout", () => button.setColor("#fff8dc").setScale(1));
    button.on("pointerup", () => hasResume ? this.resumeGame() : this.startGame());
    this.tweens.add({
      targets: button,
      y: hasResume ? 296 : 311,
      duration: 980,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
    if (hasResume) {
      const newGame = this.add.text(480, 368, "NEUES SPIEL", {
        fontFamily: "Courier New", fontSize: "20px", fontStyle: "bold", color: "#fff8dc",
        backgroundColor: "#3e3151", padding: { x: 18, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      newGame.on("pointerup", () => this.confirmNewGame());
    }
    this.add.text(480, hasResume ? 422 : 384, "V: TON AN/AUS", {
      fontFamily: "Courier New", fontSize: "14px", fontStyle: "bold", color: "#fff8dc",
      backgroundColor: "#3e3151bb", padding: { x: 8, y: 5 },
    }).setOrigin(0.5);
    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.enterArmed = Boolean(this.enterKey?.isUp);

  }

  update(): void {
    if (!this.enterKey || this.started || this.confirmationOpen) {
      return;
    }
    if (this.enterKey.isUp) {
      this.enterArmed = true;
      return;
    }
    if (this.enterArmed && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.enterArmed = false;
      if (gameState.hasResume) this.resumeGame();
      else this.startGame();
    }
  }

  private startGame(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    gameState.resetRun();
    gameState.setPhase("character-select");
    this.cameras.main.fadeOut(180, 23, 32, 58);
    this.time.delayedCall(190, () => this.scene.start("CharacterSelectScene"));
  }

  private resumeGame(): void {
    if (this.started) return;
    const point = gameState.resumeSavedRun();
    if (!point) return;
    this.started = true;
    const data = {
      spawn: { x: point.x, y: point.y },
      resume: true,
      shopId: point.shopId,
      returnSpawn: point.returnSpawn,
    };
    this.cameras.main.fadeOut(180, 23, 32, 58);
    this.time.delayedCall(190, () => this.scene.start(point.scene, data));
  }

  private confirmNewGame(): void {
    if (this.confirmationOpen) return;
    this.confirmationOpen = true;
    const overlay = this.add.container(0, 0).setDepth(100);
    const shade = this.add.rectangle(480, 270, 960, 540, 0x14182e, 0.78).setInteractive();
    const panel = this.add.rectangle(480, 270, 600, 210, 0x27213d).setStrokeStyle(4, 0xffd878);
    const question = this.add.text(480, 223, "Gespeicherten Lauf ersetzen?", { fontFamily: "Trebuchet MS", fontSize: "25px", color: "#fff8dc" }).setOrigin(0.5);
    const warning = this.add.text(480, 263, "Highscore und Erfolge bleiben erhalten.", { fontFamily: "Trebuchet MS", fontSize: "16px", color: "#b8ecd7" }).setOrigin(0.5);
    const cancel = this.add.text(355, 327, "ZURÜCK", { fontFamily: "Courier New", fontSize: "18px", color: "#fff8dc", backgroundColor: "#4a416b", padding: { x: 14, y: 9 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const confirm = this.add.text(610, 327, "NEU STARTEN", { fontFamily: "Courier New", fontSize: "18px", color: "#27213d", backgroundColor: "#ffdf88", padding: { x: 14, y: 9 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    overlay.add([shade, panel, question, warning, cancel, confirm]);
    cancel.on("pointerup", () => { overlay.destroy(true); this.confirmationOpen = false; });
    confirm.on("pointerup", () => this.startGame());
  }

  private drawFestivalBackdrop(): void {
    this.add.image(480, 270, "festival-town-title").setDisplaySize(960, 540).setDepth(-30);
    const graphics = this.add.graphics().setVisible(false);
    graphics.fillStyle(0x8bdcc5, 1);
    graphics.fillRect(0, 0, 960, 540);
    graphics.fillStyle(0xb9ead6, 1);
    graphics.fillRect(0, 0, 960, 145);
    graphics.fillStyle(0xffe681, 1);
    graphics.fillCircle(92, 110, 48);
    graphics.fillStyle(0xffffff, 0.72);
    graphics.fillCircle(220, 100, 25);
    graphics.fillCircle(250, 92, 34);
    graphics.fillCircle(286, 102, 23);
    graphics.fillCircle(720, 110, 21);
    graphics.fillCircle(747, 102, 30);
    graphics.fillCircle(779, 112, 20);
    graphics.fillStyle(0x66b780, 1);
    graphics.fillCircle(160, 435, 180);
    graphics.fillCircle(460, 458, 205);
    graphics.fillCircle(820, 435, 185);
    graphics.fillStyle(0x5a9f72, 1);
    graphics.fillRect(0, 400, 960, 140);
    graphics.fillStyle(0x4b8c68, 1);
    for (let x = 0; x < 960; x += 34) {
      graphics.fillTriangle(x, 422, x + 17, 391 + (x % 3) * 3, x + 34, 422);
    }
    graphics.fillStyle(0x443954, 1);
    graphics.fillRect(350, 342, 260, 92);
    graphics.fillStyle(0x634b72, 1);
    graphics.fillTriangle(350, 342, 396, 342, 350, 420);
    graphics.fillTriangle(610, 342, 564, 342, 610, 420);
    graphics.fillStyle(0x302b49, 1);
    graphics.fillRect(332, 426, 296, 18);
    [382, 430, 480, 530, 578].forEach((x, index) => {
      graphics.fillStyle(index % 2 === 0 ? 0xffe06f : 0xff7b79, 1);
      graphics.fillCircle(x, 351, 5);
    });
    graphics.fillStyle(0xf3d072, 1);
    graphics.fillTriangle(120, 360, 190, 250, 260, 360);
    graphics.fillStyle(0xfff0b4, 1);
    graphics.fillTriangle(136, 353, 190, 265, 244, 353);
    graphics.fillStyle(0xf3d072, 1);
    graphics.fillRect(139, 351, 102, 50);
    graphics.fillStyle(0xff765e, 1);
    graphics.fillTriangle(700, 360, 770, 238, 840, 360);
    graphics.fillStyle(0xffa08c, 1);
    graphics.fillTriangle(715, 353, 770, 255, 825, 353);
    graphics.fillStyle(0xff765e, 1);
    graphics.fillRect(716, 351, 108, 52);
    graphics.fillStyle(0x3e3151, 1);
    for (let x = 70; x <= 890; x += 82) {
      graphics.fillCircle(x, 70 + (x % 164 === 0 ? 18 : 0), 7);
      if (x < 890) {
        graphics.lineStyle(3, 0x3e3151, 1);
        graphics.lineBetween(x, 70 + (x % 164 === 0 ? 18 : 0), x + 82, 70 + ((x + 82) % 164 === 0 ? 18 : 0));
      }
    }
    for (let x = 82, index = 0; x < 890; x += 82, index += 1) {
      graphics.fillStyle([0xff725e, 0xffe06f, 0x6cd0af, 0xa982d4][index % 4] ?? 0xff725e, 1);
      graphics.fillTriangle(x - 12, 77, x + 12, 77, x, 96);
    }
    graphics.fillStyle(0x33435a, 0.82);
    for (let x = 300; x < 680; x += 35) {
      graphics.fillCircle(x, 455 + (x % 4) * 2, 9);
      graphics.fillRect(x - 7, 461, 14, 28);
    }
    // Kleine Stadt-Silhouette mit Rathaus und Brunnen: der Titel zeigt sofort, dass
    // Festival Panic in einer belebten Stadt spielt, nicht auf einer leeren Wiese.
    graphics.fillStyle(0xe6c99d, 1);
    graphics.fillRect(420, 390, 120, 48);
    graphics.fillStyle(0xc56558, 1);
    graphics.fillTriangle(406, 394, 480, 337, 554, 394);
    graphics.fillStyle(0x54798b, 1);
    graphics.fillRect(442, 405, 18, 20);
    graphics.fillRect(500, 405, 18, 20);
    graphics.fillStyle(0x5e4338, 1);
    graphics.fillRect(471, 407, 18, 31);
    graphics.fillStyle(0x92dce1, 1);
    graphics.fillEllipse(480, 475, 120, 22);
    graphics.fillStyle(0x6db4c0, 1);
    graphics.fillEllipse(480, 468, 92, 20);
    graphics.fillStyle(0xeafff7, 0.9);
    graphics.fillRect(477, 424, 6, 44);
    graphics.fillTriangle(466, 442, 480, 420, 494, 442);

    this.createMovingCloud(-110, 45, 0.85, 21_000);
    this.createMovingCloud(690, 155, 0.58, 26_000);
    this.createFallingConfetti();

    const leftBalloons = this.add.image(86, 395, "balloons").setScale(1.45).setAngle(-6);
    const rightBalloons = this.add.image(894, 362, "balloons").setScale(1.25).setAngle(5);
    this.tweens.add({
      targets: leftBalloons,
      y: 382,
      angle: 5,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
    this.tweens.add({
      targets: rightBalloons,
      y: 351,
      angle: -5,
      duration: 1450,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });

    ([
      [320, 446],
      [390, 451],
      [460, 447],
      [530, 452],
      [600, 446],
    ] as const).forEach(([x, y], index) => {
      const dancer = this.add.container(x, y).setVisible(false);
      dancer.add([
        this.add.circle(0, -9, 7, [0xf0c84c, 0xee7b8f, 0x6cc6a4][index % 3] ?? 0xf0c84c),
        this.add.rectangle(0, 8, 13, 24, 0x3d405b),
      ]);
      this.tweens.add({
        targets: dancer,
        y: y - 8,
        angle: index % 2 === 0 ? -3 : 3,
        duration: 430 + index * 70,
        yoyo: true,
        repeat: -1,
        ease: "Quad.Out",
      });
    });

    [
      [92, 205, "#fff1a8"],
      [858, 185, "#ff8ba1"],
      [310, 310, "#eafff7"],
      [730, 300, "#fff1a8"],
    ].forEach(([x, y, color], index) => {
      const sparkle = this.add
        .text(Number(x), Number(y), index % 2 === 0 ? "✦" : "★", {
          fontFamily: "Courier New",
          fontSize: "20px",
          color: String(color),
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: sparkle,
        alpha: 0.25,
        scale: 0.7,
        duration: 600 + index * 110,
        yoyo: true,
        repeat: -1,
      });
    });
  }

  private createMovingCloud(x: number, y: number, scale: number, duration: number): void {
    const cloud = this.add.container(x, y).setScale(scale).setAlpha(0.62);
    cloud.add([
      this.add.circle(-28, 5, 23, 0xffffff),
      this.add.circle(0, -3, 32, 0xffffff),
      this.add.circle(33, 7, 22, 0xffffff),
      this.add.ellipse(2, 14, 98, 28, 0xffffff),
    ]);
    this.tweens.add({
      targets: cloud,
      x: 1080,
      duration,
      repeat: -1,
      ease: "Linear",
    });
  }

  private createFallingConfetti(): void {
    const colors = [0xff6f76, 0xffd45d, 0x62c7a6, 0x9e79d4, 0x64a7d9];
    for (let index = 0; index < 18; index += 1) {
      const confetti = this.add
        .rectangle(28 + ((index * 83) % 910), -30 - ((index * 47) % 180), 6, 11, colors[index % colors.length] ?? 0xff6f76)
        .setAngle(index * 19)
        .setAlpha(0.75);
      this.tweens.add({
        targets: confetti,
        y: 570,
        x: confetti.x + (index % 2 === 0 ? 35 : -35),
        angle: confetti.angle + 360,
        duration: 4400 + index * 170,
        delay: index * 115,
        repeat: -1,
        repeatDelay: 220,
        ease: "Linear",
      });
    }
  }
}
