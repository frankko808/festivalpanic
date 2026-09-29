import Phaser from "phaser";

const DEPTH = 880;

export class GroupSummaryOverlay {
  private readonly elements: Array<
    Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible
  > = [];

  constructor(scene: Phaser.Scene) {
    const panel = scene.add
      .rectangle(480, 158, 760, 190, 0x17203a, 0.96)
      .setStrokeStyle(4, 0x8ee3ba)
      .setScrollFactor(0)
      .setDepth(DEPTH);
    const heading = scene.add
      .text(480, 88, "DIE VIER INTERESSEN", {
        fontFamily: "Courier New",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#ffe17a",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    const rows = [
      "Junge Liste     = Party",
      "Bürgerforum     = Ruhe",
      "Grün & Lokal    = Nachhaltigkeit",
      "Sparfüchse      = Geld",
    ].map((line, index) =>
      scene.add
        .text(480, 124 + index * 28, line, {
          fontFamily: "Courier New",
          fontSize: "17px",
          color: "#fff8dc",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH + 1),
    );
    this.elements.push(panel, heading, ...rows);
    this.hide();
  }

  show(): void {
    this.elements.forEach((element) => element.setVisible(true));
  }

  hide(): void {
    this.elements.forEach((element) => element.setVisible(false));
  }
}
