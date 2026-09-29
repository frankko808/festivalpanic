import Phaser from "phaser";
import { calculatePlanCost, calculateSupport, GROUPS } from "../data/festivalRules";
import type { DialogueScript } from "../dialogue/types";
import { gameState } from "../state/GameState";
import { DialogBox } from "../ui/DialogBox";
import { UnlockOverlay } from "../ui/UnlockOverlay";

const RESPONSE = {
  "young-list": { yes: "Ja.", no: "So macht das für uns keinen Sinn. Nein." },
  "citizens-forum": { yes: "Damit können wir leben. Ja.", no: "Den Anwohnern können wir das so nicht zumuten. Nein." },
  "green-local": { yes: "Das ist ein tragfähiger Kompromiss. Ja.", no: "So reicht uns das nicht. Nein." },
} as const;

export class CouncilVoteScene extends Phaser.Scene {
  private dialog!: DialogBox;
  private overlay!: UnlockOverlay;
  private keys: Phaser.Input.Keyboard.Key[] = [];
  private armed = true;

  constructor() { super("CouncilVoteScene"); }

  create(): void {
    gameState.setPhase("council");
    this.drawChamber();
    this.dialog = new DialogBox(this);
    this.overlay = new UnlockOverlay(this);
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error("Keyboard input is required");
    this.keys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)];
    this.dialog.open(this.createVoteDialogue(), () => this.finishVote());
    this.cameras.main.fadeIn(220, 23, 32, 58);
  }

  update(): void {
    if (this.overlay.isOpen) {
      if (this.consume()) this.overlay.close();
      return;
    }
    if (this.dialog.isOpen && this.consume()) this.dialog.advance();
  }

  private createVoteDialogue(): DialogueScript {
    const plan = gameState.current.planning.finalPlan ?? gameState.current.planning.draft;
    const flags = gameState.current.quest.negotiationFlags;
    const support = calculateSupport(plan, flags);
    const nodes: DialogueScript["nodes"] = {
      intro: { id: "intro", speaker: "Bürgermeisterin", text: "Wir stimmen über das neue Konzept für das Sommerfest ab.", next: "plan" },
      plan: { id: "plan", speaker: "Festivalplan", text: `${plan.endTime} Uhr · ${plan.stage === "large" ? "Große Bühne" : plan.stage === "newcomer" ? "Newcomer-Bühne" : "Kleine Bühne"} · ${plan.security === "extra-team" ? "Sicherheitsteam" : "Standard-Sicherheit"} · ${plan.cups === "deposit" ? "Pfand" : "Einweg"} · ${plan.localShare} % lokal\nKosten: ${new Intl.NumberFormat("de-DE").format(calculatePlanCost(plan, flags))} €`, next: "vote-0" },
    };
    GROUPS.forEach((group, index) => {
      const yes = support.supporters.includes(group.id);
      const next = index === GROUPS.length - 1 ? "total" : `vote-${index + 1}`;
      const text = group.id === "budget-hawks"
        ? yes ? `${new Intl.NumberFormat("de-DE").format(calculatePlanCost(plan, flags))} Euro. Ja.` : "Die Kosten liegen über unserer Grenze. Nein."
        : RESPONSE[group.id][yes ? "yes" : "no"];
      nodes[`vote-${index}`] = { id: `vote-${index}`, speaker: group.name, text, next };
    });
    nodes.total = { id: "total", speaker: "Abstimmung", text: `${support.votes} von 12 Stimmen. ${support.hasMajority ? "Die Mehrheit ist erreicht." : "Keine Mehrheit."}` };
    return { id: `council-vote-${gameState.current.council.attempts + 1}`, start: "intro", nodes };
  }

  private finishVote(): void {
    const plan = gameState.current.planning.finalPlan ?? gameState.current.planning.draft;
    const support = calculateSupport(plan, gameState.current.quest.negotiationFlags);
    const outcome = gameState.recordCouncilVote(support.votes);
    if (outcome === "amendment") {
      this.overlay.show({ eyebrow: "KEINE MEHRHEIT", title: `${support.votes} / 12 STIMMEN`, description: "Genau ein letzter Änderungsantrag ist erlaubt. Eine Kategorie darf geändert werden.", footer: "ZURÜCK ZUM PLANUNGSPULT" }, () => this.scene.start("PlanningScene"));
      return;
    }
    if (outcome === "rescued") {
      this.overlay.show({ eyebrow: "DEMOKRATIE-RETTUNGSRING", title: "MEHRHEIT GEFUNDEN", description: "Der kleinste mehrheitsfähige Änderungsplan wurde übernommen.", footer: "-1.000 PUNKTE  •  AUTOMATISCH ANGENOMMEN" }, () => this.scene.start("FestivalScene"));
      return;
    }
    const bonus = support.votes === 12 ? "+2.000 PUNKTE" : gameState.current.council.attempts === 1 ? "+1.500 PUNKTE" : "+750 PUNKTE";
    const comment = support.votes === 12 ? "Alle vier Gruppen tragen den Plan mit. Das haben wir uns erarbeitet." : support.votes >= 9 ? "Eine deutliche Mehrheit. Jetzt können wir mit dem Aufbau beginnen." : "Die Mehrheit steht. Nicht jede Gruppe ist zufrieden, aber der Beschluss trägt.";
    this.overlay.show({ eyebrow: "BESCHLOSSEN!", title: `${support.votes} / 12 STIMMEN`, description: `Rudi: ${comment}`, footer: bonus }, () => this.scene.start("FestivalScene"));
  }

  private drawChamber(): void {
    const g = this.add.graphics();
    g.fillStyle(0xead8a4, 1); g.fillRect(0, 0, 960, 540);
    for (let y = 82, row = 0; y < 540; y += 46, row += 1) {
      for (let x = 0, column = 0; x < 960; x += 64, column += 1) {
        g.fillStyle((row + column) % 4 === 0 ? 0xf0e2ba : 0xe4cf9e, 0.7);
        g.fillRect(x + 2, y + 2, 60, 42);
      }
    }
    g.lineStyle(2, 0xc5ab78, 0.65);
    for (let x = 0; x < 960; x += 64) g.lineBetween(x, 82, x, 540);
    for (let y = 82; y < 540; y += 46) g.lineBetween(0, y, 960, y);
    g.fillStyle(0x49364c, 1); g.fillRect(0, 0, 960, 82);
    g.fillStyle(0x6d4b67, 1);
    for (let x = 18; x < 960; x += 118) g.fillRoundedRect(x, 12, 92, 54, 4);
    g.fillStyle(0xf4d77b, 0.88);
    for (let x = 64; x < 960; x += 118) g.fillCircle(x, 39, 7);
    g.fillStyle(0x7d5570, 1); g.fillRect(0, 75, 960, 10);
    g.fillStyle(0x3b3152, 0.18); g.fillRoundedRect(127, 103, 706, 119, 17);
    g.fillStyle(0x8b5c46, 1); g.fillRoundedRect(145, 110, 670, 102, 15);
    g.fillStyle(0xd0a76e, 1); g.fillRoundedRect(170, 132, 620, 56, 9);
    g.fillStyle(0xf2dfb5, 1); g.fillRect(430, 140, 100, 40);
    g.fillStyle(0x6d4561, 1); g.fillRect(440, 148, 80, 24);
    this.add.text(480, 160, "RAT", { fontFamily: "Courier New", fontSize: "14px", fontStyle: "bold", color: "#fff8dc" }).setOrigin(0.5).setDepth(2);
    GROUPS.forEach((group, index) => {
      const x = 205 + index * 185;
      g.fillStyle([0xd85f73, 0x4d5b86, 0x4d8f68, 0xb88945][index] ?? 0x4d5b86, 1);
      g.fillRoundedRect(x - 65, 250, 130, 86, 10);
      g.fillStyle(0x17182c, 0.28); g.fillRoundedRect(x - 58, 257, 116, 72, 7);
      for (let seat = 0; seat < group.seats; seat += 1) {
        g.fillStyle(0xffedaa, 1); g.fillCircle(x - (group.seats - 1) * 8 + seat * 16, 316, 4);
      }
      const portrait = this.add.image(x, 238, ["mia", "broemmel", "nora", "centner"][index] ?? "npc-clerk").setOrigin(0.5, 0.8).setScale(0.92).setDepth(3);
      this.tweens.add({ targets: portrait, y: portrait.y - 3, duration: 760 + index * 90, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      this.add.text(x, 283, `${group.name}\n${group.seats} Sitze`, { fontFamily: "Trebuchet MS", fontSize: "15px", fontStyle: "bold", align: "center", color: "#fff8dc", lineSpacing: 3 }).setOrigin(0.5).setDepth(3);
    });
    this.add.text(480, 42, "ABSTIMMUNG IM STADTRAT", { fontFamily: "Courier New", fontSize: "28px", fontStyle: "bold", color: "#fff8dc" }).setOrigin(0.5);
  }

  private consume(): boolean {
    if (this.keys.every((key) => key.isUp)) this.armed = true;
    if (!this.armed) return false;
    if (this.keys.some((key) => Phaser.Input.Keyboard.JustDown(key))) { this.armed = false; return true; }
    return false;
  }
}
