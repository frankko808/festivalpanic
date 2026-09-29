import Phaser from "phaser";
import { Player } from "../characters/Player";
import { createRudiCompanionDialogue } from "../data/dialogues/rudiCompanion";
import type { DialogueScript } from "../dialogue/types";
import { gameState } from "../state/GameState";
import { InteractionSystem } from "../systems/InteractionSystem";
import { addNpcCollision } from "../systems/addNpcCollision";
import { DialogBox } from "../ui/DialogBox";
import { JournalMenu } from "../ui/JournalMenu";
import { TownHud } from "../ui/TownHud";
import { createWorldDepthLayer } from "../utils/createWorldDepthLayer";
import { setDepthIfChanged } from "../utils/setDepthIfChanged";

type ShopId = "bakery" | "florist" | "cafe" | "bookshop";

interface ShopDefinition {
  title: string;
  owner: string;
  texture: string;
  wall: number;
  accent: number;
  greeting: string;
}

const SHOPS: Readonly<Record<ShopId, ShopDefinition>> = {
  bakery: {
    title: "BÄCKEREI BEA",
    owner: "Bäckerin Bea",
    texture: "npc-red",
    wall: 0xf3d5ae,
    accent: 0xd85f73,
    greeting: "Für das Fest backen wir morgen früh noch einmal frisch. Wenn du einen Picknickkorb abholst, sag bitte Frau Moos Bescheid.",
  },
  florist: {
    title: "BLUMEN & CO.",
    owner: "Flora Feld",
    texture: "npc-green",
    wall: 0xdbe8c5,
    accent: 0x62a875,
    greeting: "Wir binden gerade die Blumen für den Marktplatz. Die kleinen Sträuße halten auch einen langen Festabend durch.",
  },
  cafe: {
    title: "CAFÉ KRÜMEL",
    owner: "Derya Demir",
    texture: "npc-purple",
    wall: 0xf0d1ad,
    accent: 0xb76558,
    greeting: "Für die Helferinnen und Helfer steht hinten Kaffee bereit. Der Kuchen ist noch warm, also sei schnell.",
  },
  bookshop: {
    title: "BÜCHERBOGEN",
    owner: "Niko Noll",
    texture: "npc-clerk",
    wall: 0xd4dfeb,
    accent: 0x666e9b,
    greeting: "Die Plakate für das Fest sind fertig. Nebenbei haben wir ein kleines Regal mit Büchern zur Stadtgeschichte aufgebaut.",
  },
};

const line = (id: string, speaker: string, text: string): DialogueScript => ({
  id,
  start: "line",
  nodes: { line: { id: "line", speaker, text } },
});

export class ShopInteriorScene extends Phaser.Scene {
  private player!: Player;
  private rudi?: Phaser.GameObjects.Image;
  private hud!: TownHud;
  private dialog!: DialogBox;
  private journal!: JournalMenu;
  private interactions!: InteractionSystem;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private menuKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private actionArmed = true;
  private shopId: ShopId = "bakery";
  private returnSpawn = { x: 350, y: 928 };

  constructor() { super("ShopInteriorScene"); }

  create(data: { shopId?: ShopId; returnSpawn?: { x: number; y: number }; spawn?: { x: number; y: number } } = {}): void {
    this.shopId = data.shopId ?? "bakery";
    this.returnSpawn = data.returnSpawn ?? this.returnSpawn;
    this.data.set("shopId", this.shopId);
    this.data.set("returnSpawn", this.returnSpawn);
    const shop = SHOPS[this.shopId];
    this.physics.world.setBounds(0, 0, 960, 540);
    this.drawInterior(shop);
    this.player = new Player(this, data.spawn?.x ?? 480, data.spawn?.y ?? 465, "player");
    this.createInteriorColliders();
    this.rudi = gameState.current.flags.rudiFirstMeetingComplete
      ? this.add.image(430, 470, "rudi").setOrigin(0.5, 0.8).setDepth(570)
      : undefined;
    this.interactions = new InteractionSystem();
    this.createOwner(shop);
    this.createExit();
    this.registerRudi();
    createWorldDepthLayer(this);
    this.hud = new TownHud(this);
    this.hud.setStatus(`${shop.title}  •  Ein kleiner Laden mit großer Meinung`);
    this.dialog = new DialogBox(this);
    this.journal = new JournalMenu(this);
    this.configureKeys();
    this.cameras.main.fadeIn(160, 59, 49, 82);
  }

  update(): void {
    this.updateRudi();
    if (this.journal.isOpen) {
      this.player.updateMovement(false);
      this.hud.setPrompt("");
      if (Phaser.Input.Keyboard.JustDown(this.menuKey) || Phaser.Input.Keyboard.JustDown(this.escapeKey)) this.journal.close();
      else if (Phaser.Input.Keyboard.JustDown(this.upKey)) this.journal.turnPage(-1);
      else if (Phaser.Input.Keyboard.JustDown(this.downKey)) this.journal.turnPage(1);
      return;
    }
    if (!this.dialog.isOpen && Phaser.Input.Keyboard.JustDown(this.menuKey)) {
      this.player.updateMovement(false);
      this.journal.open();
      return;
    }
    if (this.dialog.isOpen) {
      this.player.updateMovement(false);
      this.hud.setPrompt("");
      if (this.consumeAction()) this.dialog.advance();
      return;
    }
    this.player.updateMovement(true);
    this.hud.setPrompt(this.interactions.update(this.player));
    if (this.consumeAction()) this.interactions.interact();
  }

  private drawInterior(shop: ShopDefinition): void {
    const g = this.add.graphics();
    g.fillStyle(shop.wall, 1); g.fillRect(0, 0, 960, 540);
    g.fillStyle(0x49364c, 1); g.fillRect(0, 0, 960, 86);
    g.fillStyle(shop.accent, 1); g.fillRect(0, 77, 960, 9);
    g.fillStyle(0xe2c28b, 1); g.fillRect(0, 380, 960, 160);
    g.lineStyle(2, 0xb99061, 0.8);
    for (let y = 380; y < 540; y += 32) g.lineBetween(0, y, 960, y);
    for (let x = 0; x < 960; x += 64) g.lineBetween(x, 380, x, 540);
    this.add.text(480, 42, shop.title, { fontFamily: "Courier New", fontSize: "28px", fontStyle: "bold", color: "#fff4c8" }).setOrigin(0.5);

    g.fillStyle(0x765344, 1); g.fillRoundedRect(235, 205, 490, 92, 10);
    g.fillStyle(0xc98f57, 1); g.fillRoundedRect(250, 217, 460, 28, 6);
    g.fillStyle(0x503848, 1); g.fillRect(274, 254, 412, 12);
    [95, 790].forEach((x) => {
      g.fillStyle(0x755245, 1); g.fillRoundedRect(x, 120, 90, 205, 6);
      for (let y = 145; y < 310; y += 48) {
        g.fillStyle(0xd6a968, 1); g.fillRect(x + 8, y, 74, 8);
        g.fillStyle(shop.accent, 1); g.fillRect(x + 13, y - 24, 14, 24);
        g.fillStyle(0xffe6a8, 1); g.fillRect(x + 33, y - 18, 18, 18);
        g.fillStyle(0x78a584, 1); g.fillRect(x + 58, y - 28, 11, 28);
      }
    });
    g.fillStyle(0x5b405e, 1); g.fillRect(428, 487, 104, 53);
    g.fillStyle(0x805444, 1); g.fillRect(436, 494, 40, 46); g.fillRect(484, 494, 40, 46);
    g.fillStyle(0xf4c95d, 1); g.fillCircle(469, 518, 3); g.fillCircle(491, 518, 3);
    this.add.text(480, 504, "AUSGANG", { fontFamily: "Courier New", fontSize: "10px", fontStyle: "bold", color: "#fff3c3" }).setOrigin(0.5);
  }

  private createOwner(shop: ShopDefinition): void {
    const owner = this.add.image(480, 190, shop.texture).setOrigin(0.5, 0.8).setDepth(290);
    addNpcCollision(this, this.player, owner);
    this.add.text(480, 138, shop.owner, { fontFamily: "Courier New", fontSize: "13px", color: "#28304b", backgroundColor: "#fff5c9", padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(900);
    this.interactions.register({
      id: "shop-owner",
      displayName: shop.owner,
      object: owner,
      range: 150,
      enabled: () => true,
      interact: () => {
        if (this.shopId === "bakery") {
          const status = gameState.current.sideQuests.bakeryDelivery;
          if (status === "available") {
            gameState.startSideQuest("bakeryDelivery");
            this.dialog.open(line("bakery-delivery", shop.owner, "Kannst du diesen Picknickkorb zu Frau Moos in den Stadtpark bringen? Die Brezeln werden sonst philosophisch."), () => undefined);
          } else if (status === "active") {
            this.dialog.open(line("bakery-reminder", shop.owner, "Frau Moos wartet im Stadtpark. Der Korb ist bereit – und eine Brezel hat bereits Reiseproviant verlangt."), () => undefined);
          } else {
            this.dialog.open(line("bakery-thanks", shop.owner, "Frau Moos hat sich bedankt. Eine Brezel wollte mit zurück, aber so funktioniert Lieferung nicht."), () => undefined);
          }
          return;
        }
        this.dialog.open(line(`shop-${this.shopId}`, shop.owner, shop.greeting), () => undefined);
      },
    });
  }

  private createExit(): void {
    const exit = this.add.zone(480, 515, 120, 50);
    this.interactions.register({
      id: "shop-exit",
      displayName: "den Ausgang",
      object: exit,
      range: 72,
      enabled: () => true,
      interact: () => this.scene.start("TownScene", { spawn: { ...this.returnSpawn } }),
      prompt: () => "Auf den Marktplatz gehen",
      priority: 5,
    });
  }

  private createInteriorColliders(): void {
    this.addCollider(480, 251, 490, 92);
    this.addCollider(140, 222, 90, 205);
    this.addCollider(835, 222, 90, 205);
  }

  private addCollider(x: number, y: number, width: number, height: number): void {
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    this.physics.add.collider(this.player, zone);
  }

  private registerRudi(): void {
    if (!this.rudi) return;
    this.interactions.register({
      id: "rudi-shop",
      displayName: "Rudi",
      object: this.rudi,
      range: 78,
      enabled: () => Boolean(this.rudi?.visible),
      interact: () => this.dialog.open(createRudiCompanionDialogue(gameState.current, gameState.recordRudiConversation(), "shop"), () => undefined),
      prompt: () => "Mit Rudi sprechen",
      priority: -10,
    });
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
