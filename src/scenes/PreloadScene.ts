import Phaser from "phaser";
import { createPlaceholderTextures } from "../utils/createPlaceholderTextures";
import { DEFAULT_FESTIVAL_PLAN, type StageSize } from "../data/festivalRules";
import { gameState } from "../state/GameState";
import { prepareTownGround } from "../utils/prepareTownGround";
import { prepareParkGround } from "../utils/prepareParkGround";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    this.load.image("festival-town-title", "assets/festival-town-title-rudi-v4.png");
    this.load.image("festival-ending-night", "assets/festival-ending-night-v1.png");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#17203a");
    const title = this.add
      .text(480, 225, "Festival wird aufgebaut …", {
        fontFamily: "Courier New",
        fontSize: "24px",
        color: "#fff8dc",
      })
      .setOrigin(0.5);
    const track = this.add.rectangle(480, 282, 420, 24, 0x302b49).setStrokeStyle(3, 0xffdf78);
    const bar = this.add.rectangle(274, 282, 8, 14, 0x67d5a2).setOrigin(0, 0.5);

    createPlaceholderTextures(this);
    prepareTownGround(this);
    prepareParkGround(this);
    this.tweens.add({
      targets: bar,
      width: 412,
      duration: 420,
      ease: "Sine.Out",
      onComplete: () => {
        title.setText("Rudi prüft die Verfassung …");
        this.time.delayedCall(260, () => {
          const params = new URLSearchParams(window.location.search);
          const checkpoint = params.get("checkpoint");
          if (import.meta.env.DEV && checkpoint === "after-negotiations") {
            gameState.loadAfterNegotiationsCheckpoint();
            this.scene.start("TownHallScene", { spawn: { x: 735, y: 380 } });
            return;
          }
          if (import.meta.env.DEV && checkpoint) {
            const stage: StageSize = checkpoint.includes("newcomer")
              ? "newcomer"
              : checkpoint.includes("small")
                ? "small"
                : "large";
            gameState.loadFestivalCheckpoint(stage);
            if (checkpoint === "pommes-rush") {
              this.scene.start("FestivalGameScene", { kind: "fries", returnScene: "FestivalScene", spawn: { x: 500, y: 790 } });
            } else if (checkpoint === "dosenwerfen") {
              this.scene.start("FestivalGameScene", { kind: "cans", returnScene: "FestivalScene", spawn: { x: 1100, y: 790 } });
            } else if (checkpoint === "finde-rudi") {
              gameState.startRudiSearch();
              this.scene.start("FestivalGameScene", { kind: "find-rudi", returnScene: "FestivalScene", spawn: { x: 800, y: 760 } });
            } else {
              this.scene.start("FestivalScene");
            }
            return;
          }
          if (import.meta.env.DEV && params.get("scene") === "festival") {
            const requestedStage = params.get("stage");
            const stage: StageSize = requestedStage === "large" || requestedStage === "newcomer"
              ? requestedStage
              : "small";
            gameState.updateFestivalDraft({ ...DEFAULT_FESTIVAL_PLAN, stage });
            this.scene.start("FestivalScene");
            return;
          }
          this.scene.start("TitleScene");
        });
      },
    });
    track.setDepth(1);
    bar.setDepth(2);
  }
}
