import Phaser from "phaser";
import { gameState } from "../state/GameState";
import { formatDuration } from "../utils/formatDuration";
import { audioManager } from "../systems/AudioManager";
import { getHudObjective } from "./hudObjective";

export class TownHud {
  private readonly prompt: Phaser.GameObjects.Text;
  private readonly status: Phaser.GameObjects.Text;
  private readonly help: Phaser.GameObjects.Text;
  private readonly quest: Phaser.GameObjects.Text;
  private readonly stats: Phaser.GameObjects.Text;
  private turboUnlocked = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.status = scene.add
      .text(18, 16, "", {
        fontFamily: "Trebuchet MS",
        fontSize: "17px",
        fontStyle: "bold",
        color: "#fff8dc",
        backgroundColor: "#17203acc",
        padding: { x: 10, y: 7 },
      })
      .setScrollFactor(0)
      .setDepth(900);
    this.help = scene.add
      .text(942, 18, "", {
        fontFamily: "Trebuchet MS",
        fontSize: "12px",
        color: "#d9f6e9",
        backgroundColor: "#17203acc",
        padding: { x: 8, y: 6 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(900);
    this.setTurboUnlocked(gameState.current.flags.turboUnlocked);
    this.quest = scene.add
      .text(18, 58, "", {
        fontFamily: "Trebuchet MS",
        fontSize: "14px",
        color: "#fff8dc",
        backgroundColor: "#17203acc",
        padding: { x: 10, y: 7 },
        lineSpacing: 4,
      })
      .setScrollFactor(0)
      .setDepth(900)
      .setVisible(true);
    this.prompt = scene.add
      .text(480, 510, "", {
        fontFamily: "Trebuchet MS",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#182033",
        backgroundColor: "#ffe696",
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(900);
    this.stats = scene.add.text(942, 513, "", {
      fontFamily: "Trebuchet MS",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#fff8dc",
      backgroundColor: "#17203acc",
      padding: { x: 8, y: 5 },
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(900);
    this.refreshStats();
    scene.time.addEvent({ delay: 250, loop: true, callback: () => this.refreshStats() });
  }

  setPrompt(text: string): void {
    if (this.prompt.text !== text) this.prompt.setText(text);
    if (this.prompt.visible !== Boolean(text)) this.prompt.setVisible(Boolean(text));
  }

  setStatus(text: string): void {
    const locations: Record<string, string> = {
      TownScene: "MARKTPLATZ", ParkScene: "STADTPARK", KaiScene: "KULTURKAI",
      TownHallScene: "RATHAUS · FOYER", CouncilChamberScene: "RATSSAAL", FestivalScene: "SOMMERFEST",
    };
    const location = locations[this.scene.scene.key] ?? text.split("  •  ")[0]!;
    if (this.status.text !== location) this.status.setText(location);
  }

  setHelpVisible(visible: boolean): void {
    this.help.setVisible(visible);
  }

  setTurboUnlocked(unlocked: boolean): void {
    this.turboUnlocked = unlocked;
    this.refreshHelp();
  }

  setQuest(_text: string): void {
    this.refreshObjective();
  }

  private refreshStats(): void {
    this.refreshHelp();
    const text = `PUNKTE ${gameState.current.score}  •  ZEIT ${formatDuration(gameState.current.elapsedMs)}`;
    if (this.stats.text !== text) this.stats.setText(text);
    this.refreshObjective();
  }

  private refreshObjective(): void {
    const text = getHudObjective(gameState.current, this.scene.scene.key);
    if (this.quest.text !== text) this.quest.setText(text);
  }

  private refreshHelp(): void {
    const text = `E: Aktion · M: Journal · V: Ton ${audioManager.isMuted ? "aus" : "an"}${this.turboUnlocked ? " · Q: Turbo" : ""}`;
    if (this.help.text !== text) this.help.setText(text);
  }
}
