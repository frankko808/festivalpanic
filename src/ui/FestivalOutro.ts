import Phaser from "phaser";
import type { FestivalOutroArt, FestivalOutroMoment } from "../data/festivalOutroMoments";

const CREAM = "#fff3d0";
const MINT = "#b8ecd7";
const GOLD = 0xffd878;

export class FestivalOutro {
  private readonly container: Phaser.GameObjects.Container;
  private index = 0;
  private readonly onPointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.y < 477 || pointer.y > 512) return;
    if (pointer.x >= 750 && pointer.x <= 900) this.advance();
    else if (pointer.x >= 75 && pointer.x <= 225) this.back();
  };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly moments: readonly FestivalOutroMoment[],
    private readonly stageCount: number,
    private readonly votes: number,
    private readonly onComplete: () => void,
  ) {
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(6000);
    scene.input.on("pointerup", this.onPointerUp);
    this.render();
  }

  advance(): void {
    if (this.index + 1 >= this.moments.length) {
      this.scene.input.off("pointerup", this.onPointerUp);
      this.container.destroy(true);
      this.onComplete();
      return;
    }
    this.index += 1;
    this.render();
  }

  back(): void {
    if (this.index === 0) return;
    this.index -= 1;
    this.render();
  }

  private add<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.container.add(object);
    return object;
  }

  private label(x: number, y: number, text: string, size: number, color = CREAM): Phaser.GameObjects.Text {
    return this.add(this.scene.add.text(x, y, text, {
      fontFamily: "Courier New", fontSize: `${size}px`, fontStyle: "bold", color,
      align: "center",
    }).setOrigin(0.5));
  }

  private portrait(x: number, y: number, texture: string, scale = 1.7): void {
    this.add(this.scene.add.image(x, y, texture).setOrigin(0.5, 0.8).setScale(scale));
  }

  private render(): void {
    const moment = this.moments[this.index];
    if (!moment) return;
    this.container.removeAll(true);
    const g = this.add(this.scene.add.graphics());
    g.fillStyle(0x14182e, 1).fillRect(0, 0, 960, 540);
    g.fillStyle(0x26213f, 1).fillRoundedRect(39, 28, 882, 484, 16);
    g.lineStyle(5, GOLD, 1).strokeRoundedRect(39, 28, 882, 484, 16);
    g.lineStyle(2, 0x8f82ac, 0.85).strokeRoundedRect(51, 40, 858, 460, 12);
    g.fillStyle(0x34425b, 1).fillRoundedRect(72, 111, 816, 245, 12);
    g.lineStyle(2, 0x8f82ac, 0.75).strokeRoundedRect(72, 111, 816, 245, 12);
    this.drawArtwork(moment.art, g);

    this.label(480, 60, "WIE DAS FEST ENTSTAND", 28, "#ffdf88");
    this.label(480, 91, "VIER MOMENTE AUS DEINEM WEG", 13, MINT);
    this.label(480, 383, moment.title.toUpperCase(), 24, "#ffdf88");
    this.add(this.scene.add.text(94, 408, moment.memory, {
      fontFamily: "Trebuchet MS", fontSize: "14px", color: CREAM,
      wordWrap: { width: 772, useAdvancedWrap: true }, align: "center",
    }).setOrigin(0.5, 0).setX(480));
    this.add(this.scene.add.text(94, 446, moment.insight, {
      fontFamily: "Trebuchet MS", fontSize: "14px", fontStyle: "bold", color: MINT,
      wordWrap: { width: 772, useAdvancedWrap: true }, align: "center",
    }).setOrigin(0.5, 0).setX(480));

    const next = this.label(813, 493, this.index + 1 === this.moments.length ? "AUSWERTUNG  ▶" : "WEITER  ▶", 16, "#232039");
    next.setBackgroundColor("#ffdf88").setPadding(9, 5).setInteractive({ useHandCursor: true });
    if (this.index > 0) {
      const back = this.label(146, 493, "◀  ZURÜCK", 14, CREAM);
      back.setInteractive({ useHandCursor: true });
    }
    this.label(480, 493, `${this.index + 1} / ${this.moments.length}    E / ENTER`, 13, "#c5bcd5");
  }

  private drawArtwork(art: FestivalOutroArt, g: Phaser.GameObjects.Graphics): void {
    if (art === "voices") this.drawVoices(g);
    else if (art === "negotiation") this.drawNegotiation(g);
    else if (art === "council") this.drawCouncil(g);
    else this.drawFestival(g);
  }

  private drawVoices(g: Phaser.GameObjects.Graphics): void {
    const groups = [
      { x: 175, texture: "mia", name: "MIA", topic: "MUSIK", color: 0xd86b79 },
      { x: 375, texture: "broemmel", name: "BRÖMMEL", topic: "RUHE", color: 0x647198 },
      { x: 575, texture: "nora", name: "NORA", topic: "UMWELT", color: 0x63a27a },
      { x: 775, texture: "centner", name: "CENTNER", topic: "BUDGET", color: 0xc9a266 },
    ];
    groups.forEach(({ x, texture, name, topic, color }) => {
      g.fillStyle(color, 1).fillRoundedRect(x - 78, 133, 156, 203, 8);
      g.fillStyle(0x24223e, 0.68).fillRoundedRect(x - 68, 143, 136, 183, 5);
      g.fillStyle(GOLD, 0.85).fillRect(x - 58, 288, 116, 3);
      this.portrait(x, 257, texture, 2.05);
      this.label(x, 307, name, 14);
      this.label(x, 324, topic, 10, MINT);
    });
  }

  private drawNegotiation(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x51405a, 1).fillRoundedRect(148, 136, 664, 196, 12);
    g.fillStyle(0xb4825d, 1).fillRoundedRect(176, 206, 608, 112, 28);
    g.fillStyle(0xd8ad74, 1).fillRoundedRect(192, 214, 576, 85, 20);
    this.portrait(260, 212, "mia", 1.48);
    this.portrait(700, 212, "nora", 1.48);
    this.portrait(480, 201, "player", 1.48);
    const cards = [
      { x: 304, title: "ZEITPLAN", color: 0xe68683 },
      { x: 480, title: "PFAND", color: 0x8fd3a5 },
      { x: 656, title: "KOSTEN", color: 0xe8c574 },
    ];
    cards.forEach(({ x, title, color }) => {
      g.fillStyle(0x302744, 0.28).fillRoundedRect(x - 61, 245, 122, 58, 4);
      g.fillStyle(color, 1).fillRoundedRect(x - 59, 240, 118, 56, 4);
      g.fillStyle(0xfff4db, 0.9).fillRect(x - 43, 258, 86, 3);
      this.label(x, 278, title, 12, "#2b2840");
    });
  }

  private drawCouncil(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x6b4c67, 1).fillRect(94, 134, 772, 32);
    g.fillStyle(0xe9d7a6, 1).fillRoundedRect(173, 178, 614, 146, 10);
    g.fillStyle(0x986a58, 1).fillRoundedRect(201, 191, 558, 39, 9);
    this.portrait(480, 221, "mayor", 1.38);
    for (let seat = 0; seat < 12; seat += 1) {
      const x = 233 + (seat % 6) * 99;
      const y = 252 + Math.floor(seat / 6) * 45;
      g.fillStyle(seat < this.votes ? 0x65a989 : 0x776b83, 1).fillRoundedRect(x - 34, y - 14, 68, 28, 6);
      g.fillStyle(seat < this.votes ? 0xd5f5df : 0xd6cbdc, 1).fillCircle(x, y, 6);
    }
    this.label(480, 338, `${this.votes} / 12 STIMMEN`, 17, CREAM);
  }

  private drawFestival(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x394667, 1).fillRect(87, 128, 786, 217);
    g.fillStyle(0x776078, 1).fillRect(87, 297, 786, 48);
    for (let x = 107; x < 870; x += 44) {
      const colors = [0xffd878, 0xf37b87, 0x80d8b2, 0xbb91dc];
      g.fillStyle(colors[Math.floor(x / 44) % colors.length] ?? GOLD, 1).fillCircle(x, 156 + Math.sin(x / 100) * 9, 4);
    }
    g.lineStyle(2, 0xd1bdd0, 0.65).lineBetween(94, 143, 865, 150);
    const stages = this.stageCount === 2 ? [230, 730] : [480];
    stages.forEach((x) => {
      g.fillStyle(0x25213e, 1).fillRoundedRect(x - 116, 181, 232, 96, 6);
      g.fillStyle(0xd76d7b, 1).fillRect(x - 103, 191, 206, 16);
      g.fillStyle(0x4b405e, 1).fillRect(x - 103, 256, 206, 17);
      this.portrait(x, 253, "npc-musician", 1.18);
    });
    g.fillStyle(0x9ed7de, 1).fillEllipse(480, 305, 121, 33);
    g.fillStyle(0xd7edf0, 1).fillRect(475, 256, 10, 45);
    const crowd = ["npc-red", "npc-green", "npc-purple", "npc-jogger", "npc-gardener", "npc-clerk"];
    for (let index = 0; index < 13; index += 1) {
      const x = 136 + index * 56;
      const y = 320 + (index % 3) * 4;
      this.portrait(x, y, crowd[index % crowd.length] ?? "npc-red", 0.64);
    }
    this.portrait(470, 333, "rudi", 0.9);
  }
}
