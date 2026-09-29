import Phaser from "phaser";
import { Player } from "../characters/Player";
import { DialogBox } from "../ui/DialogBox";
import { TownHud } from "../ui/TownHud";
import { InteractionSystem } from "../systems/InteractionSystem";
import { addNpcCollision } from "../systems/addNpcCollision";
import { gameState } from "../state/GameState";
import type { DialogueScript } from "../dialogue/types";
import { ARGUMENT_CARDS, type ArgumentCardId } from "../data/argumentCards";
import type { GroupId } from "../data/festivalRules";
import { miaFirstMeeting } from "../data/dialogues/miaFirstMeeting";
import { noraFirstMeeting } from "../data/dialogues/noraFirstMeeting";
import { centnerFirstMeeting } from "../data/dialogues/centnerFirstMeeting";
import { groupFollowUps } from "../data/dialogues/groupFollowUps";
import { createRudiCompanionDialogue, type RudiLocation } from "../data/dialogues/rudiCompanion";
import { centnerReceiptBriefing, centnerReceiptComplete, centnerReceiptProgress, noraCleanupBriefing, noraCleanupProgress } from "../data/dialogues/groupQuestDialogues";
import { createNegotiationDialogue, negotiationsCompleteDialogue, resolveNegotiation } from "../data/negotiations";
import { UnlockOverlay } from "../ui/UnlockOverlay";
import { JournalMenu } from "../ui/JournalMenu";
import { createWorldDepthLayer } from "../utils/createWorldDepthLayer";
import { faceHorizontalMotion } from "../utils/motionFacing";
import { setDepthIfChanged } from "../utils/setDepthIfChanged";
import { PARK_GROUND_KEY } from "../utils/prepareParkGround";

const W = 1280;
const H = 720;
const HALL_W = 960;
const HALL_H = 540;
const MINKA_SPOTS = [
  { x: 1080, y: 365 },
  { x: 1065, y: 620 },
  { x: 360, y: 660 },
  { x: 180, y: 340 },
  { x: 1180, y: 640 },
  { x: 870, y: 650 },
  { x: 350, y: 345 },
  { x: 980, y: 520 },
] as const;

const GROUP_CARD: Readonly<Record<GroupId, ArgumentCardId>> = {
  "young-list": "youth-culture",
  "citizens-forum": "resident-protection",
  "green-local": "sustainability",
  "budget-hawks": "budget-discipline",
};

const talk = (id: string, speaker: string, text: string): DialogueScript => ({
  id,
  start: "start",
  nodes: { start: { id: "start", speaker, text } },
});

export class AdventureScene extends Phaser.Scene {
  protected player!: Player;
  protected hud!: TownHud;
  protected dialog!: DialogBox;
  protected interactions!: InteractionSystem;
  protected interactKey!: Phaser.Input.Keyboard.Key;
  protected spaceKey!: Phaser.Input.Keyboard.Key;
  protected enterKey!: Phaser.Input.Keyboard.Key;
  protected actionArmed = false;
  protected companion?: Phaser.GameObjects.Image;
  protected unlock!: UnlockOverlay;
  protected choiceKeys: Phaser.Input.Keyboard.Key[] = [];
  protected choiceArmed = true;
  protected negotiationCard?: ArgumentCardId;
  protected negotiationSubChoice?: string;
  protected journal!: JournalMenu;
  protected menuKey!: Phaser.Input.Keyboard.Key;
  protected escapeKey!: Phaser.Input.Keyboard.Key;
  protected menuUpKey!: Phaser.Input.Keyboard.Key;
  protected menuDownKey!: Phaser.Input.Keyboard.Key;
  protected readonly mapKind: "park" | "kai" | "hall";
  protected readonly staticObstacles: Phaser.GameObjects.Zone[] = [];
  protected readonly collectibleVisuals: Array<{ object: Phaser.GameObjects.Components.Visible; visible: () => boolean }> = [];
  protected groundTexture?: Phaser.GameObjects.Image;

  constructor(key: string, mapKind: "park" | "kai" | "hall") {
    super(key);
    this.mapKind = mapKind;
  }

  create(data: { spawn?: { x: number; y: number } } = {}): void {
    this.staticObstacles.length = 0;
    this.collectibleVisuals.length = 0;
    this.companion = undefined;
    this.negotiationCard = undefined;
    this.negotiationSubChoice = undefined;
    this.choiceArmed = true;
    const worldWidth = this.mapKind === "hall" ? HALL_W : W;
    const worldHeight = this.mapKind === "hall" ? HALL_H : H;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.drawMap();
    const defaultSpawn = this.mapKind === "park"
      ? { x: 1110, y: 390 }
      : this.mapKind === "hall"
        ? { x: 480, y: 470 }
        : { x: 180, y: 390 };
    const spawn = data.spawn ?? defaultSpawn;
    this.player = new Player(this, spawn.x, spawn.y, "player");
    if (gameState.current.flags.rudiFirstMeetingComplete) this.companion = this.add.image(this.player.x - 45, this.player.y + 18, "rudi").setOrigin(0.5, 0.8).setDepth(500);
    this.interactions = new InteractionSystem();
    this.createArea();
    this.physics.add.collider(this.player, this.staticObstacles);
    this.registerCompanionInteraction();
    createWorldDepthLayer(this, this.groundTexture ? [this.groundTexture] : []);
    this.hud = new TownHud(this);
    this.hud.setStatus(this.mapKind === "park" ? "STADTPARK  •  Frische Luft, frische Aufgaben" : this.mapKind === "kai" ? "KULTURKAI  •  Bühne, Fluss und Kabelsalat" : "RATHAUS  •  Erdgeschoss");
    if (gameState.current.quest.mainQuestStarted) {
      const state = gameState.current;
      this.hud.setQuest(
        state.quest.groupsInterviewed === state.quest.groupsTotal && !state.flags.firstDraftSaved
          ? "4/4 ARGUMENTE GESAMMELT\nNÄCHSTES ZIEL: Rathaus · 1. Stock · Planungstisch"
          : state.quest.negotiationStarted && state.quest.negotiationTokensRemaining === 0
            ? "3/3 VERHANDLUNGEN ABGESCHLOSSEN\nNÄCHSTES ZIEL: Rathaus · 1. Stock · finaler Plan"
            : state.quest.negotiationStarted
              ? `VERHANDLUNGEN: ${state.quest.negotiationTokensRemaining}/3 MARKEN\nMia · Kai  |  Nora · Park  |  Brömmel · Markt  |  Centner · Rathaus`
              : `GRUPPENBEFRAGUNG: ${state.quest.groupsInterviewed}/4\nMia · Kai  |  Nora · Park  |  Brömmel · Markt  |  Centner · Rathaus`,
      );
    }
    this.dialog = new DialogBox(this);
    this.unlock = new UnlockOverlay(this);
    this.journal = new JournalMenu(this);
    this.configureKeys();
    this.syncCollectibleVisibility();
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.fadeIn(180, 59, 49, 82);
  }

  update(): void {
    this.syncCollectibleVisibility();
    this.updateCompanion();
    if (this.journal.isOpen) {
      this.player.updateMovement(false);
      this.hud.setPrompt("");
      if (Phaser.Input.Keyboard.JustDown(this.menuKey) || Phaser.Input.Keyboard.JustDown(this.escapeKey)) this.journal.close();
      else if (Phaser.Input.Keyboard.JustDown(this.menuUpKey)) this.journal.turnPage(-1);
      else if (Phaser.Input.Keyboard.JustDown(this.menuDownKey)) this.journal.turnPage(1);
      else {
        const tab = this.choiceKeys.slice(0, 3).findIndex((key) => Phaser.Input.Keyboard.JustDown(key));
        if (tab >= 0) this.journal.select(tab);
      }
      return;
    }
    if (!this.dialog.isOpen && !this.unlock.isOpen && Phaser.Input.Keyboard.JustDown(this.menuKey)) {
      this.player.updateMovement(false);
      this.journal.open();
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
          const selected = this.choiceKeys.findIndex((key) => Phaser.Input.Keyboard.JustDown(key));
          if (selected >= 0) { this.choiceArmed = false; this.dialog.choose(selected); }
        }
        return;
      }
      if (this.consumeAction()) this.dialog.advance();
      return;
    }
    this.player.updateMovement(true);
    this.hud.setPrompt(this.interactions.update(this.player));
    if (this.consumeAction()) this.interactions.interact();
  }

  protected updateCompanion(): void {
    if (!this.companion || !this.player) return;
    const targetX = this.player.x - this.player.facingDirection.x * 48 + this.player.facingDirection.y * 20;
    const targetY = this.player.y - this.player.facingDirection.y * 48 - this.player.facingDirection.x * 12;
    this.companion.x = Phaser.Math.Linear(this.companion.x, targetX, 0.08);
    this.companion.y = Phaser.Math.Linear(this.companion.y, targetY, 0.08);
    this.companion.setFlipX(targetX > this.companion.x);
    setDepthIfChanged(this.companion, 100 + Math.round(this.companion.y));
  }

  private registerCompanionInteraction(): void {
    if (!this.companion) return;
    this.interactions.register({
      id: "rudi-companion",
      displayName: "Rudi",
      object: this.companion,
      range: 78,
      enabled: () => Boolean(this.companion?.visible),
      interact: () => {
        const conversationIndex = gameState.recordRudiConversation();
        this.open(createRudiCompanionDialogue(
          gameState.current,
          conversationIndex,
          this.mapKind as RudiLocation,
        ));
      },
      prompt: () => "Mit Rudi sprechen",
      priority: -10,
    });
  }

  protected createArea(): void {
    if (this.mapKind === "park") this.createPark();
    else if (this.mapKind === "kai") this.createKai();
    else this.createHall();
  }

  protected createPark(): void {
    this.addLabel(640, 104, "STADTPARK · ROSENGARTEN", "#245b52");
    ([[48, 150], [105, 120], [175, 145], [250, 112], [330, 145], [420, 112], [520, 145], [615, 118], [710, 145], [810, 118], [910, 145], [1010, 120], [1100, 150], [1190, 125], [1250, 180], [45, 315], [70, 520], [115, 665], [205, 635], [300, 680], [435, 650], [565, 685], [700, 655], [835, 688], [965, 650], [1110, 675], [1240, 615]] as const).forEach(([x, y], index) => {
      const texture = index % 7 === 2 ? "tree-flowering" : index % 5 === 1 ? "tree-birch" : "tree";
      const scale = index % 3 === 0 ? 1.15 : 1;
      this.add.image(x, y, texture).setOrigin(0.5, 0.8).setScale(scale).setDepth(100 + y);
      this.addMapCollider(x, y - 4, 30 * scale, 24 * scale);
    });
    ([[145, 230], [300, 180], [545, 185], [780, 195], [940, 190], [1170, 570], [720, 600], [370, 620], [90, 430], [1080, 620], [850, 640]] as const).forEach(([x, y]) => {
      this.add.image(x, y, "bush").setDepth(100 + y);
      this.addMapCollider(x, y + 4, 34, 18);
    });
    this.createRoseGarden();
    this.createDogPlayArea();
    this.createParkLife();
    this.add.image(760, 365, "bench").setDepth(465);
    this.add.image(300, 565, "bench").setDepth(665).setFlipX(true);
    this.add.image(1025, 485, "bench").setDepth(585);
    this.add.image(1120, 325, "signpost").setOrigin(0.5, 0.9).setDepth(425);
    this.add.image(230, 535, "trash-bin").setOrigin(0.5, 0.8).setDepth(635);
    this.addMapCollider(760, 367, 54, 20);
    this.addMapCollider(300, 567, 54, 20);
    this.addMapCollider(1025, 487, 54, 20);
    this.addMapCollider(1120, 324, 24, 28);
    this.addMapCollider(230, 535, 28, 30);
    this.addLabel(230, 585, "PARKMÜLL", "#355548");
    const bin = this.add.zone(230, 535, 42, 52);
    this.interactions.register({ id: "park-bin", displayName: "den Mülleimer", object: bin, range: 72, enabled: () => true, interact: () => {
      if (gameState.depositTrash()) this.open(talk("trash-done", "Rudi", "Der Park ist wieder sauber. Erzählen wir Nora, dass alles im Mülleimer gelandet ist."));
      else this.open(talk("trash-bin", "Mülleimer", gameState.getFavorStatus("green-local") === "active" ? `Noch ${Math.max(0, 4 - gameState.current.favors.trashCollected.length)} Fundstücke fehlen.` : "Der Mülleimer ist leer."));
    }, prompt: () => "Müll einwerfen" });
    ([[390, 235], [610, 560], [820, 405], [1010, 565]] as const).forEach(([x, y], i) => {
      const piece = this.add.image(x, y, i % 2 === 0 ? "plastic-cup" : "pizza-box").setDepth(100 + y).setAngle(i % 2 === 0 ? -8 : 6);
      this.collectibleVisuals.push({
        object: piece,
        visible: () => gameState.getFavorStatus("green-local") === "active" && !gameState.current.favors.trashCollected.includes(`trash-${i}`),
      });
      this.interactions.register({ id: `trash-${i}`, displayName: "Müllstück", object: piece, range: 62, enabled: () => gameState.getFavorStatus("green-local") === "active" && !gameState.current.favors.trashCollected.includes(`trash-${i}`), interact: () => { if (gameState.collectTrash(`trash-${i}`)) { piece.setVisible(false); this.hud.setQuest(`Park-Aufgabe: ${gameState.current.favors.trashCollected.length}/4 Müllteile`); } } });
    });
    this.createPoliticalGroup("green-local", 745, 280, "nora", "Nora", noraFirstMeeting);
    const moos = this.add.image(865, 475, "npc-gardener").setOrigin(0.5, 0.8).setDepth(575);
    addNpcCollision(this, this.player, moos);
    this.add.text(865, 423, "Frau Moos", { fontFamily: "Courier New", fontSize: "13px", color: "#28304b", backgroundColor: "#fff5c9", padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(900);
    this.interactions.register({ id: "frau-moos", displayName: "Frau Moos", object: moos, range: 74, enabled: () => true, interact: () => {
      if (gameState.completeSideQuest("bakeryDelivery", 50)) this.open(talk("basket-done", "Frau Moos", "Der Picknickkorb ist da! Genau rechtzeitig für die Kindergruppe. Danke dir – und +50 Punkte."));
      else this.open(talk("moos-talk", "Frau Moos", "Die Blumen am Südeingang brauchen heute noch Wasser. Danach kann der Festabend kommen."));
    } });
    this.createJogger();
    const parkCoin = this.add.image(1030, 590, "quest-coin").setDepth(700);
    this.collectibleVisuals.push({ object: parkCoin, visible: () => gameState.current.sideQuests.fountainCoins === "active" && !gameState.current.sideQuests.coinIds.includes("park") });
    this.interactions.register({ id: "coin-park", displayName: "eine Glücksmünze", object: parkCoin, range: 58, enabled: () => gameState.current.sideQuests.fountainCoins === "active" && !gameState.current.sideQuests.coinIds.includes("park"), interact: () => { if (gameState.collectFountainCoin("park")) { parkCoin.setVisible(false); this.open(talk("coin-park-found", "Fundstück", "Eine Glücksmünze liegt im Gras, direkt neben dem Rosenbeet.")); } }, prompt: () => "Glücksmünze aufheben" });
    this.addExit(1200, 360, "Zurück zum Marktplatz", () => this.scene.start("TownScene", { entrance: "west" }));
  }

  private createRoseGarden(): void {
    const garden = this.add.graphics().setDepth(8);
    garden.fillStyle(0x6f4d3a, 1);
    garden.fillRoundedRect(780, 510, 190, 92, 34);
    garden.lineStyle(5, 0xc79b69, 1);
    garden.strokeRoundedRect(780, 510, 190, 92, 34);
    garden.fillStyle(0x9a6846, 1);
    for (let x = 802; x <= 946; x += 36) garden.fillCircle(x, 555, 11);
    ([[802, 550], [838, 562], [874, 545], [910, 563], [946, 550], [820, 580], [856, 582], [892, 580], [928, 582]] as const).forEach(([x, y], index) => {
      const flower = this.add.image(x, y, "flower-patch").setScale(index % 2 ? 0.82 : 0.95).setDepth(100 + y);
      this.tweens.add({ targets: flower, angle: index % 2 ? 2 : -2, duration: 1300 + index * 80, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    });
    this.add.text(875, 615, "ROSENGARTEN", { fontFamily: "Courier New", fontSize: "12px", fontStyle: "bold", color: "#355548", backgroundColor: "#fff5c9", padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(700);
    this.addMapCollider(875, 556, 190, 84);
  }

  private createDogPlayArea(): void {
    this.add.image(1035, 580, "picnic-blanket").setDepth(640).setAngle(-4);
    const owner = this.add.image(1060, 545, "npc-purple").setOrigin(0.5, 0.8).setDepth(645);
    addNpcCollision(this, this.player, owner);
    this.add.text(1060, 493, "Mara & Flocke", { fontFamily: "Courier New", fontSize: "13px", color: "#28304b", backgroundColor: "#fff5c9", padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(900);
    const dog = faceHorizontalMotion(this.add.image(970, 555, "park-dog").setDepth(660), 42);
    addNpcCollision(this, this.player, dog, { width: 26, height: 12, bottomInset: 1 });
    const ball = this.add.image(925, 548, "dog-ball").setDepth(655);
    this.tweens.add({ targets: ball, x: 1005, y: 530, angle: 360, duration: 1150, yoyo: true, repeat: -1, hold: 420, repeatDelay: 520, ease: "Quad.Out" });
    this.tweens.add({ targets: dog, x: 1012, y: 540, duration: 1150, yoyo: true, repeat: -1, hold: 420, repeatDelay: 520, ease: "Sine.InOut", onYoyo: () => faceHorizontalMotion(dog, -42), onRepeat: () => faceHorizontalMotion(dog, 42) });
    this.tweens.add({ targets: owner, angle: 2, duration: 700, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    this.interactions.register({ id: "mara-flocke", displayName: "Mara und Flocke", object: owner, range: 78, enabled: () => true, interact: () => this.open(talk("talk-mara-flocke", "Mara", "Flocke apportiert zuverlässig. Zurückbringen hält sie dagegen für einen unverbindlichen Vorschlag.")) });
  }

  private createParkLife(): void {
    const ducks = [
      faceHorizontalMotion(this.add.image(285, 350, "park-duck").setDepth(24), 75),
      faceHorizontalMotion(this.add.image(335, 385, "park-duck").setDepth(24).setScale(0.82), 75),
      faceHorizontalMotion(this.add.image(415, 335, "park-duck").setDepth(24), -70),
    ];
    ducks.forEach((duck, index) => {
      const deltaX = index === 2 ? -70 : 75;
      this.tweens.add({ targets: duck, x: duck.x + deltaX, y: duck.y + (index % 2 ? -10 : 12), duration: 3800 + index * 600, yoyo: true, repeat: -1, ease: "Sine.InOut", onYoyo: () => faceHorizontalMotion(duck, -deltaX), onRepeat: () => faceHorizontalMotion(duck, deltaX) });
    });
    const picnic = this.add.image(600, 610, "picnic-blanket").setDepth(650).setAngle(3);
    const picnicGuestA = this.add.image(582, 595, "npc-red").setOrigin(0.5, 0.8).setScale(0.9).setDepth(670);
    const picnicGuestB = this.add.image(622, 600, "npc-green").setOrigin(0.5, 0.8).setScale(0.9).setDepth(670).setFlipX(true);
    addNpcCollision(this, this.player, picnicGuestA);
    addNpcCollision(this, this.player, picnicGuestB);
    this.tweens.add({ targets: picnic, angle: 1, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    [180, 530, 680, 835, 1140].forEach((x, index) => {
      const butterfly = this.add.text(x, 245 + (index % 3) * 95, index % 2 ? "◆" : "✦", { fontFamily: "Courier New", fontSize: "13px", color: index % 2 ? "#f27691" : "#fff0a0" }).setDepth(80);
      this.tweens.add({ targets: butterfly, x: x + 34, y: butterfly.y - 22, angle: 25, duration: 1250 + index * 180, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    });
  }

  private createJogger(): void {
    const body = this.add.image(1060, 235, "npc-jogger").setOrigin(0.5, 0.8).setDepth(440);
    addNpcCollision(this, this.player, body);
    const name = this.add.text(1060, 183, "Jogger Juri", { fontFamily: "Courier New", fontSize: "13px", color: "#28304b", backgroundColor: "#fff5c9", padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(900);
    this.tweens.add({ targets: [body, name], x: 1160, duration: 2400, yoyo: true, repeat: -1, hold: 500, repeatDelay: 500, ease: "Sine.InOut", onYoyo: () => body.setFlipX(true), onRepeat: () => body.setFlipX(false) });
    this.interactions.register({ id: "npc-Jogger Juri", displayName: "Jogger Juri", object: body, range: 78, enabled: () => true, interact: () => this.open(talk("talk-Jogger Juri", "Jogger Juri", "Runde sieben. Mein Körper sagt Pause, meine Fitness-App sagt: ›Bist du noch da?‹")) });
  }

  protected createKai(): void {
    this.addLabel(640, 295, "KULTURKAI · ALTE WERFTHALLE", "#314b70");
    this.add.image(285, 515, "crate").setDepth(615);
    this.add.image(315, 520, "barrel").setDepth(620);
    this.add.image(345, 515, "crate").setDepth(615).setAngle(4);
    this.add.image(520, 610, "bike").setDepth(710);
    this.add.image(750, 600, "crate").setDepth(700);
    this.add.image(790, 600, "barrel").setDepth(700);
    this.add.image(1150, 460, "lamp").setOrigin(0.5, 0.9).setDepth(560);
    this.addMapCollider(285, 518, 30, 24);
    this.addMapCollider(315, 521, 23, 25);
    this.addMapCollider(345, 518, 30, 24);
    this.addMapCollider(520, 613, 44, 22);
    this.addMapCollider(750, 603, 30, 24);
    this.addMapCollider(790, 603, 23, 25);
    this.addMapCollider(1150, 458, 18, 25);
    this.createPoliticalGroup("young-list", 620, 540, "mia", "Mia", miaFirstMeeting);
    this.addNpc(430, 540, "Kalle Kabel", "Die alte Werfthalle ist heute unsere Probebühne. Ich sichere noch die Leitungen, bevor jemand über ein Kabel stolpert.", "npc-technician");
    const lina = this.add.image(900, 515, "npc-musician").setOrigin(0.5, 0.8).setDepth(615);
    addNpcCollision(this, this.player, lina);
    this.add.text(900, 465, "Lina Lied", { fontFamily: "Courier New", fontSize: "13px", color: "#28304b", backgroundColor: "#fff5c9", padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(900);
    this.interactions.register({ id: "lina-rhythm", displayName: "Lina Lied", object: lina, range: 74, enabled: () => true, interact: () => this.scene.start("RhythmScene", { returnScene: this.scene.key, spawn: { x: this.player.x, y: this.player.y } }), prompt: () => "Linas Drei-Akkorde-Spiel spielen" });
    const catOrder = gameState.current.sideQuests.missingCatSpotOrder;
    const catSpotIndex = catOrder[Math.min(gameState.current.sideQuests.missingCatEncounters, 2)] ?? 0;
    const catSpot = MINKA_SPOTS[catSpotIndex] ?? MINKA_SPOTS[0];
    const missingCat = faceHorizontalMotion(this.add.image(catSpot.x, catSpot.y, "cat").setDepth(100 + catSpot.y), -1);
    let catIsRunning = false;
    this.collectibleVisuals.push({ object: missingCat, visible: () => gameState.current.sideQuests.missingCat === "active" });
    this.interactions.register({
      id: "missing-cat",
      displayName: "Minka",
      object: missingCat,
      range: 68,
      enabled: () => gameState.current.sideQuests.missingCat === "active" && !catIsRunning,
      interact: () => {
        const encounter = gameState.advanceMissingCatChase();
        if (!encounter) return;
        if (encounter < 3) {
          const line = encounter === 1
            ? "Fast! Minka ist schon wieder zwischen den Kisten verschwunden. Wir sollten ihr den Weg abschneiden."
            : "Da läuft sie! Diesmal hat sie den Steg genommen. Bleiben wir dran.";
          this.open(talk(`cat-chase-${encounter}`, "Rudi", line), () => {
            catIsRunning = true;
            const nextSpotIndex = catOrder[encounter] ?? encounter;
            const nextSpot = MINKA_SPOTS[nextSpotIndex] ?? MINKA_SPOTS[encounter] ?? MINKA_SPOTS[0];
            const alternateIndex = catOrder[(encounter + 2) % catOrder.length] ?? 5;
            const alternateSpot = MINKA_SPOTS[alternateIndex] ?? MINKA_SPOTS[5];
            const route = encounter === 1 ? [nextSpot] : [alternateSpot, nextSpot];
            this.runMinkaRoute(missingCat, route, () => { catIsRunning = false; });
          });
          return;
        }
        missingCat.setVisible(false);
        this.hud.setTurboUnlocked(true);
        this.open(talk("cat-caught", "Rudi", "Erwischt! Minka ist in Sicherheit. Ihren schnellen Antritt können wir uns allerdings merken."), () => {
          this.unlock.show({
            eyebrow: "NEUE FÄHIGKEIT",
            title: "KATZENREFLEX-TURBO",
            description: "Drücke Q für einen kurzen Sprint. Wechsel zwischen waagerecht und senkrecht, um sofort erneut zu sprinten.",
            footer: "+75 PUNKTE  •  MINKA EINGEFANGEN",
          }, () => {
            this.hud.setQuest("Turbo freigeschaltet!  •  Q für Katzenreflex");
            this.hud.setTurboUnlocked(true);
          });
        });
      },
      prompt: () => `Minka einfangen · Versuch ${Math.min(3, gameState.current.sideQuests.missingCatEncounters + 1)}/3`,
    });
    const kaiCoin = this.add.image(1010, 135, "quest-coin").setDepth(235);
    this.collectibleVisuals.push({ object: kaiCoin, visible: () => gameState.current.sideQuests.fountainCoins === "active" && !gameState.current.sideQuests.coinIds.includes("kai") });
    this.interactions.register({ id: "coin-kai", displayName: "eine Glücksmünze", object: kaiCoin, range: 58, enabled: () => gameState.current.sideQuests.fountainCoins === "active" && !gameState.current.sideQuests.coinIds.includes("kai"), interact: () => { if (gameState.collectFountainCoin("kai")) { kaiCoin.setVisible(false); this.open(talk("coin-kai-found", "Fundstück", "Eine Glücksmünze liegt zwischen den Planken am Kai.")); } }, prompt: () => "Glücksmünze aufheben" });
    this.addLabel(780, 555, "TECHNIKLAGER", "#5d3d68");
    this.addExit(70, 430, "Zum Marktplatz", () => this.scene.start("TownScene", { entrance: "east" }));
  }

  private runMinkaRoute(
    cat: Phaser.GameObjects.Image,
    waypoints: ReadonlyArray<Readonly<{ x: number; y: number }>>,
    onComplete: () => void,
  ): void {
    let waypointIndex = 0;
    const runNextLeg = (): void => {
      const target = waypoints[waypointIndex];
      if (!target) {
        cat.setAngle(0).setScale(1);
        onComplete();
        return;
      }
      waypointIndex += 1;
      const deltaX = target.x - cat.x;
      if (Math.abs(deltaX) > 2) faceHorizontalMotion(cat, deltaX);
      const distance = Phaser.Math.Distance.Between(cat.x, cat.y, target.x, target.y);
      this.tweens.add({
        targets: cat,
        x: target.x,
        y: target.y,
        angle: deltaX >= 0 ? 3 : -3,
        scaleX: Math.abs(cat.scaleX) * 1.08 * Math.sign(cat.scaleX || 1),
        scaleY: 0.92,
        duration: Math.max(260, distance * 2.1),
        ease: "Sine.InOut",
        onUpdate: () => setDepthIfChanged(cat, 100 + Math.round(cat.y)),
        onComplete: runNextLeg,
      });
    };
    runNextLeg();
  }

  protected createHall(): void {
    this.addLabel(480, 102, "RATHAUS · BÜRGERFOYER", "#5a3c50");
    this.add.image(285, 410, "bench").setDepth(510);
    this.add.image(660, 410, "bench").setDepth(510).setFlipX(true);
    this.addMapCollider(285, 412, 54, 20);
    this.addMapCollider(660, 412, 54, 20);
    this.addNpc(480, 224, "Timo am Empfang", "Willkommen im Rathaus. Für den Sitzungssaal brauchen Sie die Unterlagen zu allen vier Gruppen; ich zeige Ihnen gern den Weg.", "npc-clerk");
    this.createPoliticalGroup("budget-hawks", 230, 315, "centner", "Herr Centner", centnerFirstMeeting);
    const guard = this.add.image(735, 315, "npc-guard").setOrigin(0.5, 0.8).setDepth(415);
    addNpcCollision(this, this.player, guard);
    this.interactions.register({ id: "guard", displayName: "den Wachmann", object: guard, range: 78, enabled: () => true, interact: () => { const n = gameState.current.quest.argumentCards.length; if (n >= 4) this.scene.start("CouncilChamberScene"); else this.open(talk("guard", "Wachmann", `Der erste Stock ist für die Arbeits- und Abstimmungsrunde reserviert. Dir fehlen noch ${4 - n} Argument${4 - n === 1 ? "" : "e"}.`)); }, prompt: () => gameState.current.quest.argumentCards.length >= 4 ? "In den ersten Stock gehen" : "Mit dem Wachmann sprechen" });
    this.addDoorExit(480, 507, "Rathaus verlassen", () => this.scene.start("TownScene", { entrance: "hall" }));
  }

  protected createPoliticalGroup(
    groupId: GroupId,
    x: number,
    y: number,
    texture: string,
    name: string,
    firstMeeting: DialogueScript,
  ): void {
    const npc = this.add.image(x, y, texture).setOrigin(0.5, 0.8).setDepth(100 + y);
    addNpcCollision(this, this.player, npc);
    this.add.text(x, y - 48, name, { fontFamily: "Courier New", fontSize: "13px", fontStyle: "bold", color: "#28304b", backgroundColor: "#fff5c9", padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(900);
    const pending = gameState.current.flags.mayorFirstMeetingComplete && (gameState.current.quest.negotiationStarted ? !gameState.current.quest.groupsNegotiated[groupId] && gameState.current.quest.negotiationTokensRemaining > 0 : !gameState.isGroupInterviewed(groupId));
    const alert = this.add.text(x, y - 75, "!", { fontFamily: "Courier New", fontSize: "25px", fontStyle: "bold", color: "#d83b3b", stroke: "#fff6cf", strokeThickness: 4 }).setOrigin(0.5).setDepth(910).setVisible(pending);
    this.tweens.add({ targets: alert, y: alert.y - 7, duration: 520, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    this.interactions.register({
      id: `group-${groupId}`,
      displayName: name,
      object: npc,
      range: 78,
      enabled: () => true,
      prompt: () => gameState.current.quest.negotiationStarted && !gameState.current.quest.groupsNegotiated[groupId] ? `Mit ${name} verhandeln` : `Mit ${name} sprechen`,
      interact: () => {
        if (!gameState.current.flags.mayorFirstMeetingComplete) {
          this.open(talk(`group-locked-${groupId}`, name, "Die Bürgermeisterin koordiniert gerade die Gespräche. Sprich zuerst mit ihr auf dem Marktplatz."));
          return;
        }
        if (gameState.current.quest.negotiationStarted) {
          this.beginRemoteNegotiation(groupId, alert);
          return;
        }
        if (gameState.isGroupInterviewed(groupId)) {
          this.open(groupFollowUps[groupId]);
          return;
        }
        if (groupId === "green-local" && !this.handleNoraGate(firstMeeting, alert)) return;
        if (groupId === "budget-hawks" && !this.handleCentnerGate(firstMeeting, alert)) return;
        this.open(firstMeeting, () => this.finishRemoteInterview(groupId, alert));
      },
    });
  }

  private handleNoraGate(firstMeeting: DialogueScript, alert: Phaser.GameObjects.Text): boolean {
    const status = gameState.getFavorStatus("green-local");
    if (status === "locked") {
      gameState.startFavor("green-local");
      this.open(noraCleanupBriefing);
      return false;
    }
    if (status === "active" || status === "ready") {
      this.open(noraCleanupProgress(gameState.current.favors.trashCollected.length));
      return false;
    }
    if (status === "complete") {
      this.open(firstMeeting, () => this.finishRemoteInterview("green-local", alert));
      return false;
    }
    return true;
  }

  private handleCentnerGate(firstMeeting: DialogueScript, alert: Phaser.GameObjects.Text): boolean {
    const status = gameState.getFavorStatus("budget-hawks");
    if (status === "locked") {
      gameState.startFavor("budget-hawks");
      this.open(centnerReceiptBriefing);
      return false;
    }
    if (status === "active") {
      this.open(centnerReceiptProgress(gameState.current.favors.receiptsCollected.length));
      return false;
    }
    if (status === "ready") {
      this.open(centnerReceiptComplete, () => {
        gameState.completeFavor("budget-hawks", 75);
        this.open(firstMeeting, () => this.finishRemoteInterview("budget-hawks", alert));
      });
      return false;
    }
    if (status === "complete") {
      this.open(firstMeeting, () => this.finishRemoteInterview("budget-hawks", alert));
      return false;
    }
    return true;
  }

  private finishRemoteInterview(groupId: GroupId, alert: Phaser.GameObjects.Text): void {
    const cardId = GROUP_CARD[groupId];
    if (!gameState.completeGroupInterview(groupId, cardId)) return;
    alert.setVisible(false);
    const card = ARGUMENT_CARDS[cardId];
    this.unlock.show({ eyebrow: "ARGUMENT FREIGESCHALTET", title: card.title, description: card.description, footer: `+100 PUNKTE  •  QUEST ${gameState.current.quest.groupsInterviewed}/${gameState.current.quest.groupsTotal}` }, () => {
      if (gameState.current.quest.groupsInterviewed === gameState.current.quest.groupsTotal) {
        this.hud.setStatus("4/4 ARGUMENTE  •  ZUM SITZUNGSSAAL IM RATHAUS");
        this.hud.setQuest("Alle Argumentkarten gesammelt. Gehe ins Rathaus und dort in den 1. Stock.");
      } else this.hud.setQuest(`GRUPPENBEFRAGUNG: ${gameState.current.quest.groupsInterviewed}/4\nMia · Kulturkai  |  Nora · Stadtpark\nBrömmel · Marktplatz  |  Centner · Rathaus`);
    });
  }

  private beginRemoteNegotiation(groupId: GroupId, alert: Phaser.GameObjects.Text): void {
    if (gameState.current.quest.groupsNegotiated[groupId]) {
      this.open(groupFollowUps[groupId]);
      return;
    }
    if (gameState.current.quest.negotiationTokensRemaining <= 0) {
      this.open(talk("planning-upstairs", "Rudi", "Drei Vereinbarungen, drei Unterschriften, kein automatisches Menü. Wir müssen zurück an den Planungstisch im ersten Stock."));
      return;
    }
    this.negotiationCard = undefined;
    this.negotiationSubChoice = undefined;
    this.open(createNegotiationDialogue(groupId), () => {
      if (!this.negotiationCard) return;
      const outcome = resolveNegotiation(groupId, this.negotiationCard, this.negotiationSubChoice);
      if (!gameState.completeNegotiation(groupId, outcome)) return;
      alert.setVisible(false);
      const remaining = gameState.current.quest.negotiationTokensRemaining;
      this.unlock.show({ eyebrow: outcome.flag ? "KOMPROMISS FREIGESCHALTET" : "GESPRÄCH BEENDET", title: outcome.title, description: outcome.description, footer: `+${outcome.points} PUNKTE  •  ${remaining} GESPRÄCHSMARKEN ÜBRIG` }, () => {
        if (remaining === 0) this.open(negotiationsCompleteDialogue, () => {
          this.hud.setStatus("3/3 VERHANDLUNGEN  •  ZUM PLANUNGSTISCH IM RATHAUS");
          this.hud.setQuest("Alle drei Vereinbarungen stehen. Gehe in den Sitzungssaal im 1. Stock.");
        });
        else this.hud.setStatus(`VERHANDLE!  •  ${remaining}/3 GESPRÄCHSMARKEN`);
      });
    }, (choiceId) => {
      if (choiceId.startsWith("card:")) this.negotiationCard = choiceId.slice(5) as ArgumentCardId;
      if (choiceId.startsWith("mia:")) this.negotiationSubChoice = choiceId;
    });
  }

  protected addNpc(x: number, y: number, name: string, text: string, texture = "npc-clerk"): void {
    const body = this.add.image(x, y, texture).setOrigin(0.5, 0.8).setDepth(100 + y);
    addNpcCollision(this, this.player, body);
    this.add.text(x, y - 50, name, { fontFamily: "Courier New", fontSize: "13px", color: "#28304b", backgroundColor: "#fff5c9", padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(900);
    this.interactions.register({ id: `npc-${name}`, displayName: name, object: body, range: 74, enabled: () => true, interact: () => this.open(talk(`talk-${name}`, name, text)) });
  }

  protected addExit(x: number, y: number, label: string, action: () => void): void {
    const marker = this.add.graphics().setDepth(48);
    const leadsRight = x > 640;
    const pathStart = leadsRight ? x - 115 : 0;
    const pathWidth = leadsRight ? W - pathStart : x + 115;
    marker.fillStyle(this.mapKind === "park" ? 0xe8d19a : 0xd7b77d, 1);
    marker.fillRoundedRect(pathStart, y - 34, pathWidth, 68, 18);
    marker.lineStyle(3, this.mapKind === "park" ? 0xc2a66f : 0xa77d55, 0.9);
    for (let offset = 8; offset < 105; offset += 22) marker.lineBetween(pathStart + offset, y - 29, pathStart + offset + 8, y + 29);
    marker.fillStyle(0x6b4b42, 1); marker.fillRect(x - 27, y - 55, 7, 55); marker.fillRect(x + 20, y - 55, 7, 55);
    marker.fillStyle(0xf4d77b, 1); marker.fillRoundedRect(x - 43, y - 66, 86, 25, 4);
    marker.lineStyle(3, 0x49364c, 1); marker.strokeRoundedRect(x - 43, y - 66, 86, 25, 4);
    const signText = label.replace(/^Zurück zum /, "").replace(/^Zum /, "").toUpperCase();
    this.add.text(x, y - 53, signText, { fontFamily: "Courier New", fontSize: "10px", fontStyle: "bold", color: "#49364c" }).setOrigin(0.5).setDepth(51);
    const exit = this.add.zone(x, y, 70, 100);
    this.interactions.register({ id: `exit-${x}-${y}`, displayName: label, object: exit, range: 80, enabled: () => true, interact: action, prompt: () => label });
  }

  protected addDoorExit(x: number, y: number, label: string, action: () => void): void {
    const door = this.add.graphics().setDepth(100 + y);
    door.fillStyle(0x49364c, 0.22); door.fillEllipse(x, y + 23, 126, 16);
    door.fillStyle(0x5b405e, 1); door.fillRect(x - 60, y - 58, 120, 82);
    door.fillStyle(0x805444, 1); door.fillRect(x - 51, y - 50, 47, 74); door.fillRect(x + 4, y - 50, 47, 74);
    door.lineStyle(3, 0xa97655, 1); door.strokeRect(x - 51, y - 50, 47, 74); door.strokeRect(x + 4, y - 50, 47, 74);
    door.fillStyle(0xf4c95d, 1); door.fillCircle(x - 13, y - 12, 3); door.fillCircle(x + 13, y - 12, 3);
    this.add.text(x, y - 67, "AUSGANG", { fontFamily: "Courier New", fontSize: "11px", fontStyle: "bold", color: "#fff4c5", backgroundColor: "#49364c", padding: { x: 6, y: 2 } }).setOrigin(0.5).setDepth(102 + y);
    const zone = this.add.zone(x, y - 8, 124, 76);
    this.interactions.register({ id: `door-exit-${x}-${y}`, displayName: label, object: zone, range: 82, enabled: () => true, interact: action, prompt: () => label, priority: 5 });
  }

  protected addLabel(x: number, y: number, text: string, color: string): void { this.add.text(x, y, text, { fontFamily: "Courier New", fontSize: "22px", fontStyle: "bold", color, backgroundColor: "#fff5c9", padding: { x: 10, y: 6 } }).setOrigin(0.5).setDepth(800); }
  protected open(script: DialogueScript, onComplete: () => void = () => undefined, onChoice?: (choiceId: string) => void): void { this.dialog.open(script, onComplete, onChoice); }

  private drawMap(): void {
    const g = this.add.graphics();
    if (this.mapKind !== "park") {
      g.fillStyle(this.mapKind === "hall" ? 0xe7d2ab : 0x81cbd0, 1);
      g.fillRect(0, 0, W, H);
    }
    if (this.mapKind === "park") {
      const ground = this.add
        .image(0, 0, PARK_GROUND_KEY)
        .setOrigin(0)
        .setDepth(-1000);
      this.groundTexture = ground;
      g.setDepth(1);
      const parkPath = new Phaser.Curves.Spline([[1275, 365], [1080, 350], [920, 315], [760, 300], [650, 315], [605, 415], [560, 520], [440, 555], [270, 545]]).getPoints(64);
      g.lineStyle(82, 0xd8bd86, 1);
      g.strokePoints(parkPath);
      g.lineStyle(62, 0xefd9a3, 1);
      g.strokePoints(parkPath);
      g.lineStyle(3, 0xffefc6, 0.72);
      g.strokePoints(parkPath);
      g.fillStyle(0xc4a66d, 1);
      for (let x = 680; x < 1250; x += 52) g.fillRoundedRect(x, 312 + Math.sin(x) * 9, 20, 4, 2);
      g.fillStyle(0xb89b68, 0.6);
      ([[650, 344], [735, 325], [825, 320], [995, 347], [1145, 355], [505, 510]] as const).forEach(([x, y], index) => {
        g.fillEllipse(x, y, 7 + index % 3, 4);
        g.fillEllipse(x + 13, y + 5, 4, 3);
      });

      g.fillStyle(0x5a887d, 0.5);
      g.fillPoints([[105, 350], [145, 285], [235, 245], [365, 235], [500, 270], [585, 315], [620, 385], [600, 455], [530, 510], [400, 530], [255, 520], [145, 480], [95, 425], [88, 385]].map(([x, y]) => new Phaser.Math.Vector2(x, y)), true, true);
      g.fillStyle(0xd5c080, 1);
      g.fillPoints([[112, 350], [160, 292], [245, 258], [365, 248], [485, 278], [570, 320], [604, 380], [584, 445], [520, 495], [395, 515], [260, 505], [160, 470], [108, 425], [98, 385]].map(([x, y]) => new Phaser.Math.Vector2(x, y)), true, true);
      g.fillStyle(0x4f9caf, 1);
      g.fillPoints([[125, 350], [175, 305], [255, 275], [365, 265], [475, 290], [550, 327], [585, 378], [566, 430], [505, 475], [390, 493], [270, 482], [175, 452], [125, 415], [114, 382]].map(([x, y]) => new Phaser.Math.Vector2(x, y)), true, true);
      g.fillStyle(0x83ced0, 1);
      g.fillPoints([[145, 352], [195, 318], [270, 292], [365, 284], [460, 302], [530, 335], [558, 378], [540, 415], [485, 453], [385, 470], [280, 460], [195, 438], [145, 405], [135, 380]].map(([x, y]) => new Phaser.Math.Vector2(x, y)), true, true);
      g.fillStyle(0xa9e3de, 0.75); g.fillEllipse(345, 337, 255, 34);
      ([[215, 405], [455, 395], [375, 435]] as const).forEach(([x, y], index) => {
        g.fillStyle(index === 1 ? 0x4b9c64 : 0x5dad69, 1); g.fillEllipse(x, y, 24, 10);
        g.fillStyle(0x83ced0, 1); g.fillTriangle(x, y, x + 13, y - 6, x + 13, y + 6);
        if (index === 2) { g.fillStyle(0xf7a1ba, 1); g.fillCircle(x - 2, y - 3, 4); g.fillStyle(0xfff3b0, 1); g.fillCircle(x - 2, y - 3, 1.5); }
      });
      g.fillStyle(0xd5c080, 1);
      ([[105, 400], [125, 445], [565, 420], [585, 370], [515, 475]] as const).forEach(([x, y]) => g.fillEllipse(x, y, 36, 22));
      g.fillStyle(0x4c8f58, 1);
      ([[120, 330], [150, 300], [560, 330], [580, 395], [190, 475]] as const).forEach(([x, y], index) => { g.fillRect(x, y, 3, 31); g.fillTriangle(x - 7, y + 14, x + 2, y - 5, x + 8, y + 17); if (index % 2 === 0) g.fillCircle(x + 2, y + 2, 2); });
      [0, 1, 2, 3].forEach((i) => {
        const ripple = this.add.ellipse(225 + i * 82, 350 + (i % 2) * 48, 34, 9).setStrokeStyle(2, 0xe8ffff, 0.8).setAlpha(0.32).setDepth(3);
        this.tweens.add({ targets: ripple, scaleX: 2.2, scaleY: 1.7, alpha: 0, duration: 1500, delay: i * 430, repeat: -1 });
      });
      this.addMapCollider(335, 365, 360, 155);
      this.addMapCollider(210, 385, 150, 105);
      this.addMapCollider(500, 375, 130, 105);
    }
    if (this.mapKind === "kai") {
      g.setDepth(1);
      g.fillStyle(0x5b94b1, 1); g.fillRect(0, 0, W, 235);
      g.fillStyle(0x72adc2, 0.72); g.fillRect(0, 82, W, 48);
      g.fillStyle(0x4b83a0, 0.68); g.fillRect(0, 178, W, 50);
      g.fillStyle(0x466f8e, 1); g.fillRect(0, 228, W, 13);
      g.fillStyle(0x385f78, 1);
      for (let x = 0; x < W; x += 90) g.fillTriangle(x, 76, x + 45, 22 + (x % 4) * 6, x + 90, 76);
      g.fillStyle(0x4f7d72, 1); g.fillRect(0, 72, W, 24);
      g.fillStyle(0xe7d29d, 1); g.fillRect(0, 241, W, H - 241);
      for (let row = 0, y = 241; y < H; y += 34, row += 1) {
        g.fillStyle(row % 2 === 0 ? 0xe1c990 : 0xecd9aa, 0.72);
        g.fillRect(0, y, W, 32);
        g.fillStyle(0xc4a56d, 0.82);
        g.fillRect(0, y + 31, W, 3);
        for (let x = row % 2 === 0 ? 0 : 34; x < W; x += 68) g.fillRect(x, y, 2, 32);
      }
      g.fillStyle(0xb89561, 0.62);
      for (let x = 18; x < W; x += 73) {
        const yy = 278 + ((x * 11) % 390);
        g.fillRoundedRect(x, yy, 25 + (x % 4) * 4, 3, 1);
        g.fillCircle(x + 7, yy + 12, 2);
      }
      g.fillStyle(0x8a684d, 1); g.fillRect(0, 232, W, 20);
      g.fillStyle(0xc69862, 1); g.fillRect(0, 232, W, 8);
      g.fillStyle(0x8a684d, 1);
      g.fillRect(275, 62, 62, 188); g.fillRect(975, 58, 70, 192);
      g.fillStyle(0xc69862, 1);
      g.fillRect(282, 62, 48, 178); g.fillRect(983, 58, 54, 182);
      g.lineStyle(2, 0x8a684d, 1);
      for (let y = 78; y < 230; y += 24) { g.lineBetween(282, y, 330, y); g.lineBetween(983, y, 1037, y); }
      g.lineStyle(1, 0xe4bb7c, 0.8);
      for (let y = 82; y < 224; y += 24) { g.lineBetween(286, y, 326, y); g.lineBetween(987, y, 1033, y); }
      g.fillStyle(0x5b405e, 1);
      [278, 334, 978, 1042].forEach((x) => { g.fillRect(x, 214, 7, 38); g.fillCircle(x + 3, 213, 5); });
      g.fillStyle(0x4a3d50, 1);
      g.fillRect(510, 380, 275, 125); g.fillRect(490, 500, 315, 20);
      g.fillStyle(0x6d5a7d, 1); g.fillTriangle(510, 380, 550, 380, 510, 485); g.fillTriangle(785, 380, 745, 380, 785, 485);
      g.fillStyle(0x88779a, 0.72);
      for (let x = 525; x < 775; x += 24) g.fillRect(x, 391, 15, 3);
      g.lineStyle(2, 0x2f2a3e, 0.68);
      for (let x = 520; x <= 775; x += 32) g.lineBetween(x, 382, x, 498);
      g.fillStyle(0xd85f8c, 1); g.fillRect(555, 410, 185, 42);
      g.fillStyle(0xffe48a, 1); [535, 575, 615, 655, 695, 735, 775].forEach((x) => g.fillCircle(x, 386, 4));
      this.add.text(647, 431, "WERFTHALLEN-BÜHNE", { fontFamily: "Courier New", fontSize: "17px", fontStyle: "bold", color: "#fff8dc" }).setOrigin(0.5).setDepth(3);
      this.addMapCollider(647, 450, 300, 140);
      for (let i = 0; i < 7; i += 1) {
        const wave = this.add.rectangle(90 + i * 185, 115 + (i % 3) * 40, 75, 4, 0xcdf4ef, 0.7).setDepth(2);
        this.tweens.add({ targets: wave, y: wave.y - 38, alpha: 0.12, duration: 1300 + i * 100, repeat: -1, ease: "Sine.Out" });
      }
      const boat = this.add.container(760, 145).setDepth(4); boat.add([this.add.triangle(0, -25, 0, 0, 0, 48, 38, 48, 0xfff1a8), this.add.rectangle(0, 3, 66, 16, 0xb76558)]); this.tweens.add({ targets: boat, x: 620, y: 139, angle: -2, duration: 6500, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      this.addMapCollider(137, 116, 274, 232);
      this.addMapCollider(656, 116, 638, 232);
      this.addMapCollider(1162, 116, 236, 232);
    }
    if (this.mapKind === "hall") {
      g.setDepth(1);
      g.fillStyle(0xe9d8ae, 1); g.fillRect(0, 0, HALL_W, HALL_H);
      for (let y = 120, row = 0; y < HALL_H; y += 48, row += 1) {
        for (let x = 0, column = 0; x < HALL_W; x += 64, column += 1) {
          g.fillStyle((row + column) % 4 === 0 ? 0xf0e1bb : 0xe6d3a7, 0.55);
          g.fillRect(x + 2, y + 2, 60, 44);
        }
      }
      g.lineStyle(2, 0xcab283, 0.78);
      for (let x = 0; x < HALL_W; x += 64) g.lineBetween(x, 120, x, HALL_H);
      for (let y = 120; y < HALL_H; y += 48) g.lineBetween(0, y, HALL_W, y);
      g.lineStyle(1, 0xf8edcf, 0.75);
      for (let y = 123; y < HALL_H; y += 48) g.lineBetween(3, y, HALL_W - 3, y);
      g.fillStyle(0x5a3c50, 1); g.fillRect(0, 0, HALL_W, 118);
      g.fillStyle(0x7d5570, 1); g.fillRect(0, 105, HALL_W, 13);
      g.fillStyle(0x6b4960, 1);
      for (let x = 24; x < HALL_W; x += 128) {
        g.fillRoundedRect(x, 22, 86, 63, 4);
        g.fillStyle(0x8f6d82, 1); g.fillRect(x + 6, 28, 74, 51);
        g.fillStyle(0x6b4960, 1);
      }
      g.fillStyle(0xf6dd8a, 0.9);
      for (let x = 68; x < HALL_W; x += 128) g.fillCircle(x, 53, 8);
      // Compact staircase instead of an oversized empty carpet corridor.
      g.fillStyle(0x8f2f52, 1); g.fillRoundedRect(742, 182, 166, 213, 8);
      g.fillStyle(0xc55470, 1); g.fillRoundedRect(775, 158, 100, 263, 10);
      for (let y = 190; y < 390; y += 30) {
        g.fillStyle(y % 60 === 10 ? 0xd76780 : 0xb84266, 1);
        g.fillRect(785, y, 80, 22);
      }
      g.fillStyle(0xf3e5bd, 1); g.fillRect(755, 128, 140, 76);
      g.fillStyle(0x49364c, 1); g.fillRect(770, 141, 110, 50);
      g.fillStyle(0xffe48c, 1); g.fillRect(780, 151, 90, 30);
      this.add.text(825, 166, "1. STOCK\nSITZUNGSSAAL", { fontFamily: "Courier New", fontSize: "12px", fontStyle: "bold", align: "center", color: "#49364c" }).setOrigin(0.5).setDepth(3);

      // Reception forms the visual and functional center of the smaller foyer.
      g.fillStyle(0x805b46, 1); g.fillRoundedRect(365, 252, 230, 76, 7);
      g.fillStyle(0xc88e59, 1); g.fillRect(378, 262, 204, 22);
      g.fillStyle(0x49364c, 1); g.fillRect(410, 286, 140, 9);
      g.fillStyle(0xf4e1b7, 1); g.fillRect(528, 237, 38, 20);
      g.fillStyle(0x6d5570, 1); g.fillRect(533, 241, 28, 12);
      this.add.text(480, 275, "INFORMATION", { fontFamily: "Courier New", fontSize: "13px", fontStyle: "bold", color: "#fff4c5" }).setOrigin(0.5).setDepth(3);
      this.addMapCollider(480, 290, 230, 76);

      // Brochure rack, clock and coat hooks replace the decorative indoor trees.
      g.fillStyle(0x795543, 1); g.fillRoundedRect(82, 205, 74, 128, 5);
      [0, 1, 2].forEach((index) => {
        g.fillStyle(index === 0 ? 0xf3cb69 : index === 1 ? 0x81b7ba : 0xd87991, 1);
        g.fillRect(94, 220 + index * 34, 50, 24);
      });
      g.fillStyle(0x49364c, 1); g.fillCircle(650, 169, 27);
      g.fillStyle(0xfff0bd, 1); g.fillCircle(650, 169, 21);
      g.lineStyle(2, 0x49364c, 1); g.lineBetween(650, 169, 650, 155); g.lineBetween(650, 169, 661, 175);
      [660, 690, 720].forEach((x) => { g.fillStyle(0x6b4b42, 1); g.fillCircle(x, 225, 5); g.fillRect(x - 2, 225, 4, 23); });
      [190, 315, 610].forEach((x, i) => {
        g.fillStyle(0x70546b, 1); g.fillRoundedRect(x, 140 + (i % 2) * 12, 86, 58, 4);
        g.fillStyle(i === 1 ? 0xa9d9d0 : 0xffe6a8, 1); g.fillRect(x + 8, 148 + (i % 2) * 12, 70, 42);
      });
      g.fillStyle(0xd2b584, 1); g.fillRect(0, HALL_H - 14, HALL_W, 14);
    }
  }

  private configureKeys(): void { const k = this.input.keyboard; if (!k) throw new Error("Keyboard input is required"); this.interactKey = k.addKey(Phaser.Input.Keyboard.KeyCodes.E); this.spaceKey = k.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); this.enterKey = k.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER); this.choiceKeys = [k.addKey(Phaser.Input.Keyboard.KeyCodes.ONE), k.addKey(Phaser.Input.Keyboard.KeyCodes.TWO), k.addKey(Phaser.Input.Keyboard.KeyCodes.THREE), k.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR)]; this.menuKey = k.addKey(Phaser.Input.Keyboard.KeyCodes.M); this.escapeKey = k.addKey(Phaser.Input.Keyboard.KeyCodes.ESC); this.menuUpKey = k.addKey(Phaser.Input.Keyboard.KeyCodes.UP); this.menuDownKey = k.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN); this.actionArmed = true; }
  private consumeAction(): boolean { const keys = [this.interactKey, this.spaceKey, this.enterKey]; if (keys.every((key) => key.isUp)) this.actionArmed = true; if (!this.actionArmed) return false; if (keys.some((key) => Phaser.Input.Keyboard.JustDown(key))) { this.actionArmed = false; return true; } return false; }

  private addMapCollider(x: number, y: number, width: number, height: number): void {
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    this.staticObstacles.push(zone);
  }

  private syncCollectibleVisibility(): void {
    this.collectibleVisuals.forEach(({ object, visible }) => object.setVisible(visible()));
  }
}

export class ParkScene extends AdventureScene { constructor() { super("ParkScene", "park"); } }
export class KaiScene extends AdventureScene { constructor() { super("KaiScene", "kai"); } }
export class TownHallScene extends AdventureScene { constructor() { super("TownHallScene", "hall"); } }
