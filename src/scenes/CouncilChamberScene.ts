import Phaser from "phaser";
import { Player } from "../characters/Player";
import { groupSummary } from "../data/dialogues/groupSummary";
import { createRudiCompanionDialogue } from "../data/dialogues/rudiCompanion";
import type { DialogueScript } from "../dialogue/types";
import { gameState } from "../state/GameState";
import { InteractionSystem } from "../systems/InteractionSystem";
import { DialogBox } from "../ui/DialogBox";
import { GroupSummaryOverlay } from "../ui/GroupSummaryOverlay";
import { JournalMenu } from "../ui/JournalMenu";
import { TownHud } from "../ui/TownHud";
import { UnlockOverlay } from "../ui/UnlockOverlay";
import { createWorldDepthLayer } from "../utils/createWorldDepthLayer";
import { setDepthIfChanged } from "../utils/setDepthIfChanged";

const talk = (id: string, speaker: string, text: string): DialogueScript => ({
  id,
  start: "line",
  nodes: { line: { id: "line", speaker, text } },
});

export class CouncilChamberScene extends Phaser.Scene {
  private player!: Player;
  private rudi?: Phaser.GameObjects.Image;
  private hud!: TownHud;
  private dialog!: DialogBox;
  private summaryOverlay!: GroupSummaryOverlay;
  private unlock!: UnlockOverlay;
  private journal!: JournalMenu;
  private interactions!: InteractionSystem;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private menuKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private choiceKeys: Phaser.Input.Keyboard.Key[] = [];
  private actionArmed = true;
  private choiceArmed = true;
  private summaryChoiceId?: string;

  constructor() { super("CouncilChamberScene"); }

  create(data: { spawn?: { x: number; y: number } } = {}): void {
    this.physics.world.setBounds(0, 0, 960, 540);
    this.drawRoom();
    this.player = new Player(this, data.spawn?.x ?? 480, data.spawn?.y ?? 468, "player");
    this.createRoomColliders();
    this.rudi = gameState.current.flags.rudiFirstMeetingComplete
      ? this.add.image(430, 470, "rudi").setOrigin(0.5, 0.8).setDepth(570)
      : undefined;
    this.interactions = new InteractionSystem();
    this.registerTable();
    this.registerExit();
    this.registerRudi();
    createWorldDepthLayer(this);
    this.hud = new TownHud(this);
    this.hud.setStatus(this.roomStatus());
    this.dialog = new DialogBox(this);
    this.summaryOverlay = new GroupSummaryOverlay(this);
    this.unlock = new UnlockOverlay(this);
    this.journal = new JournalMenu(this);
    this.configureKeys();
    this.cameras.main.fadeIn(180, 59, 49, 82);
  }

  update(): void {
    this.updateRudi();
    if (this.journal.isOpen) {
      this.player.updateMovement(false);
      this.hud.setPrompt("");
      if (Phaser.Input.Keyboard.JustDown(this.menuKey) || Phaser.Input.Keyboard.JustDown(this.escapeKey)) this.journal.close();
      else if (Phaser.Input.Keyboard.JustDown(this.upKey)) this.journal.turnPage(-1);
      else if (Phaser.Input.Keyboard.JustDown(this.downKey)) this.journal.turnPage(1);
      else {
        const tab = this.choiceKeys.slice(0, 3).findIndex((key) => Phaser.Input.Keyboard.JustDown(key));
        if (tab >= 0) this.journal.select(tab);
      }
      return;
    }
    if (!this.dialog.isOpen && !this.unlock.isOpen && Phaser.Input.Keyboard.JustDown(this.menuKey)) {
      this.player.updateMovement(false);
      this.journal.open("insights");
      return;
    }
    if (this.unlock.isOpen) {
      this.player.updateMovement(false);
      this.hud.setPrompt("");
      if (this.consumeAction()) this.unlock.close();
      return;
    }
    if (this.dialog.isOpen) {
      this.player.updateMovement(false);
      this.hud.setPrompt("");
      if (this.dialog.hasChoices) {
        if (this.choiceKeys.every((key) => key.isUp)) this.choiceArmed = true;
        if (this.choiceArmed) {
          const choice = this.choiceKeys.findIndex((key) => Phaser.Input.Keyboard.JustDown(key));
          if (choice >= 0) {
            this.choiceArmed = false;
            this.dialog.choose(choice);
          }
        }
      } else if (this.consumeAction()) this.dialog.advance();
      return;
    }
    this.player.updateMovement(true);
    this.hud.setPrompt(this.interactions.update(this.player));
    if (this.consumeAction()) this.interactions.interact();
  }

  private drawRoom(): void {
    const g = this.add.graphics();
    g.fillStyle(0xe9d8ae, 1); g.fillRect(0, 0, 960, 540);
    g.fillStyle(0x6d4561, 1); g.fillRect(0, 0, 960, 92);
    g.fillStyle(0x8d5d78, 1); g.fillRect(0, 82, 960, 10);
    for (let y = 92, row = 0; y < 540; y += 48, row += 1) {
      for (let x = row % 2 === 0 ? 0 : 24; x < 960; x += 48) {
        g.fillStyle((x / 24 + row) % 4 === 0 ? 0xf0e1bb : 0xe3cfa4, 0.7);
        g.fillRect(x + 2, y + 2, 44, 44);
      }
    }
    g.lineStyle(2, 0xc9ae7c, 0.75);
    for (let y = 92; y < 540; y += 48) g.lineBetween(0, y, 960, y);

    this.add.text(480, 43, "SITZUNGS- UND ABSTIMMUNGSSAAL", { fontFamily: "Courier New", fontSize: "27px", fontStyle: "bold", color: "#fff8dc" }).setOrigin(0.5);
    this.add.text(480, 108, "Hier werden Pläne geschärft und Hände gehoben.", { fontFamily: "Courier New", fontSize: "14px", color: "#49364c", backgroundColor: "#fff3c7", padding: { x: 8, y: 4 } }).setOrigin(0.5);

    g.fillStyle(0x3b3152, 0.2); g.fillRoundedRect(164, 142, 632, 105, 15);
    g.fillStyle(0x8b5c46, 1); g.fillRoundedRect(178, 132, 604, 96, 14);
    g.fillStyle(0xc99b63, 1); g.fillRoundedRect(197, 148, 566, 55, 10);
    this.add.text(480, 175, "STADTRAT", { fontFamily: "Courier New", fontSize: "16px", fontStyle: "bold", color: "#49364c" }).setOrigin(0.5);
    for (let index = 0; index < 12; index += 1) {
      const x = 205 + (index % 6) * 110;
      const y = 260 + Math.floor(index / 6) * 76;
      g.fillStyle(0x3b3152, 0.16); g.fillEllipse(x, y + 42, 70, 13);
      g.fillStyle(index % 4 === 0 ? 0x5b936d : index % 4 === 1 ? 0x4d5b86 : index % 4 === 2 ? 0xa15b66 : 0x88705a, 1);
      g.fillRoundedRect(x - 28, y, 56, 42, 7);
      g.fillStyle(0xd9aa69, 1); g.fillRect(x - 34, y - 13, 68, 18);
      g.fillStyle(0xfff2c0, 1); g.fillRect(x - 15, y - 8, 30, 4);
    }

    g.fillStyle(0x49364c, 0.2); g.fillEllipse(480, 434, 250, 28);
    g.fillStyle(0x765043, 1); g.fillRoundedRect(365, 366, 230, 74, 9);
    g.fillStyle(0xd19a5d, 1); g.fillRoundedRect(380, 375, 200, 32, 7);
    g.fillStyle(0xffefbd, 1); g.fillRect(422, 381, 116, 19);
    this.add.text(480, 391, "FESTIVALPLAN", { fontFamily: "Courier New", fontSize: "13px", fontStyle: "bold", color: "#49364c" }).setOrigin(0.5).setDepth(2);

    g.fillStyle(0x5b405e, 1); g.fillRect(421, 485, 118, 55);
    g.fillStyle(0x805444, 1); g.fillRect(430, 492, 45, 48); g.fillRect(485, 492, 45, 48);
    g.fillStyle(0xf4c95d, 1); g.fillCircle(467, 518, 3); g.fillCircle(493, 518, 3);
    this.add.text(480, 476, "TREPPENHAUS", { fontFamily: "Courier New", fontSize: "10px", fontStyle: "bold", color: "#fff3c3", backgroundColor: "#49364c", padding: { x: 5, y: 2 } }).setOrigin(0.5);
  }

  private registerTable(): void {
    const table = this.add.zone(480, 413, 235, 82);
    this.interactions.register({ id: "festival-planning-table", displayName: "den Festivalplan", object: table, range: 98, enabled: () => true, interact: () => this.usePlanningTable(), prompt: () => this.tablePrompt(), priority: 5 });
  }

  private createRoomColliders(): void {
    this.addCollider(480, 180, 610, 98);
    for (let index = 0; index < 12; index += 1) {
      const x = 205 + (index % 6) * 110;
      const y = 260 + Math.floor(index / 6) * 76;
      this.addCollider(x, y + 17, 56, 46);
    }
    this.addCollider(480, 403, 230, 74);
  }

  private addCollider(x: number, y: number, width: number, height: number): void {
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    this.physics.add.collider(this.player, zone);
  }

  private usePlanningTable(): void {
    const state = gameState.current;
    if (state.quest.argumentCards.length < state.quest.groupsTotal) {
      this.dialog.open(talk("table-locked", "Rudi", `Uns fehlen noch ${state.quest.groupsTotal - state.quest.argumentCards.length} Argumentkarten. Ein leerer Planungstisch macht leider noch keinen Plan.`), () => undefined);
      return;
    }
    if (!state.flags.groupSummaryComplete) {
      this.summaryChoiceId = undefined;
      this.summaryOverlay.show();
      this.dialog.open(groupSummary, () => this.finishGroupSummary(), (choiceId) => { this.summaryChoiceId = choiceId; });
      return;
    }
    if (!state.flags.firstDraftSaved) {
      this.scene.start("PlanningScene");
      return;
    }
    if (state.quest.negotiationStarted && state.quest.negotiationTokensRemaining > 0) {
      this.dialog.open(talk("table-negotiations", "Rudi", `Noch ${state.quest.negotiationTokensRemaining} Gesprächsmarken. Erst die Vereinbarungen, dann der finale Plan – sonst planen wir zweimal dieselbe Sackgasse.`), () => undefined);
      return;
    }
    if (state.quest.negotiationStarted && !state.planning.finalPlan) {
      this.scene.start("PlanningScene");
      return;
    }
    if (state.phase === "council" && state.planning.finalPlan) {
      this.scene.start("CouncilVoteScene");
      return;
    }
    this.dialog.open(talk("table-idle", "Rudi", "Der Planungstisch ist bereit. Wir gerade noch nicht – aber das ist immerhin fair verteilt."), () => undefined);
  }

  private finishGroupSummary(): void {
    gameState.completeGroupSummary(this.summaryChoiceId);
    this.summaryOverlay.hide();
    this.unlock.show({ eyebrow: "FÄHIGKEIT FREIGESCHALTET", title: "MEHRHEITSBLICK", description: "Zeigt bei jedem Festivalentwurf, welche Gruppen zustimmen würden.", footer: "PLANUNGSTISCH FREIGESCHALTET" }, () => this.scene.start("PlanningScene"));
  }

  private registerExit(): void {
    const exit = this.add.zone(480, 516, 130, 50);
    this.interactions.register({ id: "council-exit", displayName: "das Treppenhaus", object: exit, range: 76, enabled: () => true, interact: () => this.scene.start("TownHallScene", { spawn: { x: 735, y: 365 } }), prompt: () => "Ins Erdgeschoss zurück", priority: 5 });
  }

  private registerRudi(): void {
    if (!this.rudi) return;
    this.interactions.register({ id: "rudi-council", displayName: "Rudi", object: this.rudi, range: 78, enabled: () => Boolean(this.rudi?.visible), interact: () => this.dialog.open(createRudiCompanionDialogue(gameState.current, gameState.recordRudiConversation(), "hall"), () => undefined), prompt: () => "Mit Rudi sprechen", priority: -10 });
  }

  private roomStatus(): string {
    const state = gameState.current;
    if (!state.flags.groupSummaryComplete) return "SITZUNGSSAAL  •  Argumente am Planungstisch auswerten";
    if (!state.flags.firstDraftSaved) return "SITZUNGSSAAL  •  Ersten Festivalplan erstellen";
    if (state.quest.negotiationTokensRemaining > 0) return `SITZUNGSSAAL  •  Noch ${state.quest.negotiationTokensRemaining}/3 Verhandlungen`;
    if (!state.planning.finalPlan) return "SITZUNGSSAAL  •  Finalen Festivalplan erstellen";
    return "ABSTIMMUNGSSAAL  •  Plan zur Abstimmung stellen";
  }

  private tablePrompt(): string {
    const state = gameState.current;
    if (!state.flags.groupSummaryComplete) return "Argumentkarten auf den Tisch legen";
    if (!state.flags.firstDraftSaved) return "Ersten Festivalplan öffnen";
    if (state.quest.negotiationTokensRemaining > 0) return "Planungstisch prüfen";
    if (!state.planning.finalPlan) return "Finalen Festivalplan öffnen";
    return "Abstimmung beginnen";
  }

  private updateRudi(): void {
    if (!this.rudi) return;
    const targetX = this.player.x - this.player.facingDirection.x * 48 + this.player.facingDirection.y * 20;
    const targetY = this.player.y - this.player.facingDirection.y * 48 - this.player.facingDirection.x * 12;
    this.rudi.x = Phaser.Math.Linear(this.rudi.x, targetX, 0.08);
    this.rudi.y = Phaser.Math.Linear(this.rudi.y, targetY, 0.08);
    this.rudi.setFlipX(targetX > this.rudi.x);
    setDepthIfChanged(this.rudi, 100 + Math.round(this.rudi.y));
  }

  private configureKeys(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error("Keyboard input is required");
    this.interactKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.menuKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.upKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.choiceKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR)];
  }

  private consumeAction(): boolean {
    const keys = [this.interactKey, this.spaceKey, this.enterKey];
    if (keys.every((key) => key.isUp)) this.actionArmed = true;
    if (!this.actionArmed) return false;
    if (keys.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      this.actionArmed = false;
      return true;
    }
    return false;
  }
}
