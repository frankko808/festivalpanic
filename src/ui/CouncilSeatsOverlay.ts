import Phaser from "phaser";
import { COUNCIL_MAJORITY, GROUPS } from "../data/festivalRules";

export class CouncilSeatsOverlay {
  private readonly container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    const seats = GROUPS.map((group) => `${group.name} ${group.seats}`).join("  •  ");
    const background = scene.add
      .rectangle(0, 0, 790, 104, 0x24203b, 0.97)
      .setStrokeStyle(4, 0xffdf78);
    const title = scene.add
      .text(0, -31, "DER STADTRAT", {
        fontFamily: "Courier New",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#ffdf78",
      })
      .setOrigin(0.5);
    const groups = scene.add
      .text(0, 0, seats, {
        fontFamily: "Courier New",
        fontSize: "15px",
        color: "#fff8dc",
      })
      .setOrigin(0.5);
    const majority = scene.add
      .text(0, 28, `MEHRHEIT = ${COUNCIL_MAJORITY} VON 12 STIMMEN`, {
        fontFamily: "Courier New",
        fontSize: "17px",
        fontStyle: "bold",
        color: "#8ff0c1",
      })
      .setOrigin(0.5);

    this.container = scene.add
      .container(480, 110, [background, title, groups, majority])
      .setScrollFactor(0)
      .setDepth(950)
      .setVisible(false);
  }

  show(): void {
    this.container.setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
  }
}
