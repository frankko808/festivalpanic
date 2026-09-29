import Phaser from "phaser";
import { ARGUMENT_CARDS } from "../data/argumentCards";
import { gameState } from "../state/GameState";
import { ACHIEVEMENTS, type AchievementId } from "../data/achievements";
import { formatDuration } from "../utils/formatDuration";

type JournalTab = "items" | "quests" | "insights";

const DEPTH = 2100;

const GROUP_INSIGHTS = {
  "young-list": "Junge Liste · 4 Stimmen\nGroße Bühne und ursprünglich Ende um 24 Uhr. Jugendkultur braucht sichtbare öffentliche Räume.",
  "citizens-forum": "Bürgerforum · 3 Stimmen\nSchutz der Wohnstraßen, frühes Ende und zusätzliches Sicherheitsteam.",
  "green-local": "Grün & Lokal · 3 Stimmen\nPfandsystem, lokale Betriebe und ein Ende spätestens um 23 Uhr.",
  "budget-hawks": "Sparfüchse · 2 Stimmen\nDer vollständige Festivalplan darf höchstens 20.000 Euro kosten.",
} as const;

export class JournalMenu {
  private readonly root: Phaser.GameObjects.Container;
  private readonly content: Phaser.GameObjects.Text;
  private readonly footer: Phaser.GameObjects.Text;
  private readonly tabButtons = new Map<JournalTab, Phaser.GameObjects.Text>();
  private activeTab: JournalTab = "quests";
  private pages: string[] = [];
  private pageIndex = 0;

  constructor(private readonly scene: Phaser.Scene) {
    const shade = scene.add.rectangle(480, 270, 960, 540, 0x101426, 0.86).setInteractive();
    const shadow = scene.add.rectangle(488, 278, 842, 456, 0x080a13, 0.58);
    const panel = scene.add.rectangle(480, 270, 842, 456, 0xfff3c7).setStrokeStyle(6, 0x49364c);
    const paper = scene.add.graphics();
    paper.lineStyle(1, 0xdacb9e, 0.58);
    for (let y = 174; y <= 446; y += 27) paper.lineBetween(82, y, 878, y);
    paper.lineStyle(2, 0xe6908f, 0.58);
    paper.lineBetween(76, 153, 76, 455);
    paper.fillStyle(0x49364c, 1);
    [94, 172, 250, 328, 406].forEach((y) => paper.fillCircle(67, y, 5));
    paper.fillStyle(0xfff3c7, 1);
    [94, 172, 250, 328, 406].forEach((y) => paper.fillCircle(67, y, 2));
    const title = scene.add.text(82, 58, "RUDIS FESTIVAL-ORDNER", { fontFamily: "Courier New", fontSize: "27px", fontStyle: "bold", color: "#49364c" });
    const subtitle = scene.add.text(82, 91, "Fast vollständig. Verdächtig gut sortiert.", { fontFamily: "Courier New", fontSize: "14px", color: "#756047" });
    this.content = scene.add.text(91, 157, "", { fontFamily: "Trebuchet MS", fontSize: "16px", color: "#302b49", lineSpacing: 7, wordWrap: { width: 770 } });
    this.footer = scene.add.text(480, 480, "M / ESC schließen  •  1–3 Register", { fontFamily: "Courier New", fontSize: "14px", color: "#fff8dc", backgroundColor: "#49364c", padding: { x: 12, y: 6 } }).setOrigin(0.5);
    this.root = scene.add.container(0, 0, [shade, shadow, panel, paper, title, subtitle, this.content, this.footer]).setScrollFactor(0).setDepth(DEPTH).setVisible(false);
    this.createTab("items", 190, "1  GEGENSTÄNDE");
    this.createTab("quests", 480, "2  AUFGABEN");
    this.createTab("insights", 770, "3  ERKENNTNISSE");
  }

  get isOpen(): boolean { return this.root.visible; }

  open(tab: JournalTab = this.activeTab): void {
    this.activeTab = tab;
    this.root.setVisible(true);
    this.render();
  }

  close(): void { this.root.setVisible(false); }

  toggle(): void { if (this.isOpen) this.close(); else this.open(); }

  select(index: number): void {
    const tabs: JournalTab[] = ["items", "quests", "insights"];
    const tab = tabs[index];
    if (!tab) return;
    this.activeTab = tab;
    this.pageIndex = 0;
    this.render();
  }

  turnPage(delta: number): void {
    if (this.pages.length <= 1) return;
    this.pageIndex = Phaser.Math.Wrap(this.pageIndex + delta, 0, this.pages.length);
    this.renderPage();
  }

  private createTab(tab: JournalTab, x: number, label: string): void {
    const button = this.scene.add.text(x, 127, label, { fontFamily: "Courier New", fontSize: "16px", fontStyle: "bold", color: "#fff8dc", backgroundColor: "#6b5979", padding: { x: 13, y: 8 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on("pointerup", () => { this.activeTab = tab; this.pageIndex = 0; this.render(); });
    this.root.add(button);
    this.tabButtons.set(tab, button);
  }

  private render(): void {
    this.tabButtons.forEach((button, tab) => button.setBackgroundColor(tab === this.activeTab ? "#d85f73" : "#6b5979").setColor(tab === this.activeTab ? "#fff8dc" : "#ded5e4"));
    const text = this.activeTab === "items" ? this.itemsText() : this.activeTab === "quests" ? this.questsText() : this.insightsText();
    this.pages = this.paginate(text);
    this.pageIndex = Phaser.Math.Clamp(this.pageIndex, 0, Math.max(0, this.pages.length - 1));
    this.renderPage();
  }

  private renderPage(): void {
    this.content.setText(this.pages[this.pageIndex] ?? "");
    const page = this.pages.length > 1 ? `  •  Seite ${this.pageIndex + 1}/${this.pages.length} mit ↑↓` : "";
    this.footer.setText(`M / ESC schließen  •  1–3 Register${page}`);
  }

  private paginate(text: string): string[] {
    const lines = text.split("\n");
    const pages: string[] = [];
    for (let index = 0; index < lines.length; index += 12) pages.push(lines.slice(index, index + 12).join("\n"));
    return pages.length ? pages : [""];
  }

  private itemsText(): string {
    const state = gameState.current;
    const lines = ["WICHTIGE DINGE", ""];
    lines.push("• Rudis Notfallnotiz\n  „Sieben Stimmen. Nicht sechs. Ich habe nachgerechnet.“");
    if (state.favors.status["green-local"] !== "locked") lines.push(`• Wiederverwendbarer Sammelhandschuh\n  Parkmüll gefunden: ${state.favors.trashCollected.length}/4`);
    if (state.favors.status["budget-hawks"] !== "locked") lines.push(`• Marktbelege\n  Gefunden: ${state.favors.receiptsCollected.length}/3`);
    if (state.sideQuests.bakeryDelivery === "active") lines.push("• Picknickkorb von Bäckerin Bea\n  Warm, schwer und dringend in Richtung Stadtpark unterwegs.");
    if (state.flags.turboUnlocked) lines.push("• Katzenreflex-Turbo\n  Q: kurz sprinten. Achse wechseln für sofortigen Zickzack-Turbo.");
    if (state.sideQuests.fountainCoins !== "available") lines.push(`• Glücksmünzen\n  Gefunden: ${state.sideQuests.coinIds.length}/3`);
    if (state.quest.negotiationStarted) lines.push(`• Gesprächsmarken\n  Noch verfügbar: ${state.quest.negotiationTokensRemaining}/${state.quest.negotiationTokensTotal}`);
    lines.push(`• Spielzeit dieses Durchlaufs: ${formatDuration(state.elapsedMs)}`);
    return lines.join("\n\n");
  }

  private questsText(): string {
    const state = gameState.current;
    const lines = ["HAUPTAUFGABE · RETTE DAS SOMMERFEST", ""];
    if (!state.quest.mainQuestStarted) lines.push("○ Sprich mit Rudi und anschließend mit der Bürgermeisterin.");
    else if (state.quest.groupsInterviewed < state.quest.groupsTotal) lines.push(`◉ Befrage die politischen Gruppen: ${state.quest.groupsInterviewed}/${state.quest.groupsTotal}\n  Markt: Brömmel · Kai: Mia · Park: Nora · Rathaus: Centner`);
    else if (!state.flags.firstDraftSaved) lines.push("◉ Öffne das Planungspult und erstelle den ersten Entwurf.");
    else if (state.quest.negotiationTokensRemaining > 0) lines.push(`◉ Führe politische Verhandlungen: ${state.quest.negotiationTokensRemaining} Marken übrig.`);
    else if (!state.planning.finalPlan) lines.push("◉ Plane das finale Festival und sichere mindestens sieben Stimmen.");
    else if (state.phase === "council") lines.push("◉ Stelle den Festivalplan im Stadtrat zur Abstimmung.");
    else lines.push("✓ Das Sommerfest ist politisch gerettet.");

    const favorStatus = state.favors.status;
    if (favorStatus["green-local"] === "active" || favorStatus["green-local"] === "ready") lines.push(`\nNEBENAUFGABE · EIN PARK ZUM DURCHATMEN\n${state.favors.trashCollected.length}/4 Müllteile gefunden. Danach in den grünen Mülleimer werfen.`);
    if (favorStatus["green-local"] === "complete") lines.push("\n✓ Ein Park zum Durchatmen");
    if (favorStatus["budget-hawks"] === "active" || favorStatus["budget-hawks"] === "ready") lines.push(`\nNEBENAUFGABE · DIE FLIEGENDE BUCHHALTUNG\n${state.favors.receiptsCollected.length}/3 Belege auf dem Marktplatz gefunden.`);
    if (favorStatus["budget-hawks"] === "complete") lines.push("\n✓ Die fliegende Buchhaltung");
    if (state.sideQuests.bakeryDelivery === "active") lines.push("\nNEBENAUFGABE · PICKNICK MIT PAPIER TÜTE\nBring Beas Picknickkorb zu Frau Moos im Stadtpark.");
    if (state.sideQuests.bakeryDelivery === "complete") lines.push("\n✓ Picknick mit Papiertüte");
    if (state.sideQuests.missingCat === "active") lines.push(`\nNEBENAUFGABE · MINKA MACHT URLAUB\nFang die orange Katze am Kulturkai: ${state.sideQuests.missingCatEncounters}/3 Begegnungen.`);
    if (state.sideQuests.missingCat === "complete") lines.push("\n✓ Minka macht Urlaub · Turbo freigeschaltet");
    if (state.sideQuests.fountainCoins === "active" || state.sideQuests.fountainCoins === "ready") lines.push(`\nNEBENAUFGABE · BRUNNENFINANZEN\n${state.sideQuests.coinIds.length}/3 Glücksmünzen gefunden.`);
    if (state.sideQuests.fountainCoins === "complete") lines.push("\n✓ Brunnenfinanzen");
    return lines.join("\n");
  }

  private insightsText(): string {
    const state = gameState.current;
    const lines = ["POLITISCHE ERKENNTNISSE", ""];
    if (!state.quest.argumentCards.length) lines.push("Noch keine Argumentkarten gesammelt. Rudi hat trotzdem Meinungen.");
    state.quest.argumentCards.forEach((id) => {
      const card = ARGUMENT_CARDS[id];
      lines.push(`◆ ${card.title}\n  ${card.description}`);
    });
    const interviewed = Object.entries(state.quest.groupInterviews).filter(([, done]) => done);
    if (interviewed.length) lines.push("\nBEKANNTE INTERESSEN");
    interviewed.forEach(([groupId]) => lines.push(`\n${GROUP_INSIGHTS[groupId as keyof typeof GROUP_INSIGHTS]}`));
    if (state.quest.negotiationStarted) {
      const activeFlags = Object.entries(state.quest.negotiationFlags).filter(([, enabled]) => enabled);
      if (activeFlags.length) lines.push(`\nAUSGEHANDELTE KOMPROMISSE\n${activeFlags.map(([id]) => `✓ ${this.flagLabel(id)}`).join("\n")}`);
    }
    const earned = [...new Set([...gameState.persisted.achievements, ...state.achievements])] as AchievementId[];
    if (earned.length) lines.push(`\nERFOLGE\n${earned.map((id) => `★ ${ACHIEVEMENTS[id]?.title ?? id}: ${ACHIEVEMENTS[id]?.description ?? ""}`).join("\n")}`);
    return lines.join("\n");
  }

  private flagLabel(id: string): string {
    return ({ youngListAccepts23: "Junge Liste akzeptiert 23 Uhr", newcomerStageUnlocked: "Newcomer-Bühne und 23 Uhr freigeschaltet", citizensForumAccepts23: "Bürgerforum akzeptiert 23 Uhr mit Sicherheit", citizensForumAccepts23WithDeposit: "Bürgerforum akzeptiert Pfand-Kompromiss", greenLocalAccepts50: "Grün & Lokal akzeptiert 50 % lokale Stände", greenLogisticsDiscount: "Sammeldepot spart 1.000 Euro Logistikkosten", helperTeamDiscount: "Helferteam senkt Bühnen- und Sicherheitskosten", localPartnerPackage: "Lokales Partnerpaket senkt Stadtkosten" } as Record<string, string>)[id] ?? id;
  }
}
