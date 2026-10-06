import Phaser from "phaser";

export class FestivalEndConfirmation {
  private readonly root: Phaser.GameObjects.Container;
  private readonly keys: Phaser.Input.Keyboard.Key[];
  private armed = false;
  private onConfirm?: () => void;

  constructor(scene: Phaser.Scene) {
    const shade = scene.add.rectangle(480, 270, 960, 540, 0x101426, 0.86).setInteractive();
    const panel = scene.add.rectangle(480, 270, 650, 240, 0x27213d).setStrokeStyle(4, 0xffd878);
    const title = scene.add.text(480, 195, "Festival wirklich beenden?", {
      fontFamily: "Trebuchet MS", fontSize: "27px", fontStyle: "bold", color: "#fff8dc",
    }).setOrigin(0.5);
    const text = scene.add.text(480, 247, "Danach folgen der Rückblick und die Auswertung.\nDu kannst vorher noch mit Gästen sprechen und spielen.", {
      fontFamily: "Trebuchet MS", fontSize: "18px", color: "#d9f6e9", align: "center",
    }).setOrigin(0.5);
    const cancel = scene.add.text(325, 326, "1 · Weiter feiern", {
      fontFamily: "Trebuchet MS", fontSize: "20px", color: "#27213d", backgroundColor: "#ffe696", padding: { x: 16, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const confirm = scene.add.text(645, 326, "2 · Festival beenden", {
      fontFamily: "Trebuchet MS", fontSize: "20px", color: "#fff8dc", backgroundColor: "#69557d", padding: { x: 16, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const hint = scene.add.text(480, 377, "ESC: weiter feiern", {
      fontFamily: "Trebuchet MS", fontSize: "14px", color: "#b8ecd7",
    }).setOrigin(0.5);
    this.root = scene.add.container(0, 0, [shade, panel, title, text, cancel, confirm, hint])
      .setScrollFactor(0).setDepth(6000).setVisible(false);
    cancel.on("pointerup", () => this.close(false));
    confirm.on("pointerup", () => this.close(true));
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error("Keyboard input is required");
    this.keys = [Phaser.Input.Keyboard.KeyCodes.ONE, Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.ESC, Phaser.Input.Keyboard.KeyCodes.E,
      Phaser.Input.Keyboard.KeyCodes.ENTER, Phaser.Input.Keyboard.KeyCodes.SPACE]
      .map((code) => keyboard.addKey(code));
  }

  get isOpen(): boolean { return this.root.visible; }

  show(onConfirm: () => void): void {
    this.onConfirm = onConfirm;
    this.armed = false;
    this.root.setVisible(true);
  }

  update(): void {
    if (!this.isOpen) return;
    if (this.keys.every((key) => key.isUp)) this.armed = true;
    if (!this.armed) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys[0]!) || Phaser.Input.Keyboard.JustDown(this.keys[2]!)) this.close(false);
    else if (Phaser.Input.Keyboard.JustDown(this.keys[1]!)) this.close(true);
  }

  private close(confirm: boolean): void {
    if (!this.isOpen) return;
    const callback = this.onConfirm;
    this.onConfirm = undefined;
    this.root.setVisible(false);
    if (confirm) callback?.();
  }
}
