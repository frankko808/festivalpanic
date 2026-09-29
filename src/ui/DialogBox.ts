import Phaser from "phaser";
import { DialogueController } from "../dialogue/DialogueController";
import type { DialogueScript } from "../dialogue/types";
import { resolveDialoguePortrait } from "./dialoguePortraits";

// Southern buildings can reach a world depth slightly above 1000. Dialogue is
// screen UI and must always remain in front of roofs, labels and particles.
const DEPTH = 5000;

export class DialogBox {
  private readonly shadow: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly innerFrame: Phaser.GameObjects.Rectangle;
  private readonly accent: Phaser.GameObjects.Rectangle;
  private readonly speakerText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly portraitShadow: Phaser.GameObjects.Rectangle;
  private readonly portraitFrame: Phaser.GameObjects.Rectangle;
  private readonly portraitBackdrop: Phaser.GameObjects.Rectangle;
  private readonly portraitImage: Phaser.GameObjects.Image;
  private readonly portraitCorner: Phaser.GameObjects.Text;
  private readonly choiceTexts: Phaser.GameObjects.Text[];
  private controller?: DialogueController;
  private onComplete?: () => void;
  private onChoice?: (choiceId: string) => void;

  constructor(scene: Phaser.Scene) {
    this.shadow = scene.add
      .rectangle(486, 418, 900, 244, 0x0b0d19, 0.42)
      .setScrollFactor(0)
      .setDepth(DEPTH - 1);
    this.panel = scene.add
      .rectangle(480, 410, 900, 244, 0x27213d, 0.98)
      .setStrokeStyle(5, 0xffd878)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setInteractive({ useHandCursor: true });
    this.innerFrame = scene.add
      .rectangle(480, 410, 880, 224, 0x000000, 0)
      .setStrokeStyle(2, 0x8f82ac, 0.72)
      .setScrollFactor(0)
      .setDepth(DEPTH + 0.2);
    this.accent = scene.add
      .rectangle(480, 294, 880, 5, 0xd85f73, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH + 0.4);
    this.speakerText = scene.add
      .text(58, 306, "", {
        fontFamily: "Courier New",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#fff8dc",
        backgroundColor: "#d85f73",
        padding: { x: 9, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    this.portraitShadow = scene.add
      .rectangle(850, 350, 104, 100, 0x0b0d19, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 0.8);
    this.portraitFrame = scene.add
      .rectangle(844, 344, 104, 100, 0xffd878, 1)
      .setStrokeStyle(3, 0x49364c, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    this.portraitBackdrop = scene.add
      .rectangle(844, 344, 88, 84, 0xc7d2dc, 1)
      .setStrokeStyle(2, 0xfff4c5, 0.82)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1.1);
    this.portraitImage = scene.add
      .image(844, 349, "npc-clerk")
      .setOrigin(0.5, 0.58)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1.3);
    this.portraitCorner = scene.add
      .text(802, 302, "✦", {
        fontFamily: "Courier New",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#49364c",
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 1.5);
    this.bodyText = scene.add
      .text(58, 350, "", {
        fontFamily: "Trebuchet MS",
        fontSize: "18px",
        color: "#fff9e8",
        lineSpacing: 6,
        wordWrap: { width: 716, useAdvancedWrap: true },
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    this.hintText = scene.add
      .text(890, 515, "", {
        fontFamily: "Courier New",
        fontSize: "14px",
        color: "#a9f4d0",
      })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    this.choiceTexts = [0, 1, 2, 3].map((index) => {
      const text = scene.add
        .text(78, 400 + index * 28, "", {
          fontFamily: "Courier New",
          fontSize: "15px",
          color: "#ffffff",
          backgroundColor: "#4a416b",
          padding: { x: 8, y: 4 },
          wordWrap: { width: 790, useAdvancedWrap: true },
        })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2)
        .setInteractive({ useHandCursor: true });
      text.on("pointerover", () => text.setColor("#ffe37c"));
      text.on("pointerout", () => text.setColor("#ffffff"));
      text.on("pointerup", () => this.choose(index));
      return text;
    });
    this.panel.on("pointerup", () => this.advance());
    this.setVisible(false);
  }

  get isOpen(): boolean {
    return Boolean(this.controller);
  }

  get hasChoices(): boolean {
    return Boolean(this.controller?.current.choices?.length);
  }

  open(
    script: DialogueScript,
    onComplete: () => void,
    onChoice?: (choiceId: string) => void,
  ): void {
    this.controller = new DialogueController(script);
    this.onComplete = onComplete;
    this.onChoice = onChoice;
    this.setVisible(true);
    this.render();
  }

  advance(): void {
    if (!this.controller) {
      return;
    }
    const result = this.controller.advance();
    if (result === "complete") {
      this.close();
      return;
    }
    this.render();
  }

  choose(index: number): void {
    if (!this.controller) {
      return;
    }
    const choiceId = this.controller.current.choices?.[index]?.id;
    const result = this.controller.choose(index);
    if (result === "advanced") {
      if (choiceId) {
        this.onChoice?.(choiceId);
      }
      this.render();
    }
  }

  private close(): void {
    const callback = this.onComplete;
    this.controller = undefined;
    this.onComplete = undefined;
    this.onChoice = undefined;
    this.setVisible(false);
    callback?.();
  }

  private render(): void {
    if (!this.controller) {
      return;
    }
    const node = this.controller.current;
    this.speakerText.setText(node.speaker);
    this.renderPortrait(node.speaker);
    this.bodyText.setText(node.text);
    const choices = node.choices ?? [];
    this.bodyText.setY(350);
    let choiceY = Math.max(400, this.bodyText.y + this.bodyText.height + 10);
    this.choiceTexts.forEach((choiceText, index) => {
      const choice = choices[index];
      choiceText.setVisible(Boolean(choice));
      if (choice) {
        choiceText.setText(`${index + 1}  ${choice.label}`).setY(choiceY);
        choiceY += choiceText.height + 5;
      }
    });
    this.hintText.setPosition(choices.length ? 770 : 890, choices.length ? 318 : 515);
    this.hintText.setText(choices.length ? `1-${choices.length} wählen` : "E / LEER / ENTER  ▶");
  }

  private setVisible(visible: boolean): void {
    this.shadow.setVisible(visible);
    this.panel.setVisible(visible);
    this.innerFrame.setVisible(visible);
    this.accent.setVisible(visible);
    this.speakerText.setVisible(visible);
    this.portraitShadow.setVisible(visible);
    this.portraitFrame.setVisible(visible);
    this.portraitBackdrop.setVisible(visible);
    this.portraitImage.setVisible(visible);
    this.portraitCorner.setVisible(visible);
    this.bodyText.setVisible(visible);
    this.hintText.setVisible(visible);
    this.choiceTexts.forEach((choice) => choice.setVisible(visible));
  }

  private renderPortrait(speaker: string): void {
    const portrait = resolveDialoguePortrait(speaker);
    const texture = this.portraitImage.scene.textures.exists(portrait.texture)
      ? portrait.texture
      : "npc-clerk";
    this.portraitBackdrop.setFillStyle(portrait.background, 1);
    this.portraitImage.setTexture(texture).setFlipX(false).setAlpha(1);
    const frame = this.portraitImage.frame;
    const scale = Math.min(1.9, 66 / Math.max(frame.realWidth, frame.realHeight));
    this.portraitImage.setScale(scale);
  }
}
