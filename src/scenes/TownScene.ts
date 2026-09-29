import Phaser from "phaser";
import { Npc } from "../characters/Npc";
import { Player } from "../characters/Player";
import { ARGUMENT_CARDS, type ArgumentCardId } from "../data/argumentCards";
import { broemmelFirstMeeting } from "../data/dialogues/broemmelFirstMeeting";
import { groupFollowUps } from "../data/dialogues/groupFollowUps";
import { mayorFirstMeeting } from "../data/dialogues/mayorFirstMeeting";
import { rudiFirstMeeting } from "../data/dialogues/rudiFirstMeeting";
import { createRudiCompanionDialogue } from "../data/dialogues/rudiCompanion";
import { createNegotiationDialogue, negotiationsCompleteDialogue, resolveNegotiation } from "../data/negotiations";
import type { GroupId } from "../data/festivalRules";
import type { DialogueScript } from "../dialogue/types";
import { gameState } from "../state/GameState";
import { InteractionSystem } from "../systems/InteractionSystem";
import { addNpcCollision } from "../systems/addNpcCollision";
import { CouncilSeatsOverlay } from "../ui/CouncilSeatsOverlay";
import { DialogBox } from "../ui/DialogBox";
import { TownHud } from "../ui/TownHud";
import { UnlockOverlay } from "../ui/UnlockOverlay";
import { JournalMenu } from "../ui/JournalMenu";
import { createPlayerTexture } from "../utils/createPlaceholderTextures";
import { createWorldDepthLayer } from "../utils/createWorldDepthLayer";
import { faceHorizontalMotion } from "../utils/motionFacing";
import { setDepthIfChanged } from "../utils/setDepthIfChanged";
import { TOWN_GROUND_KEY, TOWN_TILE_SIZE as TILE_SIZE, TOWN_WORLD_WIDTH as WORLD_WIDTH, TOWN_WORLD_HEIGHT as WORLD_HEIGHT } from "../utils/prepareTownGround";

const GROUP_CARD: Readonly<Record<GroupId, ArgumentCardId>> = {
  "young-list": "youth-culture",
  "citizens-forum": "resident-protection",
  "green-local": "sustainability",
  "budget-hawks": "budget-discipline",
};

export class TownScene extends Phaser.Scene {
  private player!: Player;
  private rudi!: Npc;
  private rudiLabel!: Phaser.GameObjects.Text;
  private rudiFollowing = false;
  private mayor!: Npc;
  private mayorLabel!: Phaser.GameObjects.Text;
  private mayorAlert?: Phaser.GameObjects.Text;
  private readonly groupNpcs = new Map<GroupId, Npc>();
  private readonly groupAlerts = new Map<GroupId, Phaser.GameObjects.Text>();
  private interactionSystem!: InteractionSystem;
  private dialogBox!: DialogBox;
  private councilOverlay!: CouncilSeatsOverlay;
  private unlockOverlay!: UnlockOverlay;
  private journal!: JournalMenu;
  private hud!: TownHud;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private choiceKeys: Phaser.Input.Keyboard.Key[] = [];
  private menuKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;
  private menuUpKey!: Phaser.Input.Keyboard.Key;
  private menuDownKey!: Phaser.Input.Keyboard.Key;
  private rudiInteractionEnabled = true;
  private mayorInteractionEnabled = false;
  private groupInteractionsEnabled = false;
  private readonly staticObstacles: Phaser.GameObjects.Zone[] = [];
  private readonly companionObstacleBounds: Phaser.Geom.Rectangle[] = [];
  private readonly resolvedCompanionTarget = new Phaser.Math.Vector2();
  private readonly collectibleVisuals: Array<{ object: Phaser.GameObjects.Components.Visible; visible: () => boolean }> = [];
  private groundTexture?: Phaser.GameObjects.Image;
  private townCat?: Phaser.GameObjects.Image;
  private actionArmed = false;
  private choiceArmed = true;
  private negotiationCard?: ArgumentCardId;
  private negotiationSubChoice?: string;

  constructor() {
    super("TownScene");
  }

  create(data?: { entrance?: "west" | "east" | "hall"; spawn?: { x: number; y: number } }): void {
    this.staticObstacles.length = 0;
    this.companionObstacleBounds.length = 0;
    this.collectibleVisuals.length = 0;
    this.groupNpcs.clear();
    this.groupAlerts.clear();
    this.rudiFollowing = false;
    this.rudiInteractionEnabled = true;
    this.mayorInteractionEnabled = false;
    this.groupInteractionsEnabled = false;
    if (!gameState.current.flags.rudiFirstMeetingComplete) gameState.setPhase("town-intro");
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.drawTileWorld();
    this.createTownLandmarks();
    this.companionObstacleBounds.push(...this.staticObstacles.map((obstacle) => obstacle.getBounds()));

    createPlayerTexture(this, gameState.current.appearance);
    const spawn = data?.spawn ?? (data?.entrance === "west" ? { x: 70, y: 370 } : data?.entrance === "east" ? { x: 1450, y: 370 } : data?.entrance === "hall" ? { x: 740, y: 190 } : { x: 410, y: 470 });
    this.player = new Player(this, spawn.x, spawn.y, "player");
    this.physics.add.collider(this.player, this.staticObstacles);
    if (this.townCat?.visible) addNpcCollision(this, this.player, this.townCat, { width: 18, height: 10, bottomInset: 1 });
    this.createStoryCharacters();
    this.createGroupCharacters();
    this.interactionSystem = new InteractionSystem();
    this.createMapPortals();
    this.createQuestProps();
    createWorldDepthLayer(this, this.groundTexture ? [this.groundTexture] : []);

    this.hud = new TownHud(this);
    this.hud.setStatus("MARKTPLATZ  •  Sprich mit Rudi");
    this.dialogBox = new DialogBox(this);
    this.councilOverlay = new CouncilSeatsOverlay(this);
    this.unlockOverlay = new UnlockOverlay(this);
    this.journal = new JournalMenu(this);
    this.registerInteractions();
    this.configureKeys();
    this.restoreRunState();
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.fadeIn(240, 59, 49, 82);
  }

  update(_time: number, delta: number): void {
    this.syncCollectibleVisibility();
    if (this.mayorLabel && this.mayor) {
      const mayorIsPresent = this.mayor.visible && !gameState.current.flags.mayorFirstMeetingComplete;
      this.mayorLabel.setPosition(this.mayor.x, this.mayor.y - 46).setVisible(mayorIsPresent);
    }
    this.updateRudiCompanion(delta);
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
    if (!this.dialogBox.isOpen && !this.unlockOverlay.isOpen && Phaser.Input.Keyboard.JustDown(this.menuKey)) {
      this.player.updateMovement(false);
      this.journal.open();
      return;
    }
    if (this.dialogBox.isOpen) {
      this.player.updateMovement(false);
      this.hud.setPrompt("");
      this.handleDialogueInput();
      return;
    }
    if (this.unlockOverlay.isOpen) {
      this.player.updateMovement(false);
      this.hud.setPrompt("");
      if (this.consumePrimaryAction()) {
        this.unlockOverlay.close();
      }
      return;
    }

    this.player.updateMovement(true);
    const prompt = this.interactionSystem.update(this.player);
    this.hud.setPrompt(prompt);
    if (this.consumePrimaryAction()) {
      this.interactionSystem.interact();
    }
  }

  private createStoryCharacters(): void {
    this.rudi = new Npc(this, 480, 318, "rudi", "Rudi");
    this.rudiLabel = this.createNameLabel(this.rudi, "Rudi", -42);

    this.mayor = new Npc(this, 480, 148, "mayor", "der Bürgermeisterin");
    this.mayor.disableBody(true, true);
    this.mayorLabel = this.createNameLabel(this.mayor, "Bürgermeisterin", -46).setVisible(false);
    this.physics.add.collider(this.player, this.rudi);
    this.physics.add.collider(this.player, this.mayor);
  }

  private createGroupCharacters(): void {
    this.createGroupNpc("citizens-forum", 842, 407, "broemmel", "Herr Brömmel");
  }

  private createGroupNpc(
    groupId: GroupId,
    x: number,
    y: number,
    texture: string,
    name: string,
  ): void {
    const npc = new Npc(this, x, y, texture, name);
    this.groupNpcs.set(groupId, npc);
    this.createNameLabel(npc, name, -44);
    const alert = this.add
      .text(x, y - 68, "!", {
        fontFamily: "Courier New",
        fontSize: "26px",
        fontStyle: "bold",
        color: "#d83b3b",
        stroke: "#fff6cf",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(830)
      .setVisible(false);
    this.groupAlerts.set(groupId, alert);
    this.physics.add.collider(this.player, npc);
  }

  private createQuestProps(): void {
    const receiptPositions: ReadonlyArray<readonly [number, number]> = [[360, 375], [620, 530], [1070, 420]];
    receiptPositions.forEach(([x, y], index) => {
      const receipt = this.add.image(x, y, "quest-receipt").setDepth(100 + y).setAngle(index % 2 === 0 ? -5 : 6);
      this.collectibleVisuals.push({
        object: receipt,
        visible: () => gameState.getFavorStatus("budget-hawks") === "active" && !gameState.current.favors.receiptsCollected.includes(`receipt-${index}`),
      });
      this.interactionSystem.register({ id: `receipt-${index}`, displayName: "einen Marktbeleg", object: receipt, range: 62, enabled: () => gameState.getFavorStatus("budget-hawks") === "active" && !gameState.current.favors.receiptsCollected.includes(`receipt-${index}`), interact: () => { if (gameState.collectReceipt(`receipt-${index}`)) { receipt.setVisible(false); this.hud.setQuest(`Belege: ${gameState.current.favors.receiptsCollected.length}/3 gefunden`); } }, prompt: () => "Marktbeleg aufheben" });
    });

    const catPoster = this.add.text(930, 650, "KATZE?", { fontFamily: "Courier New", fontSize: "13px", fontStyle: "bold", color: "#49364c", backgroundColor: "#fff1a8", padding: { x: 6, y: 5 } }).setOrigin(0.5).setDepth(760).setAngle(-3);
    this.collectibleVisuals.push({
      object: catPoster,
      visible: () => gameState.current.sideQuests.missingCat !== "complete",
    });
    this.interactionSystem.register({ id: "cat-poster", displayName: "das Suchplakat", object: catPoster, range: 72, enabled: () => gameState.current.sideQuests.missingCat !== "complete", interact: () => {
      if (gameState.startSideQuest("missingCat")) this.openSimple("Suchplakat", "Minka vermisst: orange, eigensinnig, erschreckend schnell. Zuletzt Richtung Kulturkai gesehen. Belohnung: ewige Dankbarkeit und 75 Punkte.");
      else this.openSimple("Suchplakat", `Minka wurde zuletzt am Kulturkai gesehen. Einfangversuche: ${gameState.current.sideQuests.missingCatEncounters}/3.`);
    }, prompt: () => "Suchplakat lesen" });

    const fountainQuest = this.add.zone(680, 420, 112, 82);
    this.interactionSystem.register({ id: "fountain-quest", displayName: "den Wunschbrunnen", object: fountainQuest, range: 82, enabled: () => gameState.current.sideQuests.fountainCoins !== "complete", interact: () => {
      const status = gameState.current.sideQuests.fountainCoins;
      if (status === "available") { gameState.startSideQuest("fountainCoins"); this.openSimple("Wunschbrunnen", "Drei Glücksmünzen sind aus dem Brunnen gehüpft und liegen nun in Stadt, Park und am Kai. Sehr mobile Währung."); }
      else if (status === "ready" && gameState.completeFountainCoins()) this.openSimple("Wunschbrunnen", "Alle drei Münzen sind zurück. Der Brunnen wünscht sich jetzt weniger Wind. +60 Punkte!");
      else this.openSimple("Wunschbrunnen", `Gefunden: ${gameState.current.sideQuests.coinIds.length}/3 Glücksmünzen.`);
    }, prompt: () => "Wunschbrunnen untersuchen" });

    const townCoin = this.add.image(1080, 610, "quest-coin").setDepth(720);
    this.collectibleVisuals.push({
      object: townCoin,
      visible: () => gameState.current.sideQuests.fountainCoins === "active" && !gameState.current.sideQuests.coinIds.includes("town"),
    });
    this.interactionSystem.register({ id: "coin-town", displayName: "eine Glücksmünze", object: townCoin, range: 58, enabled: () => gameState.current.sideQuests.fountainCoins === "active" && !gameState.current.sideQuests.coinIds.includes("town"), interact: () => { if (gameState.collectFountainCoin("town")) { townCoin.setVisible(false); this.openSimple("Fundstück", "Eine warme Glücksmünze. 1/3 der Brunnenfinanzen sind gerettet."); } }, prompt: () => "Glücksmünze aufheben" });

    this.createTownCitizen(1010, 300, "Oma Ortrud", "Früher hatten Festivals nur eine Bühne. Dafür aber sieben Sorten Kartoffelsalat.", "npc-purple");
    this.createTownCitizen(1210, 610, "Postbote Pepe", "Am Kulturkai wird noch Material erwartet. Ich habe den Lieferschein; wenn die Kisten da sind, bringe ich ihn rüber.", "npc-green");
    this.createTownCitizen(1320, 275, "Samira", "Für die Stände fehlen noch zwei Tische. In der alten Werfthalle stehen welche – wir müssen sie nur rechtzeitig holen.", "npc-red");
  }

  private openSimple(speaker: string, text: string): void {
    this.hud.setHelpVisible(false);
    this.dialogBox.open({ id: `simple-${speaker}-${text.length}`, start: "line", nodes: { line: { id: "line", speaker, text } } }, () => { this.hud.setHelpVisible(true); this.updateQuestHud(); });
  }

  private createTownCitizen(x: number, y: number, name: string, text: string, texture: string): void {
    const citizen = this.add.image(x, y, texture).setOrigin(0.5, 0.8).setDepth(100 + y);
    addNpcCollision(this, this.player, citizen);
    const label = this.createNameLabel(citizen, name, -50);
    this.interactionSystem.register({ id: `citizen-${name}`, displayName: name, object: citizen, range: 72, enabled: () => true, interact: () => this.openSimple(name, text) });
    this.tweens.add({ targets: [citizen, label], y: "-=4", duration: 750 + (x % 300), yoyo: true, repeat: -1, ease: "Sine.InOut" });
  }

  private registerInteractions(): void {
    this.interactionSystem.register({
      id: "rudi",
      displayName: "Rudi",
      object: this.rudi,
      range: 74,
      enabled: () => this.rudiInteractionEnabled,
      interact: () => this.beginRudiMeeting(),
      prompt: () => gameState.current.flags.rudiFirstMeetingComplete ? "Mit Rudi sprechen" : "Rudi ansprechen",
      priority: () => gameState.current.flags.rudiFirstMeetingComplete ? -10 : 10,
    });
    this.interactionSystem.register({
      id: "mayor",
      displayName: "der Bürgermeisterin",
      object: this.mayor,
      range: 78,
      enabled: () => this.mayorInteractionEnabled,
      interact: () => this.beginMayorMeeting(),
    });

    this.registerGroupInteraction("citizens-forum", () =>
      this.beginGroupMeeting("citizens-forum", broemmelFirstMeeting),
    );
  }

  private createMapPortals(): void {
    const west = this.add.zone(28, 370, 48, 110);
    const east = this.add.zone(WORLD_WIDTH - 28, 370, 48, 110);
    const hall = this.add.zone(740, 176, 70, 32);
    const gates = this.add.graphics().setDepth(4);
    gates.fillStyle(0xd8bd84, 1); gates.fillRect(0, 322, 42, 96); gates.fillRect(WORLD_WIDTH - 42, 322, 42, 96);
    gates.fillStyle(0x5b405e, 1); gates.fillRect(0, 322, 42, 8); gates.fillRect(WORLD_WIDTH - 42, 322, 42, 8);
    gates.fillStyle(0x6aa87b, 1); gates.fillTriangle(0, 322, 21, 292, 42, 322); gates.fillTriangle(WORLD_WIDTH - 42, 322, WORLD_WIDTH - 21, 292, WORLD_WIDTH, 322);
    this.interactionSystem.register({ id: "west-gate", displayName: "den Stadtpark", object: west, range: 78, enabled: () => true, interact: () => this.scene.start("ParkScene"), prompt: () => "In den Stadtpark gehen" });
    this.interactionSystem.register({ id: "east-gate", displayName: "den Kulturkai", object: east, range: 78, enabled: () => true, interact: () => this.scene.start("KaiScene"), prompt: () => "Zum Kulturkai gehen" });
    this.interactionSystem.register({ id: "town-hall-door", displayName: "das Rathaus", object: hall, range: 75, enabled: () => true, interact: () => this.scene.start("TownHallScene"), prompt: () => "Rathaus betreten" });
    this.registerShopDoor("bakery", 350, 895, "Bäckerei betreten");
    this.registerShopDoor("florist", 650, 895, "Blumen & Co. betreten");
    this.registerShopDoor("cafe", 1010, 895, "Café Krümel betreten");
    this.registerShopDoor("bookshop", 1300, 895, "Buchhandlung betreten");
    this.add.text(72, 330, "← STADTPARK", { fontFamily: "Courier New", fontSize: "14px", color: "#355548", backgroundColor: "#fff5c9", padding: { x: 5, y: 3 } }).setDepth(10);
    this.add.text(WORLD_WIDTH - 72, 330, "KULTURKAI →", { fontFamily: "Courier New", fontSize: "14px", color: "#355548", backgroundColor: "#fff5c9", padding: { x: 5, y: 3 } }).setOrigin(1, 0).setDepth(10);
    this.add.text(740, 194, "RATHAUS", { fontFamily: "Courier New", fontSize: "12px", color: "#fff8dc", backgroundColor: "#49364c", padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(16);
  }

  private registerShopDoor(shopId: "bakery" | "florist" | "cafe" | "bookshop", x: number, y: number, prompt: string): void {
    const door = this.add.zone(x, y, 52, 52);
    this.interactionSystem.register({
      id: `shop-${shopId}`,
      displayName: prompt,
      object: door,
      range: 72,
      enabled: () => true,
      interact: () => this.scene.start("ShopInteriorScene", {
        shopId,
        returnSpawn: { x, y: y + 78 },
      }),
      prompt: () => prompt,
      priority: 5,
    });
  }

  private registerGroupInteraction(groupId: GroupId, interact: () => void): void {
    const npc = this.requireGroupNpc(groupId);
    this.interactionSystem.register({
      id: groupId,
      displayName: npc.displayName,
      object: npc,
      range: 78,
      enabled: () => this.groupInteractionsEnabled,
      interact,
      prompt: () =>
        gameState.current.quest.negotiationStarted && !gameState.current.quest.groupsNegotiated[groupId]
          ? `Mit ${npc.displayName} verhandeln`
          : gameState.isGroupInterviewed(groupId)
          ? `Noch einmal mit ${npc.displayName} sprechen`
          : `Mit ${npc.displayName} sprechen`,
    });
  }

  private configureKeys(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is required for Festival Panic.");
    }
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
    this.menuUpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.menuDownKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.actionArmed = [this.interactKey, this.spaceKey, this.enterKey].every((key) => key.isUp);
  }

  private handleDialogueInput(): void {
    if (this.dialogBox.hasChoices) {
      this.handleChoiceInput();
      return;
    }
    if (this.consumePrimaryAction()) {
      this.dialogBox.advance();
    }
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

  private handleChoiceInput(): void {
    if (this.choiceKeys.every((key) => key.isUp)) {
      this.choiceArmed = true;
      return;
    }
    if (!this.choiceArmed) {
      return;
    }
    const selectedIndex = this.choiceKeys.findIndex((key) => Phaser.Input.Keyboard.JustDown(key));
    if (selectedIndex >= 0) {
      this.choiceArmed = false;
      this.dialogBox.choose(selectedIndex);
    }
  }

  private beginRudiMeeting(): void {
    if (gameState.current.flags.rudiFirstMeetingComplete) {
      this.openRudiCompanionDialogue();
      return;
    }
    this.rudiInteractionEnabled = false;
    this.hud.setHelpVisible(false);
    this.dialogBox.open(rudiFirstMeeting, () => this.finishRudiMeeting());
  }

  private finishRudiMeeting(): void {
    gameState.completeRudiMeeting();
    this.rudiInteractionEnabled = true;
    this.rudiFollowing = true;
    if (this.rudi.body) {
      this.rudi.body.enable = false;
    }
    this.rudiLabel.setText("Rudi ♥");
    const companionHeart = this.add
      .text(this.rudi.x, this.rudi.y - 34, "♥", {
        fontFamily: "Courier New",
        fontSize: "20px",
        color: "#ef7187",
        stroke: "#fff6cf",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(35);
    this.tweens.add({
      targets: companionHeart,
      y: companionHeart.y - 28,
      alpha: 0,
      duration: 900,
      ease: "Sine.Out",
      onComplete: () => companionHeart.destroy(),
    });
    this.hud.setHelpVisible(true);
    this.hud.setStatus("RUDI GETROFFEN  •  Sprich mit der Bürgermeisterin");
    this.mayor.enableBody(false, 480, 148, true, true);
    this.mayorAlert = this.add
      .text(this.mayor.x, this.mayor.y - 55, "!", {
        fontFamily: "Courier New",
        fontSize: "30px",
        fontStyle: "bold",
        color: "#d83b3b",
        stroke: "#fff6cf",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(830);
    this.tweens.add({
      targets: [this.mayor, this.mayorAlert],
      x: "+=86",
      y: "+=154",
      duration: 880,
      ease: "Sine.Out",
      onUpdate: () =>
        setDepthIfChanged(
          this.mayor.setAngle(Math.sin(this.time.now / 55) * 4),
          100 + Math.round(this.mayor.y),
        ),
      onComplete: () => {
        this.mayor.setAngle(0);
        this.mayor.refreshBody();
        this.mayorLabel.setPosition(this.mayor.x, this.mayor.y - 46).setVisible(true);
        this.mayorInteractionEnabled = true;
        if (this.mayorAlert) {
          this.tweens.add({
            targets: this.mayorAlert,
            y: "-=10",
            duration: 360,
            yoyo: true,
            repeat: -1,
          });
        }
      },
    });
  }

  private openRudiCompanionDialogue(): void {
    const conversationIndex = gameState.recordRudiConversation();
    this.hud.setHelpVisible(false);
    this.dialogBox.open(
      createRudiCompanionDialogue(gameState.current, conversationIndex, "market"),
      () => {
        this.hud.setHelpVisible(true);
        this.updateQuestHud();
      },
    );
  }

  private beginMayorMeeting(): void {
    this.mayorInteractionEnabled = false;
    if (this.mayorAlert) {
      this.tweens.killTweensOf(this.mayorAlert);
      this.mayorAlert.destroy();
      this.mayorAlert = undefined;
    }
    this.hud.setHelpVisible(false);
    this.councilOverlay.show();
    this.dialogBox.open(mayorFirstMeeting, () => this.finishMayorMeeting());
  }

  private finishMayorMeeting(): void {
    gameState.completeMayorMeeting();
    this.councilOverlay.hide();
    this.groupInteractionsEnabled = true;
    this.removeMayorFromTown();
    this.hud.setHelpVisible(true);
    this.setGroupAlertsVisible(true);
    this.updateQuestHud();
    this.updateMainQuestStatus();
  }

  private beginGroupMeeting(groupId: GroupId, firstMeeting: DialogueScript): void {
    this.hud.setHelpVisible(false);
    if (gameState.current.quest.negotiationStarted) {
      this.beginNegotiation(groupId);
      return;
    }
    if (gameState.isGroupInterviewed(groupId)) {
      this.dialogBox.open(groupFollowUps[groupId], () => this.hud.setHelpVisible(true));
      return;
    }
    this.dialogBox.open(firstMeeting, () => this.finishGroupInterview(groupId));
  }

  private beginNegotiation(groupId: GroupId): void {
    if (gameState.current.quest.groupsNegotiated[groupId]) {
      this.dialogBox.open(groupFollowUps[groupId], () => this.hud.setHelpVisible(true));
      return;
    }
    if (gameState.current.quest.negotiationTokensRemaining <= 0) {
      this.openSimple("Rudi", "Unsere drei Vereinbarungen stehen. Der Planungstisch wartet im Abstimmungssaal im ersten Stock des Rathauses.");
      return;
    }
    this.negotiationCard = undefined;
    this.negotiationSubChoice = undefined;
    this.dialogBox.open(createNegotiationDialogue(groupId), () => this.finishNegotiation(groupId), (choiceId) => {
      if (choiceId.startsWith("card:")) this.negotiationCard = choiceId.slice(5) as ArgumentCardId;
      if (choiceId.startsWith("mia:")) this.negotiationSubChoice = choiceId;
    });
  }

  private finishNegotiation(groupId: GroupId): void {
    if (!this.negotiationCard) {
      this.hud.setHelpVisible(true);
      return;
    }
    const outcome = resolveNegotiation(groupId, this.negotiationCard, this.negotiationSubChoice);
    if (!gameState.completeNegotiation(groupId, outcome)) {
      this.hud.setHelpVisible(true);
      return;
    }
    this.groupAlerts.get(groupId)?.setVisible(false);
    const remaining = gameState.current.quest.negotiationTokensRemaining;
    this.unlockOverlay.show({ eyebrow: outcome.flag ? "KOMPROMISS FREIGESCHALTET" : "GESPRÄCH BEENDET", title: outcome.title, description: outcome.description, footer: `+${outcome.points} PUNKTE  •  ${remaining} GESPRÄCHSMARKEN ÜBRIG` }, () => {
      if (remaining === 0) {
        this.dialogBox.open(negotiationsCompleteDialogue, () => {
          this.hud.setHelpVisible(true);
          this.hud.setStatus("3/3 VERHANDLUNGEN  •  ZUM PLANUNGSTISCH IM RATHAUS");
          this.updateQuestHud();
        });
      } else {
        this.hud.setHelpVisible(true);
        this.updateQuestHud();
        this.hud.setStatus(`VERHANDLE!  •  ${remaining}/3 GESPRÄCHSMARKEN`);
      }
    });
  }

  private restoreRunState(): void {
    const state = gameState.current;
    if (!state.flags.rudiFirstMeetingComplete) return;
    this.rudiInteractionEnabled = true;
    this.rudiFollowing = true;
    if (this.rudi.body) this.rudi.body.enable = false;
    this.rudiLabel.setText("Rudi ♥");
    if (!state.flags.mayorFirstMeetingComplete) {
      this.mayor.enableBody(false, 566, 302, true, true);
      this.mayor.setDepth(402);
      this.mayorLabel.setPosition(566, 256).setVisible(true);
      this.mayorInteractionEnabled = true;
      this.hud.setStatus("RUDI GETROFFEN  •  Sprich mit der Bürgermeisterin");
      return;
    }
    this.removeMayorFromTown();
    this.groupInteractionsEnabled = true;
    this.setGroupAlertsVisible(true);
    this.updateQuestHud();
    if (state.quest.negotiationStarted) {
      this.hud.setStatus(state.quest.negotiationTokensRemaining === 0
        ? "3/3 VERHANDLUNGEN  •  ZUM PLANUNGSTISCH IM RATHAUS"
        : `VERHANDLE!  •  ${state.quest.negotiationTokensRemaining}/3 GESPRÄCHSMARKEN`);
    } else {
      this.updateMainQuestStatus();
    }
  }

  private removeMayorFromTown(): void {
    this.mayorInteractionEnabled = false;
    this.tweens.killTweensOf(this.mayor);
    this.mayor.disableBody(true, true);
    this.mayorLabel.setVisible(false);
    if (this.mayorAlert) {
      this.tweens.killTweensOf(this.mayorAlert);
      this.mayorAlert.destroy();
      this.mayorAlert = undefined;
    }
  }

  private finishGroupInterview(groupId: GroupId): void {
    const cardId = GROUP_CARD[groupId];
    if (!gameState.completeGroupInterview(groupId, cardId)) {
      this.hud.setHelpVisible(true);
      return;
    }
    this.groupAlerts.get(groupId)?.setVisible(false);
    this.updateQuestHud();
    const card = ARGUMENT_CARDS[cardId];
    const { groupsInterviewed, groupsTotal } = gameState.current.quest;
    this.unlockOverlay.show(
      {
        eyebrow: "ARGUMENT FREIGESCHALTET",
        title: card.title,
        description: card.description,
        footer: `+100 PUNKTE  •  QUEST ${groupsInterviewed}/${groupsTotal}`,
      },
      () => this.afterArgumentUnlocked(),
    );
  }

  private afterArgumentUnlocked(): void {
    this.hud.setHelpVisible(true);
    if (gameState.current.quest.groupsInterviewed === gameState.current.quest.groupsTotal) {
      this.hud.setStatus("4/4 ARGUMENTE  •  ZUM VERHANDLUNGSSAAL IM RATHAUS");
      this.updateQuestHud();
      return;
    }
    this.updateMainQuestStatus();
  }

  private updateMainQuestStatus(): void {
    const { groupsInterviewed, groupsTotal } = gameState.current.quest;
    if (groupsInterviewed === groupsTotal && !gameState.current.flags.firstDraftSaved) {
      this.hud.setStatus("4/4 ARGUMENTE  •  ZUM VERHANDLUNGSSAAL IM RATHAUS");
      return;
    }
    if (gameState.current.quest.negotiationStarted && gameState.current.quest.negotiationTokensRemaining === 0) {
      this.hud.setStatus("3/3 VERHANDLUNGEN  •  ZUM PLANUNGSTISCH IM RATHAUS");
      return;
    }
    this.hud.setStatus(
      `HAUPTQUEST  •  RETTE DAS SOMMERFEST  •  ${groupsInterviewed}/${groupsTotal} GRUPPEN BEFRAGT`,
    );
  }

  private updateQuestHud(): void {
    const { argumentCards, groupsInterviewed, groupsTotal } = gameState.current.quest;
    const cardLines = argumentCards.map((id) => `✓ ${ARGUMENT_CARDS[id].title}`).join("\n");
    this.hud.setQuest(
      `PUNKTE: ${gameState.current.score}  •  QUEST: ${groupsInterviewed}/${groupsTotal}\n` +
        `ARGUMENTKARTEN\n${cardLines || "— noch keine —"}\n` +
        `ORTE: Brömmel · Markt  |  Mia · Kai  |  Nora · Park  |  Centner · Rathaus` +
        (groupsInterviewed === groupsTotal && !gameState.current.flags.firstDraftSaved ? "\nNÄCHSTES ZIEL: Rathaus · 1. Stock · Planungstisch" : "") +
        (gameState.current.quest.negotiationStarted && gameState.current.quest.negotiationTokensRemaining === 0 ? "\nNÄCHSTES ZIEL: Rathaus · 1. Stock · finaler Plan" : ""),
    );
  }

  private setGroupAlertsVisible(visible: boolean): void {
    this.groupAlerts.forEach((alert, groupId) => {
      const pending = gameState.current.quest.negotiationStarted
        ? !gameState.current.quest.groupsNegotiated[groupId] && gameState.current.quest.negotiationTokensRemaining > 0
        : !gameState.isGroupInterviewed(groupId);
      alert.setVisible(visible && pending);
    });
  }

  private createNameLabel(
    object: Phaser.GameObjects.Components.Transform,
    name: string,
    offsetY: number,
  ): Phaser.GameObjects.Text {
    return this.add
      .text(object.x, object.y + offsetY, name, {
        fontFamily: "Courier New",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#28304b",
        backgroundColor: "#fff5c9",
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(820);
  }

  private updateRudiCompanion(delta: number): void {
    if (!this.rudiFollowing || !this.player?.active || !this.rudi?.active) {
      return;
    }

    const facing = this.player.facingDirection;
    const desiredX = Phaser.Math.Clamp(
      this.player.x - facing.x * 50 + facing.y * 22,
      28,
      WORLD_WIDTH - 28,
    );
    const desiredY = Phaser.Math.Clamp(
      this.player.y - facing.y * 50 - facing.x * 14,
      35,
      WORLD_HEIGHT - 28,
    );
    const resolvedTarget = this.resolveCompanionTarget(desiredX, desiredY);
    const targetX = resolvedTarget.x;
    const targetY = resolvedTarget.y;
    const distance = Phaser.Math.Distance.Between(this.rudi.x, this.rudi.y, targetX, targetY);

    if (distance > 260) {
      this.rudi.setFlipX(targetX > this.rudi.x).setPosition(targetX, targetY);
    } else if (distance > 8) {
      const step = Math.min(distance, 132 * (delta / 1000));
      const angle = Phaser.Math.Angle.Between(this.rudi.x, this.rudi.y, targetX, targetY);
      this.rudi.x += Math.cos(angle) * step;
      this.rudi.y += Math.sin(angle) * step;
      if (Math.abs(targetX - this.rudi.x) > 2) {
        this.rudi.setFlipX(targetX > this.rudi.x);
      }
      this.rudi.setScale(1, 1 + Math.sin(this.time.now / 85) * 0.055);
    } else {
      this.rudi.setScale(1);
    }

    setDepthIfChanged(this.rudi, 100 + Math.round(this.rudi.y));
    this.rudiLabel.setPosition(this.rudi.x, this.rudi.y - 42);
  }

  private syncCollectibleVisibility(): void {
    this.collectibleVisuals.forEach(({ object, visible }) => object.setVisible(visible()));
  }

  private resolveCompanionTarget(targetX: number, targetY: number): Phaser.Math.Vector2 {
    const resolved = this.resolvedCompanionTarget.set(targetX, targetY);
    const padding = 24;

    this.companionObstacleBounds.forEach((bounds) => {
      const left = bounds.left - padding;
      const right = bounds.right + padding;
      const top = bounds.top - padding;
      const bottom = bounds.bottom + padding;
      if (resolved.x <= left || resolved.x >= right || resolved.y <= top || resolved.y >= bottom) {
        return;
      }

      const leftDistance = Math.abs(resolved.x - left);
      const rightDistance = Math.abs(right - resolved.x);
      const topDistance = Math.abs(resolved.y - top);
      const bottomDistance = Math.abs(bottom - resolved.y);
      const nearestDistance = Math.min(leftDistance, rightDistance, topDistance, bottomDistance);
      if (nearestDistance === leftDistance) resolved.x = left;
      else if (nearestDistance === rightDistance) resolved.x = right;
      else if (nearestDistance === topDistance) resolved.y = top;
      else resolved.y = bottom;
    });

    resolved.x = Phaser.Math.Clamp(resolved.x, 28, WORLD_WIDTH - 28);
    resolved.y = Phaser.Math.Clamp(resolved.y, 35, WORLD_HEIGHT - 28);
    return resolved;
  }

  private requireGroupNpc(groupId: GroupId): Npc {
    const npc = this.groupNpcs.get(groupId);
    if (!npc) {
      throw new Error(`Missing group NPC: ${groupId}`);
    }
    return npc;
  }

  private drawTileWorld(): void {
    const ground = this.add
      .image(0, 0, TOWN_GROUND_KEY)
      .setOrigin(0)
      .setDepth(-1000);
    this.groundTexture = ground;
    const paving = this.add.graphics().setDepth(1);
    paving.lineStyle(3, 0xb69d68, 0.72);
    paving.lineBetween(160, 160, 1440, 160);
    paving.lineBetween(160, 160, 160, WORLD_HEIGHT);
    paving.lineBetween(1440, 160, 1440, WORLD_HEIGHT);
    paving.lineStyle(2, 0xf5e7bb, 0.7);
    paving.lineBetween(164, 165, 1436, 165);
    paving.fillStyle(0xbca06b, 0.62);
    for (let index = 0; index < 16; index += 1) {
      const angle = (Math.PI * 2 * index) / 16;
      paving.fillRoundedRect(676 + Math.cos(angle) * 76, 404 + Math.sin(angle) * 53, 9, 6, 2);
    }
    paving.lineStyle(3, 0xc0a56c, 0.85);
    ([[382, 344], [570, 344], [990, 408], [1178, 344], [430, 676]] as const).forEach(([x, y]) => {
      paving.strokeRoundedRect(x, y, 24, 13, 3);
      paving.lineBetween(x + 5, y + 3, x + 5, y + 10);
      paving.lineBetween(x + 11, y + 3, x + 11, y + 10);
      paving.lineBetween(x + 17, y + 3, x + 17, y + 10);
    });
    paving.lineStyle(1, 0xb59e70, 0.75);
    ([[340, 525], [590, 612], [1045, 532], [1320, 288]] as const).forEach(([x, y], index) => {
      paving.lineBetween(x, y, x + 12 + index * 2, y - 5);
      paving.lineBetween(x + 11 + index * 2, y - 5, x + 18 + index, y + 3);
    });
    for (let column = 1; column < 49; column += 2) {
      const treeTexture = column % 10 === 1 ? "tree-flowering" : column % 6 === 1 ? "tree-birch" : "tree";
      const lowerTreeTexture = column % 10 === 7 ? "tree-flowering" : column % 8 === 3 ? "tree-birch" : "tree";
      this.add.image(column * TILE_SIZE, 26, treeTexture).setOrigin(0.5, 0.8).setDepth(126);
      if (column < 5 || column > 45) {
        this.add
          .image(column * TILE_SIZE, WORLD_HEIGHT - 8, lowerTreeTexture)
          .setOrigin(0.5, 0.8)
          .setDepth(100 + WORLD_HEIGHT - 8);
      }
    }
  }

  private createTownLandmarks(): void {
    this.createTownHall();
    this.createFestivalBanner();
    this.createStage();
    this.createBroemmelHouse();
    this.createBakery();
    this.createFlowerShop();
    this.createAdditionalShops();
    this.createTownHallFoyer();
    this.createNoraCorner();
    this.createTownDecorations();
    this.createAmbientTownMotion();

    const fountain = this.add.graphics().setDepth(8);
    fountain.fillStyle(0x3b3152, 0.2);
    fountain.fillEllipse(680, 429, 126, 25);
    fountain.fillStyle(0x7894a3, 1);
    fountain.fillEllipse(680, 410, 122, 59);
    fountain.fillStyle(0xd8e4d5, 1);
    fountain.fillEllipse(680, 403, 105, 45);
    fountain.fillStyle(0x68c6d6, 1);
    fountain.fillEllipse(680, 402, 91, 35);
    fountain.fillStyle(0x9ce8e7, 1);
    fountain.fillEllipse(662, 397, 22, 7);
    fountain.fillStyle(0xd8e4d5, 1);
    fountain.fillRoundedRect(669, 365, 22, 43, 5);
    fountain.fillStyle(0x91dbe3, 1);
    fountain.fillRect(676, 344, 8, 30);
    fountain.fillTriangle(664, 361, 680, 342, 696, 361);
    fountain.fillStyle(0xffffff, 0.65);
    fountain.fillCircle(674, 352, 3);
    fountain.fillCircle(687, 358, 2);
    this.createFountainAnimation();
    this.addStaticCollider(680, 407, 114, 48);
    this.createPlanter(270, 470);
  }

  private createTownHall(): void {
    const hall = this.add.graphics().setDepth(255);
    hall.fillStyle(0x3b3152, 0.18);
    hall.fillRoundedRect(340, 43, 280, 126, 8);
    hall.fillStyle(0xf3e4bd, 1);
    hall.fillRect(352, 35, 256, 120);
    this.addWallTexture(hall, 352, 35, 256, 120, 0xd5bf91, 1);
    hall.fillStyle(0xbc5f50, 1);
    hall.fillTriangle(330, 52, 480, 0, 630, 52);
    hall.fillStyle(0xe18468, 1);
    hall.fillTriangle(352, 48, 480, 7, 608, 48);
    this.addRoofTexture(hall, 480, 7, 128, 48, 0xf3aa87);
    hall.fillStyle(0x54798b, 1);
    hall.fillRect(385, 75, 36, 35);
    hall.fillRect(539, 75, 36, 35);
    hall.fillStyle(0xbce5dc, 1);
    hall.fillRect(390, 80, 26, 25);
    hall.fillRect(544, 80, 26, 25);
    hall.lineStyle(2, 0x54798b, 1);
    hall.lineBetween(403, 79, 403, 106);
    hall.lineBetween(557, 79, 557, 106);
    hall.fillStyle(0x65463b, 1);
    hall.fillRect(456, 101, 48, 54);
    hall.fillStyle(0xf4c95d, 1);
    hall.fillCircle(494, 128, 3);
    hall.fillStyle(0x5ba666, 1);
    hall.fillRect(382, 108, 42, 7);
    hall.fillRect(536, 108, 42, 7);
    hall.fillStyle(0xed7892, 1);
    hall.fillCircle(392, 108, 3);
    hall.fillCircle(410, 108, 3);
    hall.fillCircle(546, 108, 3);
    hall.fillCircle(565, 108, 3);
    hall.fillStyle(0x3b3152, 1);
    hall.fillRect(405, 41, 150, 28);
    this.add
      .text(480, 55, "RATHAUS", {
        fontFamily: "Courier New",
        fontSize: "19px",
        fontStyle: "bold",
        color: "#fff8dc",
      })
      .setOrigin(0.5)
      .setDepth(257);
    this.addStaticCollider(480, 88, 270, 126);
  }

  private createFountainAnimation(): void {
    [0, 1, 2].forEach((index) => {
      const ripple = this.add
        .ellipse(680, 402, 30, 11, 0xc8fbf1, 0)
        .setStrokeStyle(2, 0xdffff7, 0.72)
        .setDepth(9)
        .setScale(0.45);
      this.tweens.add({
        targets: ripple,
        scaleX: 2.7,
        scaleY: 2.2,
        alpha: { from: 0.78, to: 0 },
        duration: 1500,
        delay: index * 500,
        repeat: -1,
        repeatDelay: 20,
        ease: "Sine.Out",
      });
    });
    [674, 686].forEach((x, index) => {
      const drop = this.add.circle(x, 353 + index * 3, 3, 0xdffff7, 0.9).setDepth(10);
      this.tweens.add({
        targets: drop,
        y: drop.y - 19 - index * 4,
        x: drop.x + (index === 0 ? -5 : 5),
        alpha: 0.15,
        duration: 620 + index * 90,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    });
  }

  private createFestivalBanner(): void {
    const banner = this.add.container(480, 225).setDepth(9);
    const board = this.add.rectangle(0, 0, 310, 58, 0xffe17a).setStrokeStyle(4, 0x49364c);
    const title = this.add
      .text(0, -7, "SOMMERFEST MORGEN!", {
        fontFamily: "Courier New",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#49364c",
      })
      .setOrigin(0.5);
    const cancelled = this.add
      .text(72, 23, "ABGESAGT?!", {
        fontFamily: "Courier New",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: "#d94444",
        padding: { x: 7, y: 3 },
      })
      .setOrigin(0.5)
      .setAngle(-7);
    banner.add([board, title, cancelled]);
  }

  private createStage(): void {
    const stage = this.add.graphics().setDepth(7);
    stage.fillStyle(0x3b3152, 0.18);
    stage.fillEllipse(156, 258, 220, 23);
    stage.fillStyle(0x39364e, 1);
    stage.fillRect(62, 165, 188, 82);
    stage.fillStyle(0x5d3d68, 1);
    stage.fillTriangle(62, 165, 92, 165, 62, 225);
    stage.fillTriangle(250, 165, 220, 165, 250, 225);
    stage.fillStyle(0x6e6588, 1);
    stage.fillRect(48, 238, 216, 18);
    stage.lineStyle(5, 0x5b405e, 1);
    stage.lineBetween(62, 165, 62, 252);
    stage.lineBetween(250, 165, 250, 252);
    stage.lineBetween(62, 165, 250, 165);
    [80, 118, 156, 194, 232].forEach((x, index) => {
      stage.fillStyle(index % 2 === 0 ? 0xffd45d : 0xef7187, 1);
      stage.fillCircle(x, 170, 4);
    });
    this.add
      .text(156, 199, "BÜHNE\nAUS", {
        fontFamily: "Courier New",
        fontSize: "18px",
        fontStyle: "bold",
        align: "center",
        color: "#9a96aa",
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.addStaticCollider(156, 205, 210, 92);
  }

  private createBroemmelHouse(): void {
    const house = this.add.graphics().setDepth(465);
    house.fillStyle(0x3b3152, 0.16);
    house.fillRoundedRect(777, 260, 166, 116, 7);
    house.fillStyle(0xe6c9a1, 1);
    house.fillRect(785, 260, 150, 105);
    this.addWallTexture(house, 785, 260, 150, 105, 0xc9a87e, 4);
    house.fillStyle(0x9f584d, 1);
    house.fillTriangle(770, 270, 860, 215, 950, 270);
    this.addRoofTexture(house, 860, 215, 90, 270, 0xc87868);
    house.fillStyle(0x5e4338, 1);
    house.fillRect(833, 315, 38, 50);
    house.fillStyle(0x72a8bb, 1);
    house.fillRect(799, 289, 26, 27);
    house.fillRect(881, 289, 26, 27);
    house.fillStyle(0xfff1a8, 0.8);
    house.fillRect(803, 293, 18, 19);
    house.fillRect(885, 293, 18, 19);
    house.fillStyle(0x5b9b62, 1);
    house.fillRect(797, 317, 30, 6);
    house.fillRect(879, 317, 30, 6);
    house.fillStyle(0xed7892, 1);
    house.fillCircle(806, 317, 3);
    house.fillCircle(817, 317, 3);
    house.fillCircle(888, 317, 3);
    house.fillCircle(899, 317, 3);
    this.add
      .text(860, 273, "WOHNHAUS", {
        fontFamily: "Courier New",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#594351",
      })
      .setOrigin(0.5)
      .setDepth(467);
    this.addStaticCollider(860, 307, 164, 116);
  }

  private createBakery(): void {
    this.createShopBuilding(350, 850, "BÄCKEREI BEA", 0xf4d3a6, 0xb76558, 0xe46f6b);
  }

  private createFlowerShop(): void {
    this.createShopBuilding(650, 850, "BLUMEN & CO.", 0xcfe1b1, 0x4d8f68, 0x78bd82);
  }

  private createAdditionalShops(): void {
    this.createShopBuilding(1010, 850, "CAFÉ KRÜMEL", 0xf2d2aa, 0x9f584d, 0xf0c65d);
    this.createShopBuilding(1300, 850, "BÜCHERBOGEN", 0xc9d7e7, 0x5d648d, 0x7d75ad);
  }

  private createTownHallFoyer(): void {
    const foyer = this.add.graphics().setDepth(270);
    foyer.fillStyle(0x3b3152, 0.18); foyer.fillRoundedRect(625, 42, 228, 138, 8);
    foyer.fillStyle(0xe7d2ab, 1); foyer.fillRect(632, 51, 214, 119);
    this.addWallTexture(foyer, 632, 51, 214, 119, 0xc9ad82, 13);
    foyer.fillStyle(0x7b5269, 1); foyer.fillTriangle(620, 58, 739, 8, 858, 58);
    foyer.fillStyle(0x9c6b72, 1); foyer.fillTriangle(642, 54, 739, 17, 836, 54);
    this.addRoofTexture(foyer, 739, 17, 97, 54, 0xc18a8e);
    foyer.fillStyle(0x3b3152, 1); foyer.fillRect(660, 48, 158, 29);
    foyer.fillStyle(0xb99368, 1); foyer.fillRect(646, 76, 16, 94); foyer.fillRect(816, 76, 16, 94);
    foyer.fillStyle(0x82b7bd, 1); foyer.fillRect(670, 91, 39, 37); foyer.fillRect(770, 91, 39, 37);
    foyer.fillStyle(0xc6ece2, 1); foyer.fillRect(676, 97, 27, 25); foyer.fillRect(776, 97, 27, 25);
    foyer.lineStyle(2, 0x52778a, 1); foyer.lineBetween(689, 94, 689, 125); foyer.lineBetween(789, 94, 789, 125);
    foyer.fillStyle(0x65463b, 1); foyer.fillRect(713, 119, 52, 51);
    foyer.fillStyle(0xf4c95d, 1); foyer.fillCircle(755, 144, 3);
    foyer.fillStyle(0x5b9b62, 1); foyer.fillRect(672, 128, 35, 7); foyer.fillRect(772, 128, 35, 7);
    foyer.fillStyle(0xed7892, 1); foyer.fillCircle(681, 128, 3); foyer.fillCircle(698, 128, 3); foyer.fillCircle(781, 128, 3); foyer.fillCircle(798, 128, 3);
    this.add
      .text(739, 62, "RATHAUS · FOYER", {
        fontFamily: "Courier New",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#fff8dc",
      })
      .setOrigin(0.5)
      .setDepth(272);
    this.addStaticCollider(739, 68, 224, 62);
    this.addStaticCollider(650, 124, 18, 92);
    this.addStaticCollider(828, 124, 18, 92);
  }

  private createTownDecorations(): void {
    const garland = this.add.graphics().setDepth(5);
    garland.lineStyle(2, 0x66506c, 0.85);
    garland.lineBetween(278, 292, 650, 292);
    const flagColors = [0xf06c68, 0xf5cc57, 0x62bfa0, 0x9b78cf];
    for (let x = 294, index = 0; x < 642; x += 29, index += 1) {
      garland.fillStyle(flagColors[index % flagColors.length] ?? 0xf06c68, 1);
      garland.fillTriangle(x, 293, x + 18, 293, x + 9, 307);
    }

    const flowerPositions = [
      [72, 126],
      [284, 98],
      [905, 120],
      [82, 458],
      [930, 610],
      [92, 652],
      [365, 662],
      [895, 655],
    ] as const;
    flowerPositions.forEach(([x, y], index) =>
      this.add.image(x, y, index % 3 === 1 ? "flower-patch-blue" : "flower-patch").setDepth(3).setAngle((x + y) % 7 - 3),
    );

    const bushPositions = [
      [28, 174],
      [29, 420],
      [932, 170],
      [790, 456],
      [290, 675],
      [610, 675],
    ] as const;
    bushPositions.forEach(([x, y]) => {
      this.add.image(x, y, "bush").setDepth(100 + y);
      this.addStaticCollider(x, y + 4, 34, 18);
    });

    this.add.image(326, 424, "bench").setDepth(524);
    this.add.image(570, 615, "bench").setDepth(715).setFlipX(true);
    this.addStaticCollider(326, 423, 50, 20);
    this.addStaticCollider(570, 614, 50, 20);

    ([
      [292, 330],
      [625, 329],
      [525, 590],
      [786, 527],
    ] as const).forEach(([x, y]) => {
      this.add.image(x, y, "lamp").setOrigin(0.5, 0.9).setDepth(100 + y);
      this.addStaticCollider(x, y - 2, 18, 24);
    });

    const stageBalloons = this.add
      .image(286, 190, "balloons")
      .setOrigin(0.5, 1)
      .setDepth(290)
      .setAngle(-4);
    const houseBalloons = this.add
      .image(889, 214, "balloons")
      .setOrigin(0.5, 1)
      .setDepth(314)
      .setAngle(5);
    this.tweens.add({
      targets: stageBalloons,
      angle: 4,
      y: 184,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
    this.tweens.add({
      targets: houseBalloons,
      angle: -4,
      y: 208,
      duration: 1650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
    this.createSnackStall(110, 585);

    // The enlarged eastern district gives the square a real city edge to explore.
    this.createMiniBuilding(1110, 170, "POST", 0xe7c48d, 0xb76558);
    this.createMiniBuilding(1290, 500, "WERKSTATT", 0xc5dfc4, 0x5c8d9c);
    this.createMiniBuilding(1450, 190, "KIOSK", 0xf0d29b, 0xd85f8c);
    [1040, 1190, 1340, 1490].forEach((x, index) => {
      const texture = index === 0 ? "tree-birch" : index === 2 ? "tree-flowering" : "bush";
      this.add.image(x, 680, texture).setOrigin(0.5, 0.8).setDepth(780);
      this.addStaticCollider(x, 675, texture === "bush" ? 34 : 32, texture === "bush" ? 18 : 28);
    });

    this.add.image(273, 247, "crate").setDepth(347).setAngle(-3);
    this.add.image(294, 251, "barrel").setDepth(351);
    this.add.image(770, 367, "mailbox").setDepth(467);
    this.add.image(805, 391, "bike").setDepth(491).setAngle(-2);
    this.add.image(438, 452, "signpost").setOrigin(0.5, 0.9).setDepth(552);
    this.add.image(194, 126, "cafe-table").setDepth(226);
    this.addStaticCollider(438, 453, 28, 27);
    this.addStaticCollider(194, 126, 38, 25);
    this.addStaticCollider(273, 250, 27, 20);
    this.addStaticCollider(297, 252, 22, 22);
    this.addStaticCollider(770, 368, 21, 26);
    this.addStaticCollider(805, 394, 42, 22);
    const townCat = faceHorizontalMotion(
      this.add.image(774, 578, "cat").setDepth(678).setVisible(gameState.current.sideQuests.missingCat === "complete"),
      22,
    );
    this.townCat = townCat;
    this.tweens.add({
      targets: townCat,
      x: 796,
      duration: 1900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
      onYoyo: () => faceHorizontalMotion(townCat, -22),
      onRepeat: () => faceHorizontalMotion(townCat, 22),
    });

    ([
      [335, 370],
      [598, 470],
      [855, 570],
    ] as const).forEach(([x, y], index) => {
      const sparkle = this.add
        .text(x, y, index % 2 === 0 ? "✦" : "•", {
          fontFamily: "Courier New",
          fontSize: index % 2 === 0 ? "15px" : "22px",
          color: index % 2 === 0 ? "#fff1a8" : "#f17b99",
        })
        .setDepth(14)
        .setAlpha(0.65);
      this.tweens.add({
        targets: sparkle,
        y: y - 8,
        alpha: 0.2,
        duration: 900 + index * 170,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    });
  }

  private createMiniBuilding(x: number, y: number, label: string, wall: number, roof: number): void {
    const building = this.add.graphics().setDepth(100 + y + 54);
    building.fillStyle(0x3b3152, 0.17); building.fillRoundedRect(x - 70, y - 50, 140, 106, 7);
    building.fillStyle(wall, 1); building.fillRect(x - 63, y - 48, 126, 98);
    this.addWallTexture(building, x - 63, y - 48, 126, 98, 0x9f8f72, Math.round(x / 10));
    building.fillStyle(roof, 1); building.fillTriangle(x - 76, y - 40, x, y - 92, x + 76, y - 40);
    this.addRoofTexture(building, x, y - 92, 76, y - 40, 0xf1c29a);
    building.fillStyle(0x49364c, 0.38); building.fillRect(x - 76, y - 42, 152, 5);
    building.fillStyle(0x68483b, 1); building.fillRect(x - 18, y + 2, 36, 48);
    building.fillStyle(0x8a6048, 1); building.fillRect(x - 13, y + 7, 26, 43);
    building.fillStyle(0x51394a, 1); building.fillRect(x - 10, y + 14, 20, 13);
    building.fillStyle(0xf4cd61, 1); building.fillCircle(x + 8, y + 32, 2);
    ([[x - 52, y - 18], [x + 20, y - 18]] as const).forEach(([windowX, windowY]) => {
      building.fillStyle(0x527487, 1); building.fillRect(windowX, windowY, 32, 30);
      building.fillStyle(0xa9dcd6, 1); building.fillRect(windowX + 4, windowY + 4, 24, 21);
      building.fillStyle(0xeaf6d8, 0.72); building.fillRect(windowX + 6, windowY + 6, 8, 6);
      building.lineStyle(2, 0x527487, 1);
      building.lineBetween(windowX + 16, windowY + 3, windowX + 16, windowY + 26);
      building.lineBetween(windowX + 3, windowY + 15, windowX + 29, windowY + 15);
      building.fillStyle(0x6a4d3c, 1); building.fillRect(windowX - 3, windowY + 27, 38, 4);
    });
    building.fillStyle(0x6e4a3c, 1); building.fillRect(x + 38, y - 78, 15, 30);
    building.fillStyle(0xc77a63, 1); building.fillRect(x + 35, y - 80, 21, 6);
    this.add.text(x, y - 54, label, { fontFamily: "Courier New", fontSize: "13px", fontStyle: "bold", color: "#49364c", backgroundColor: "#fff0bd", padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(100 + y + 56);
    this.addStaticCollider(x, y, 136, 112);
  }

  private createShopBuilding(x: number, y: number, label: string, wall: number, roof: number, awning: number): void {
    const shop = this.add.graphics().setDepth(100 + y + 58);
    shop.fillStyle(0x3b3152, 0.18); shop.fillRoundedRect(x - 84, y - 70, 168, 134, 8);
    shop.fillStyle(wall, 1); shop.fillRect(x - 76, y - 68, 152, 122);
    this.addWallTexture(shop, x - 76, y - 68, 152, 122, 0x9f8f72, Math.round(x / 16));
    shop.fillStyle(roof, 1); shop.fillTriangle(x - 92, y - 60, x, y - 118, x + 92, y - 60);
    this.addRoofTexture(shop, x, y - 118, 92, y - 60, 0xf0ba94);
    shop.fillStyle(0x49364c, 0.4); shop.fillRect(x - 92, y - 63, 184, 6);
    shop.fillStyle(0x557b87, 1); shop.fillRect(x - 61, y - 35, 45, 45); shop.fillRect(x + 16, y - 35, 45, 45);
    shop.fillStyle(0xbce7df, 1); shop.fillRect(x - 56, y - 30, 35, 34); shop.fillRect(x + 21, y - 30, 35, 34);
    for (let stripe = 0; stripe < 8; stripe += 1) {
      shop.fillStyle(stripe % 2 === 0 ? awning : 0xffefc5, 1);
      shop.fillRect(x - 72 + stripe * 18, y + 8, 18, 17);
    }
    shop.fillStyle(0x66463a, 1); shop.fillRect(x - 20, y + 24, 40, 30);
    shop.fillStyle(0x8a6048, 1); shop.fillRect(x - 15, y + 29, 30, 25);
    shop.fillStyle(0xffd76b, 1); shop.fillCircle(x + 9, y + 42, 2.5);
    this.add.text(x, y - 49, label, {
      fontFamily: "Courier New",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#49364c",
      backgroundColor: "#fff0bd",
      padding: { x: 5, y: 2 },
    }).setOrigin(0.5).setDepth(100 + y + 60);
    this.addStaticCollider(x, y - 12, 176, 132);
  }

  private createSnackStall(x: number, y: number): void {
    const stall = this.add.graphics().setDepth(100 + y);
    stall.fillStyle(0x3b3152, 0.18);
    stall.fillEllipse(x, y + 34, 126, 16);
    stall.fillStyle(0xf4e4b8, 1);
    stall.fillRoundedRect(x - 56, y - 5, 112, 40, 5);
    stall.fillStyle(0x6f4b3b, 1);
    stall.fillRect(x - 48, y + 29, 8, 31);
    stall.fillRect(x + 40, y + 29, 8, 31);
    for (let index = 0; index < 6; index += 1) {
      stall.fillStyle(index % 2 === 0 ? 0xf06c68 : 0xfff0c0, 1);
      stall.fillRect(x - 60 + index * 20, y - 21, 20, 20);
    }
    stall.fillStyle(0x4a3651, 1);
    stall.fillRoundedRect(x - 51, y + 6, 102, 17, 3);
    this.add
      .text(x, y + 14, "LIMO & WAFFELN", {
        fontFamily: "Courier New",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#fff8dc",
      })
      .setOrigin(0.5)
      .setDepth(101 + y);
    this.addStaticCollider(x, y + 20, 120, 66);
  }

  private createNoraCorner(): void {
    const sign = this.add.graphics().setDepth(674);
    sign.fillStyle(0x49364c, 0.18);
    sign.fillEllipse(722, 582, 72, 10);
    sign.fillStyle(0x6a4d3c, 1);
    sign.fillRect(719, 547, 6, 37);
    sign.fillStyle(0xd8edbe, 1);
    sign.fillRoundedRect(684, 528, 76, 29, 4);
    sign.lineStyle(2, 0x3f7357, 1);
    sign.strokeRoundedRect(684, 528, 76, 29, 4);
    this.add
      .text(722, 542, "SAUBERER\nMARKT", {
        fontFamily: "Courier New",
        fontSize: "10px",
        fontStyle: "bold",
        align: "center",
        color: "#355548",
      })
      .setOrigin(0.5)
      .setDepth(675);
    this.addStaticCollider(722, 558, 38, 42);
  }

  private createPlanter(x: number, y: number): void {
    this.add.image(x, y, "tree").setOrigin(0.5, 0.8).setDepth(100 + y);
    this.addStaticCollider(x, y - 2, 32, 28);
  }

  private createAmbientTownMotion(): void {
    const cloudShadow = this.add.ellipse(-160, 520, 300, 86, 0x355f55, 0.055).setDepth(2).setAngle(-7);
    this.tweens.add({
      targets: cloudShadow,
      x: WORLD_WIDTH + 180,
      y: 455,
      duration: 22000,
      repeat: -1,
      repeatDelay: 4500,
      ease: "Linear",
    });
    const leafColors = [0x72b967, 0xf0c85b, 0xe77b76];
    for (let index = 0; index < 7; index += 1) {
      const startX = 180 + index * 205;
      const startY = 180 + (index % 4) * 135;
      const leaf = this.add.ellipse(startX, startY, 7, 4, leafColors[index % leafColors.length] ?? 0x72b967, 0.72)
        .setDepth(12)
        .setAngle(index * 24);
      this.tweens.add({
        targets: leaf,
        x: startX + 42 + (index % 3) * 18,
        y: startY + 22,
        angle: leaf.angle + 220,
        alpha: { from: 0.72, to: 0.08 },
        duration: 2700 + index * 240,
        delay: index * 720,
        repeat: -1,
        repeatDelay: 5200,
        ease: "Sine.InOut",
      });
    }
  }

  private addWallTexture(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    seed: number,
  ): void {
    graphics.fillStyle(color, 0.34);
    for (let row = 0; row < Math.floor(height / 14); row += 1) {
      const yy = y + 8 + row * 14;
      const offset = (row + seed) % 2 === 0 ? 7 : 18;
      for (let xx = x + offset; xx < x + width - 8; xx += 36) {
        const length = 11 + ((xx + row * 7 + seed) % 9);
        graphics.fillRoundedRect(xx, yy, Math.min(length, x + width - xx - 4), 2, 1);
      }
    }
    graphics.fillStyle(0xffffff, 0.18);
    graphics.fillRect(x + 4, y + 5, 2, Math.max(8, height - 10));
    graphics.fillStyle(0x49364c, 0.12);
    graphics.fillRect(x + width - 5, y + 6, 3, Math.max(8, height - 12));
  }

  private addRoofTexture(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    topY: number,
    halfWidth: number,
    bottomY: number,
    color: number,
  ): void {
    const roofHeight = Math.max(1, bottomY - topY);
    graphics.lineStyle(2, color, 0.72);
    for (let yy = topY + 9; yy < bottomY - 3; yy += 9) {
      const span = halfWidth * ((yy - topY) / roofHeight);
      graphics.lineBetween(centerX - span + 8, yy, centerX + span - 8, yy);
    }
    graphics.lineStyle(2, 0x49364c, 0.16);
    graphics.lineBetween(centerX, topY + 5, centerX, bottomY - 5);
  }

  private addStaticCollider(x: number, y: number, width: number, height: number): void {
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    this.staticObstacles.push(zone);
  }
}
