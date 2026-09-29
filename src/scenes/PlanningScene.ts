import Phaser from "phaser";
import { calculateSupport, type FestivalPlan } from "../data/festivalRules";
import {
  createPlanningResultDialogue,
  planningIntroduction,
} from "../data/dialogues/planning";
import { gameState } from "../state/GameState";
import { DialogBox } from "../ui/DialogBox";
import { PlanningBoard } from "../ui/PlanningBoard";
import { UnlockOverlay } from "../ui/UnlockOverlay";
import { JournalMenu } from "../ui/JournalMenu";

export class PlanningScene extends Phaser.Scene {
  private board!: PlanningBoard;
  private dialogBox!: DialogBox;
  private unlockOverlay!: UnlockOverlay;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private actionArmed = false;
  private draftSaved = false;
  private finalMode = false;
  private amendmentMode = false;
  private warningChoice?: string;
  private choiceKeys: Phaser.Input.Keyboard.Key[] = [];
  private journal!: JournalMenu;
  private menuKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super("PlanningScene");
  }

  create(): void {
    gameState.setPhase("planning");
    this.finalMode = gameState.current.quest.negotiationStarted && gameState.current.quest.negotiationTokensRemaining === 0;
    this.amendmentMode = this.finalMode && gameState.current.council.attempts === 1;
    this.board = new PlanningBoard(
      this,
      gameState.current.planning.draft,
      (plan) => gameState.updateFestivalDraft(plan),
      (plan) => this.saveDraft(plan),
      gameState.current.quest.negotiationFlags,
      this.amendmentMode ? gameState.current.planning.finalPlan : undefined,
    );
    this.dialogBox = new DialogBox(this);
    this.unlockOverlay = new UnlockOverlay(this);
    this.journal = new JournalMenu(this);
    this.configureKeys();
    if (this.finalMode) {
      this.board.setFinalMode();
      this.board.setEnabled(true);
      const text = this.amendmentMode
        ? "Keine Mehrheit. Die Bürgermeisterin erlaubt genau einen letzten Änderungsantrag: Ändere nur eine Kategorie."
        : "Drei wirksame Vereinbarungen stehen. Eine Mehrheit ist jetzt erreichbar – nutze den aktualisierten Mehrheitsblick und plane das finale Festival.";
      this.dialogBox.open({ id: this.amendmentMode ? "amendment-planning" : "final-planning", start: "rudi", nodes: { rudi: { id: "rudi", speaker: this.amendmentMode ? "Bürgermeisterin" : "Rudi", text } } }, () => this.board.setEnabled(true));
    } else {
      this.board.setEnabled(false);
      this.dialogBox.open(planningIntroduction, () => this.board.setEnabled(true));
    }
    this.cameras.main.fadeIn(220, 23, 32, 58);
  }

  update(): void {
    if (this.journal.isOpen) {
      if (Phaser.Input.Keyboard.JustDown(this.menuKey) || Phaser.Input.Keyboard.JustDown(this.escapeKey)) this.journal.close();
      else if (Phaser.Input.Keyboard.JustDown(this.upKey)) this.journal.turnPage(-1);
      else if (Phaser.Input.Keyboard.JustDown(this.downKey)) this.journal.turnPage(1);
      else {
        const tab = this.choiceKeys.slice(0, 3).findIndex((key) => Phaser.Input.Keyboard.JustDown(key));
        if (tab >= 0) this.journal.select(tab);
      }
      return;
    }
    if (!this.dialogBox.isOpen && !this.unlockOverlay.isOpen && Phaser.Input.Keyboard.JustDown(this.menuKey)) {
      this.journal.open("insights");
      return;
    }
    if (this.dialogBox.isOpen) {
      if (this.dialogBox.hasChoices) {
        const index = this.choiceKeys.findIndex((key) => Phaser.Input.Keyboard.JustDown(key));
        if (index >= 0) this.dialogBox.choose(index);
        return;
      }
      if (this.consumePrimaryAction()) {
        this.dialogBox.advance();
      }
      return;
    }
    if (this.unlockOverlay.isOpen) {
      if (this.consumePrimaryAction()) {
        this.unlockOverlay.close();
      }
      return;
    }
    if (!this.board.isEnabled) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.upKey)) {
      this.board.moveSelection(-1);
    } else if (Phaser.Input.Keyboard.JustDown(this.downKey)) {
      this.board.moveSelection(1);
    } else if (Phaser.Input.Keyboard.JustDown(this.leftKey)) {
      this.board.changeSelectedOption(-1);
    } else if (Phaser.Input.Keyboard.JustDown(this.rightKey)) {
      this.board.changeSelectedOption(1);
    } else if (this.consumePrimaryAction()) {
      this.board.save();
    }
  }

  private configureKeys(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is required for Festival Panic.");
    }
    this.upKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.leftKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.interactKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.choiceKeys = [
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
    ];
    this.menuKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.actionArmed = [this.interactKey, this.spaceKey, this.enterKey].every((key) => key.isUp);
  }

  private consumePrimaryAction(): boolean {
    const keys = [this.interactKey, this.spaceKey, this.enterKey];
    if (keys.every((key) => key.isUp)) {
      this.actionArmed = true;
      return false;
    }
    if (!this.actionArmed) {
      return false;
    }
    if (keys.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      this.actionArmed = false;
      return true;
    }
    return false;
  }

  private saveDraft(plan: FestivalPlan): void {
    if (this.finalMode) {
      this.saveFinalPlan(plan);
      return;
    }
    if (this.draftSaved || !gameState.saveFirstFestivalDraft(plan)) {
      return;
    }
    this.draftSaved = true;
    this.board.setEnabled(false);
    const { votes } = calculateSupport(plan);
    this.dialogBox.open(createPlanningResultDialogue(votes), () => this.startNegotiationQuest());
  }

  private startNegotiationQuest(): void {
    gameState.startNegotiationQuest();
    this.unlockOverlay.show(
      {
        eyebrow: "NEUE QUEST",
        title: "VERHANDLE!",
        description: "Du darfst drei politische Gespräche führen.",
        footer: "3 GESPRÄCHSMARKEN VERFÜGBAR",
      },
      () => this.scene.start("CouncilChamberScene"),
    );
  }

  private saveFinalPlan(plan: FestivalPlan): void {
    const support = calculateSupport(plan, gameState.current.quest.negotiationFlags);
    if (support.hasMajority) {
      this.submitFinalPlan(plan);
      return;
    }
    this.board.setEnabled(false);
    this.warningChoice = undefined;
    this.dialogBox.open({
      id: "no-majority-warning",
      start: "warning",
      nodes: {
        warning: {
          id: "warning",
          speaker: "WARNUNG",
          text: "Dieser Entwurf hat aktuell keine Mehrheit.",
          choices: [
            { id: "back", label: "Zurück zum Plan", next: "back" },
            { id: "vote", label: "Trotzdem abstimmen", next: "vote" },
          ],
        },
        back: { id: "back", speaker: "Rudi", text: "Vernünftig. Die Mathematik läuft nicht weg." },
        vote: { id: "vote", speaker: "Rudi", text: "Dann stimmen wir darüber ab. Die Einwände der anderen verschwinden dadurch allerdings nicht." },
      },
    }, () => {
      if (this.warningChoice === "vote") this.submitFinalPlan(plan);
      else this.board.setEnabled(true);
    }, (choiceId) => { this.warningChoice = choiceId; });
  }

  private submitFinalPlan(plan: FestivalPlan): void {
    if (!gameState.saveFinalFestivalPlan(plan)) return;
    this.scene.start("CouncilChamberScene");
  }
}
