import Phaser from "phaser";
import { gameState } from "../state/GameState";

export type FestivalGameKind = "fries" | "cans" | "find-rudi";

const FRIES_ORDERS = [2, 0, 3, 1, 1, 2, 3, 0] as const;
const FRIES_LABELS = ["KLEIN + KETCHUP", "KLEIN + MAYO", "GROSS + KETCHUP", "GROSS + MAYO"] as const;

export class FestivalGameScene extends Phaser.Scene {
  private kind: FestivalGameKind = "fries";
  private returnScene = "FestivalScene";
  private returnSpawn = { x: 800, y: 790 };
  private finished = false;
  private resultText!: Phaser.GameObjects.Text;
  private footerText!: Phaser.GameObjects.Text;
  private orderText?: Phaser.GameObjects.Text;
  private friesStatus?: Phaser.GameObjects.Text;
  private friesIndex = 0;
  private friesScore = 0;
  private readonly friesButtons: Phaser.GameObjects.Text[] = [];
  private secondsRemaining = 0;
  private clockText!: Phaser.GameObjects.Text;
  private clockEvent?: Phaser.Time.TimerEvent;
  private selectedRudiCard = 0;
  private readonly rudiCards: Phaser.GameObjects.Rectangle[] = [];
  private rudiIndex = 0;
  private canCursor?: Phaser.GameObjects.Rectangle;
  private canStatus?: Phaser.GameObjects.Text;
  private canFeedback?: Phaser.GameObjects.Text;
  private canThrows = 0;
  private canScore = 0;

  constructor() {
    super("FestivalGameScene");
  }

  create(data: { kind?: FestivalGameKind; returnScene?: string; spawn?: { x: number; y: number } } = {}): void {
    this.kind = data.kind ?? "fries";
    this.returnScene = data.returnScene ?? "FestivalScene";
    this.returnSpawn = data.spawn ?? { x: 800, y: 790 };
    this.finished = false;
    this.friesIndex = 0;
    this.friesScore = 0;
    this.friesButtons.length = 0;
    this.rudiCards.length = 0;
    this.canThrows = 0;
    this.canScore = 0;
    this.cameras.main.setBackgroundColor("#11152d");
    this.drawFrame();
    if (this.kind === "fries") this.createFriesRush();
    else if (this.kind === "cans") this.createCanToss();
    else this.createFindRudi();
    this.startClock(this.kind === "fries" ? 60 : 45);

    const keyboard = this.input.keyboard;
    if (keyboard) {
      const handleKeyDown = (event: KeyboardEvent): void => this.handleKey(event.key);
      keyboard.on("keydown", handleKeyDown);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard.off("keydown", handleKeyDown));
    }
    this.cameras.main.fadeIn(180, 17, 21, 45);
  }

  update(): void {
    if (this.kind !== "cans" || this.finished || !this.canCursor) return;
    this.canCursor.x = 220 + (Math.sin(this.time.now / 430) * 0.5 + 0.5) * 520;
  }

  private handleKey(rawKey: string): void {
    const key = rawKey.toUpperCase();
    if (key === "ESCAPE") {
      this.returnToFestival();
      return;
    }
    if (this.finished) {
      if (key === "E" || key === "ENTER") this.returnToFestival();
      return;
    }
    if (this.kind === "fries" && ["1", "2", "3", "4"].includes(key)) {
      this.serveFries(Number(key) - 1);
    } else if (this.kind === "cans" && (key === " " || key === "SPACEBAR" || key === "ENTER")) {
      this.throwBall();
    } else if (this.kind === "find-rudi") {
      if (key === "ARROWLEFT" || key === "A") this.selectRudiCard((this.selectedRudiCard + 14) % 15);
      else if (key === "ARROWRIGHT" || key === "D") this.selectRudiCard((this.selectedRudiCard + 1) % 15);
      else if (key === "ARROWUP" || key === "W") this.selectRudiCard((this.selectedRudiCard + 10) % 15);
      else if (key === "ARROWDOWN" || key === "S") this.selectRudiCard((this.selectedRudiCard + 5) % 15);
      else if (key === "ENTER" || key === "E" || key === " ") this.chooseRudiCard(this.selectedRudiCard);
    }
  }

  private startClock(seconds: number): void {
    this.secondsRemaining = seconds;
    this.clockText = this.add.text(886, 77, "", {
      fontFamily: "Courier New", fontSize: "17px", fontStyle: "bold",
      color: "#fff8dc", backgroundColor: "#5b405e", padding: { x: 8, y: 5 },
    }).setOrigin(1, 0.5);
    this.updateClock();
    this.clockEvent = this.time.addEvent({
      delay: 1000, repeat: seconds - 1,
      callback: () => {
        if (this.finished) return;
        this.secondsRemaining -= 1;
        this.updateClock();
        if (this.kind === "fries") this.updateFriesText();
        if (this.secondsRemaining === 0) {
          if (this.kind === "fries") this.finishFries();
          else if (this.kind === "cans") this.finishCans();
          else this.finish("Die Zeit ist um. Rudi hat das Verstecken etwas zu ernst genommen.\n\nVersuch es am Suchstand erneut.");
        }
      },
    });
  }

  private updateClock(): void {
    this.clockText.setText(`ZEIT ${this.secondsRemaining}s`).setColor(this.secondsRemaining <= 10 ? "#ff9a9a" : "#fff8dc");
  }

  private drawFrame(): void {
    const g = this.add.graphics();
    g.fillStyle(0x11152d, 1); g.fillRect(0, 0, 960, 540);
    g.fillStyle(0x24213c, 1); g.fillRoundedRect(28, 24, 904, 486, 18);
    g.lineStyle(6, 0xffd878, 1); g.strokeRoundedRect(28, 24, 904, 486, 18);
    g.lineStyle(2, 0x8f82ac, 0.78); g.strokeRoundedRect(42, 38, 876, 458, 13);
    for (let x = 58, index = 0; x < 920; x += 58, index += 1) {
      g.fillStyle([0xff725e, 0xffd45d, 0x67d5a2, 0x9b78cf][index % 4] ?? 0xffffff, 1);
      g.fillTriangle(x - 9, 39, x + 9, 39, x, 55);
    }
    this.resultText = this.add.text(480, 440, "", {
      fontFamily: "Courier New", fontSize: "22px", fontStyle: "bold", align: "center", color: "#fff1a8",
    }).setOrigin(0.5);
    this.footerText = this.add.text(480, 480, "ESC: zurück zum Nachtfestival", {
      fontFamily: "Courier New", fontSize: "14px", color: "#a9f4d0",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.footerText.on("pointerup", () => this.returnToFestival());
  }

  private createFriesRush(): void {
    this.add.text(480, 78, "POMMES-RUSH", { fontFamily: "Courier New", fontSize: "34px", fontStyle: "bold", color: "#fff1a8" }).setOrigin(0.5);
    this.add.text(480, 116, "Samira: Menschen wollen gleichzeitig Pommes!", { fontFamily: "Trebuchet MS", fontSize: "17px", fontStyle: "bold", color: "#ffb0aa" }).setOrigin(0.5);
    this.orderText = this.add.text(480, 183, "", { fontFamily: "Courier New", fontSize: "25px", fontStyle: "bold", color: "#ffffff", backgroundColor: "#d85f73", padding: { x: 18, y: 10 } }).setOrigin(0.5);
    FRIES_LABELS.forEach((label, index) => {
      const x = index % 2 === 0 ? 290 : 670;
      const y = index < 2 ? 280 : 345;
      const button = this.add.text(x, y, `${index + 1}  ${label}`, { fontFamily: "Courier New", fontSize: "16px", fontStyle: "bold", color: "#fff8dc", backgroundColor: index % 2 === 0 ? "#5b405e" : "#386f68", padding: { x: 15, y: 11 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      button.on("pointerup", () => this.serveFries(index));
      button.on("pointerover", () => button.setScale(1.04).setColor("#ffe37c"));
      button.on("pointerout", () => button.setScale(1).setColor("#fff8dc"));
      this.friesButtons.push(button);
    });
    this.friesStatus = this.add.text(480, 225, "", { fontFamily: "Courier New", fontSize: "17px", color: "#a9f4d0" }).setOrigin(0.5);
    this.updateFriesText();
  }

  private serveFries(selection: number): void {
    if (this.finished || this.kind !== "fries") return;
    const expected = FRIES_ORDERS[this.friesIndex];
    if (selection === expected) {
      this.friesScore += 40;
      this.cameras.main.flash(80, 103, 213, 162, false);
    } else {
      this.friesScore -= 10;
      this.cameras.main.shake(90, 0.008);
    }
    this.friesIndex += 1;
    if (this.friesIndex >= FRIES_ORDERS.length) this.finishFries();
    else this.updateFriesText();
  }

  private updateFriesText(): void {
    const order = FRIES_LABELS[FRIES_ORDERS[this.friesIndex] ?? 0] ?? FRIES_LABELS[0];
    this.orderText?.setText(`BESTELLUNG: ${order}`);
    this.friesStatus?.setText(`BESTELLUNG ${Math.min(this.friesIndex + 1, 8)}/8  •  ${this.friesScore} PUNKTE`);
  }

  private finishFries(): void {
    if (this.finished) return;
    this.orderText?.setVisible(false);
    this.friesStatus?.setVisible(false);
    this.friesButtons.forEach((button) => button.setVisible(false));
    const score = Math.max(0, this.friesScore);
    const gained = gameState.recordFestivalActivity("fries", score);
    this.finish(`Samira: Danke, das hat den Andrang aufgefangen.\nRudi: Jetzt haben wir selbst eine Pause verdient.\n\n${score} PUNKTE  •  +${gained} ZUM SPIELSTAND`);
  }

  private createCanToss(): void {
    this.add.text(480, 78, "DOSENWERFEN", { fontFamily: "Courier New", fontSize: "34px", fontStyle: "bold", color: "#fff1a8" }).setOrigin(0.5);
    this.add.text(480, 116, "Fünf Würfe. SPACE oder ENTER im goldenen Bereich.", { fontFamily: "Trebuchet MS", fontSize: "17px", fontStyle: "bold", color: "#d9f6e9" }).setOrigin(0.5);
    const g = this.add.graphics();
    const canPositions = [[450, 220], [480, 220], [510, 220], [465, 188], [495, 188], [480, 156]] as const;
    canPositions.forEach(([x, y], index) => {
      g.fillStyle(index % 2 === 0 ? 0x69bfd0 : 0xf1787c, 1); g.fillRoundedRect(x - 10, y - 16, 20, 32, 4);
      g.fillStyle(0xfff0bd, 1); g.fillRect(x - 9, y - 10, 18, 5); g.fillRect(x - 9, y + 7, 18, 4);
    });
    g.fillStyle(0x17182c, 1); g.fillRoundedRect(200, 278, 560, 44, 8);
    g.fillStyle(0xd85f73, 1); g.fillRect(210, 288, 150, 24);
    g.fillStyle(0xffd878, 1); g.fillRect(360, 288, 240, 24);
    g.fillStyle(0x67d5a2, 1); g.fillRect(430, 285, 100, 30);
    g.fillStyle(0xd85f73, 1); g.fillRect(600, 288, 150, 24);
    this.canCursor = this.add.rectangle(220, 300, 8, 55, 0xffffff).setStrokeStyle(2, 0x49364c);
    this.canFeedback = this.add.text(480, 255, "", {
      fontFamily: "Courier New", fontSize: "16px", fontStyle: "bold", color: "#a9f4d0",
    }).setOrigin(0.5);
    this.canStatus = this.add.text(480, 365, "WURF 1/5  •  0 PUNKTE", { fontFamily: "Courier New", fontSize: "21px", fontStyle: "bold", color: "#fff8dc" }).setOrigin(0.5);
  }

  private throwBall(): void {
    if (this.finished || this.kind !== "cans" || !this.canCursor) return;
    const accuracy = 1 - Math.min(1, Math.abs(this.canCursor.x - 480) / 260);
    const knocked = accuracy >= 0.82 ? 3 : accuracy >= 0.55 ? 2 : accuracy >= 0.25 ? 1 : 0;
    const points = knocked >= 3 ? 100 : knocked === 2 ? 50 : knocked === 1 ? 20 : 0;
    this.canScore += points;
    this.canThrows += 1;
    this.canFeedback?.setText(knocked === 0 ? "DANEBEN" : `${knocked} ${knocked === 1 ? "DOSE" : "DOSEN"}`).setColor(knocked === 0 ? "#ff8b91" : "#a9f4d0").setScale(1.18);
    if (this.canFeedback) this.tweens.add({ targets: this.canFeedback, scale: 1, duration: 120, ease: "Back.Out" });
    if (knocked > 0) this.cameras.main.shake(70, 0.005 + knocked * 0.002);
    if (this.canThrows >= 5) {
      this.finishCans();
      return;
    }
    this.canStatus?.setText(`WURF ${this.canThrows + 1}/5  •  ${this.canScore} PUNKTE`);
  }

  private finishCans(): void {
    if (this.finished) return;
    const gained = gameState.recordFestivalActivity("cans", this.canScore);
    const rudi = this.canScore === 0 ? "Der nächste Versuch wird besser." : this.canScore >= 500 ? "Alle Dosen erwischt!" : "Guter Wurf. Noch eine Runde?";
    this.finish(`Rudi: ${rudi}\n\n${this.canScore} PUNKTE  •  +${gained} ZUM SPIELSTAND`);
  }

  private createFindRudi(): void {
    this.add.text(480, 76, "FINDE RUDI", { fontFamily: "Courier New", fontSize: "34px", fontStyle: "bold", color: "#fff1a8" }).setOrigin(0.5);
    this.add.text(480, 116, "Rudi versteckt sich unter 15 Festivalgästen. Finde den Waschbären!", { fontFamily: "Trebuchet MS", fontSize: "17px", fontStyle: "bold", color: "#d9f6e9" }).setOrigin(0.5);
    this.add.text(480, 145, "FIGUR ANKLICKEN  ODER  PFEILE/WASD + ENTER/E", { fontFamily: "Courier New", fontSize: "15px", color: "#ffe39c" }).setOrigin(0.5);
    const hidingTextures = ["npc-red", "npc-green", "npc-purple", "npc-jogger", "npc-gardener", "npc-clerk"] as const;
    this.rudiIndex = Phaser.Math.Between(0, 14);
    for (let index = 0; index < 15; index += 1) {
      const column = index % 5;
      const row = Math.floor(index / 5);
      const x = 250 + column * 115;
      const y = 204 + row * 72;
      const panel = this.add.rectangle(x, y, 94, 68, index % 2 === 0 ? 0x51476c : 0x3d5f61, 0.9).setStrokeStyle(2, 0xffd878, 0.42).setInteractive({ useHandCursor: true });
      const texture = index === this.rudiIndex ? "rudi" : hidingTextures[index % hidingTextures.length] ?? "npc-clerk";
      this.add.image(x, y + 4, texture).setOrigin(0.5, 0.7).setScale(index === this.rudiIndex ? 0.9 : 0.83);
      this.add.text(x - 40, y - 24, String(index + 1), { fontFamily: "Courier New", fontSize: "12px", color: "#fff1a8" });
      panel.on("pointerup", () => this.chooseRudiCard(index));
      this.rudiCards.push(panel);
    }
    this.selectRudiCard(0);
    this.footerText.setText("ESC: Suche verlassen – Rudi bleibt bis zum Wiederfinden versteckt");
  }

  private selectRudiCard(index: number): void {
    this.selectedRudiCard = index;
    this.rudiCards.forEach((card, cardIndex) => card.setStrokeStyle(cardIndex === index ? 4 : 2, 0xffd878, cardIndex === index ? 1 : 0.42));
  }

  private chooseRudiCard(index: number): void {
    if (this.finished) return;
    this.selectRudiCard(index);
    if (index === this.rudiIndex) {
      const gained = gameState.recordFestivalActivity("find-rudi", 500);
      this.finish(`Gefunden: Gast ${index + 1}!\nRudi: Da bist du ja. Ich hatte die Musik im Blick.\n+${gained} PUNKTE`);
    } else {
      this.rudiCards[index]?.setFillStyle(0x8a4d63, 0.95);
      this.resultText.setText("Hier steckt nur ein Festivalgast. Such weiter!").setColor("#ffb0aa");
      this.secondsRemaining = Math.max(1, this.secondsRemaining - 2);
      this.updateClock();
    }
  }

  private finish(message: string): void {
    this.finished = true;
    this.clockEvent?.remove(false);
    this.resultText.setFontSize(18).setText(message);
    this.footerText.setText("[E] zurück zum Nachtfestival  •  ESC: zurück");
    this.cameras.main.flash(160, 255, 216, 120, false);
  }

  private returnToFestival(): void {
    this.scene.start(this.returnScene, { spawn: { ...this.returnSpawn }, resume: true });
  }
}
