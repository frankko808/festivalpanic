import Phaser from "phaser";

const DEPTH = 1120;

export interface UnlockMessage {
  eyebrow: string;
  title: string;
  description: string;
  footer: string;
}

export class UnlockOverlay {
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly eyebrow: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly description: Phaser.GameObjects.Text;
  private readonly footer: Phaser.GameObjects.Text;
  private onClose?: () => void;

  constructor(scene: Phaser.Scene) {
    this.backdrop = scene.add
      .rectangle(480, 270, 960, 540, 0x111426, 0.72)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setInteractive();
    this.panel = scene.add
      .rectangle(480, 270, 660, 250, 0x20243e, 0.99)
      .setStrokeStyle(6, 0xffdf78)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setInteractive({ useHandCursor: true });
    this.eyebrow = scene.add
      .text(480, 183, "", {
        fontFamily: "Courier New",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#8ee3ba",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);
    this.title = scene.add
      .text(480, 220, "", {
        fontFamily: "Courier New",
        fontSize: "29px",
        fontStyle: "bold",
        color: "#ffe17a",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);
    this.description = scene.add
      .text(480, 275, "", {
        fontFamily: "Courier New",
        fontSize: "18px",
        color: "#fff8dc",
        align: "center",
        lineSpacing: 5,
        wordWrap: { width: 570 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);
    this.footer = scene.add
      .text(480, 360, "", {
        fontFamily: "Courier New",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#a9f4d0",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);
    this.panel.on("pointerup", () => this.close());
    this.backdrop.on("pointerup", () => this.close());
    this.setVisible(false);
  }

  get isOpen(): boolean {
    return this.panel.visible;
  }

  show(message: UnlockMessage, onClose: () => void): void {
    this.onClose = onClose;
    this.eyebrow.setText(message.eyebrow);
    this.title.setText(message.title);
    this.description.setText(message.description);
    this.footer.setText(`${message.footer}  •  E / LEER / KLICK`);
    this.setVisible(true);
  }

  close(): void {
    if (!this.isOpen) {
      return;
    }
    const callback = this.onClose;
    this.onClose = undefined;
    this.setVisible(false);
    callback?.();
  }

  private setVisible(visible: boolean): void {
    this.backdrop.setVisible(visible);
    this.panel.setVisible(visible);
    this.eyebrow.setVisible(visible);
    this.title.setVisible(visible);
    this.description.setVisible(visible);
    this.footer.setVisible(visible);
  }
}
