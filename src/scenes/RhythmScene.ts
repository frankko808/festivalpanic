import Phaser from "phaser";
import { gameState } from "../state/GameState";

const NOTES = ["A", "S", "D", "S", "A", "D", "A", "S", "D", "D", "S", "A"] as const;

export class RhythmScene extends Phaser.Scene {
  private index = 0;
  private hits = 0;
  private noteText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private finished = false;
  private secondsRemaining = 30;
  private clockText!: Phaser.GameObjects.Text;
  private clockEvent?: Phaser.Time.TimerEvent;
  private returnScene = "KaiScene";
  private returnSpawn = { x: 930, y: 540 };

  constructor() {
    super("RhythmScene");
  }

  create(data: { returnScene?: string; spawn?: { x: number; y: number } } = {}): void {
    this.index = 0;
    this.hits = 0;
    this.finished = false;
    this.secondsRemaining = 30;
    this.returnScene = data.returnScene ?? "KaiScene";
    this.returnSpawn = data.spawn ?? { x: 930, y: 540 };
    this.cameras.main.setBackgroundColor("#17203a");
    this.drawStage();
    this.add.text(480, 76, "KAI-KONZERT: DREI AKKORDE", { fontFamily: "Courier New", fontSize: "30px", fontStyle: "bold", color: "#fff1a8" }).setOrigin(0.5);
    this.add.text(480, 128, "Drücke die angezeigte Taste: A · S · D", { fontFamily: "Courier New", fontSize: "18px", color: "#d9f6e9" }).setOrigin(0.5);
    this.noteText = this.add.text(480, 270, NOTES[0], { fontFamily: "Courier New", fontSize: "112px", fontStyle: "bold", color: "#ff725e", stroke: "#fff1a8", strokeThickness: 6 }).setOrigin(0.5);
    this.progressText = this.add.text(480, 390, "TAKT 1/12  •  TREFFER 0", { fontFamily: "Courier New", fontSize: "21px", color: "#fff8dc" }).setOrigin(0.5);
    this.clockText = this.add.text(860, 86, "ZEIT 30s", { fontFamily: "Courier New", fontSize: "17px", fontStyle: "bold", color: "#fff8dc", backgroundColor: "#5b405e", padding: { x: 8, y: 5 } }).setOrigin(1, 0.5);
    this.clockEvent = this.time.addEvent({ delay: 1000, repeat: 29, callback: () => {
      if (this.finished) return;
      this.secondsRemaining -= 1;
      this.clockText.setText(`ZEIT ${this.secondsRemaining}s`).setColor(this.secondsRemaining <= 10 ? "#ff9a9a" : "#fff8dc");
      if (this.secondsRemaining === 0) this.finish();
    } });
    this.add.text(480, 475, "ESC: zurück zum Kulturkai", { fontFamily: "Courier New", fontSize: "15px", color: "#a9f4d0" }).setOrigin(0.5);
    const keyboard = this.input.keyboard;
    if (keyboard) {
      const handleKeyDown = (event: KeyboardEvent): void => this.handleKey(event.key.toUpperCase());
      keyboard.on("keydown", handleKeyDown);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard.off("keydown", handleKeyDown));
    }
    this.cameras.main.fadeIn(180, 23, 32, 58);
  }

  private handleKey(key: string): void {
    if (key === "ESCAPE") {
      this.returnToWorld();
      return;
    }
    if (this.finished || !["A", "S", "D"].includes(key)) return;
    const expected = NOTES[this.index];
    if (key === expected) {
      this.hits += 1;
      this.cameras.main.flash(80, 98, 199, 166, false);
    } else {
      this.cameras.main.shake(80, 0.008);
    }
    this.index += 1;
    if (this.index >= NOTES.length) {
      this.finish();
      return;
    }
    this.noteText.setText(NOTES[this.index] ?? "A").setScale(1.25);
    this.tweens.add({ targets: this.noteText, scale: 1, duration: 120, ease: "Back.Out" });
    this.progressText.setText(`TAKT ${this.index + 1}/12  •  TREFFER ${this.hits}`);
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.clockEvent?.remove(false);
    const points = this.hits * 5;
    gameState.awardPoints(points);
    this.noteText.setText(this.hits >= 10 ? "ZUGABE!" : this.hits >= 7 ? "APPLAUS!" : "ÜBEN!").setFontSize(54).setColor("#67d5a2");
    this.progressText.setText(`${this.hits}/12 TREFFER  •  +${points} PUNKTE\n\n[E] zurück zum Kulturkai`).setAlign("center");
    this.input.keyboard?.once("keydown-E", () => this.returnToWorld());
  }

  private returnToWorld(): void {
    this.scene.start(this.returnScene, { spawn: { ...this.returnSpawn } });
  }

  private drawStage(): void {
    const g = this.add.graphics();
    g.fillStyle(0x11162b, 1); g.fillRect(0, 0, 960, 540);
    g.fillStyle(0x25203f, 1); g.fillRoundedRect(30, 28, 900, 484, 16);
    g.lineStyle(6, 0xffd878, 1); g.strokeRoundedRect(30, 28, 900, 484, 16);
    g.lineStyle(2, 0x786b98, 0.8); g.strokeRoundedRect(43, 41, 874, 458, 12);
    g.fillStyle(0x171a31, 1); g.fillRect(54, 155, 852, 292);
    g.fillStyle(0x30294f, 1); g.fillRect(54, 411, 852, 36);
    g.lineStyle(3, 0x51476c, 1);
    for (let x = 60; x < 906; x += 54) g.lineBetween(x, 411, x + 34, 447);
    const spotColors = [0xd85f73, 0x67d5a2, 0xffd45d];
    [255, 480, 705].forEach((x, index) => {
      g.fillStyle(spotColors[index] ?? 0xffffff, 0.13);
      g.fillTriangle(x - 18, 58, x + 18, 58, x + 92 - index * 92, 405);
      g.fillStyle(0x3b3152, 1); g.fillRoundedRect(x - 27, 48, 54, 24, 5);
      g.fillStyle(spotColors[index] ?? 0xffffff, 1); g.fillCircle(x, 62, 8);
    });
    [88, 872].forEach((x) => {
      g.fillStyle(0x0b0d19, 1); g.fillRoundedRect(x - 34, 190, 68, 184, 8);
      g.fillStyle(0x3e3655, 1); g.fillRoundedRect(x - 27, 197, 54, 170, 6);
      g.fillStyle(0x151729, 1); g.fillCircle(x, 242, 21); g.fillCircle(x, 326, 27);
      g.lineStyle(3, 0x756b8c, 1); g.strokeCircle(x, 242, 21); g.strokeCircle(x, 326, 27);
    });
    [360, 480, 600].forEach((x, index) => {
      g.fillStyle(index === 0 ? 0xd85f73 : index === 1 ? 0xffd45d : 0x67d5a2, 0.82);
      g.fillRoundedRect(x - 42, 342, 84, 45, 8);
      g.fillStyle(0x171a31, 1); g.fillRoundedRect(x - 34, 349, 68, 31, 6);
      this.add.text(x, 365, ["A", "S", "D"][index] ?? "A", { fontFamily: "Courier New", fontSize: "22px", fontStyle: "bold", color: "#fff8dc" }).setOrigin(0.5).setDepth(2);
    });
    for (let index = 0; index < 11; index += 1) {
      const bar = this.add.rectangle(275 + index * 41, 420, 18, 10 + (index % 5) * 6, spotColors[index % spotColors.length] ?? 0xffffff, 0.72).setOrigin(0.5, 1);
      this.tweens.add({ targets: bar, scaleY: 1.7 + (index % 3) * 0.5, duration: 300 + index * 34, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    }
  }
}
