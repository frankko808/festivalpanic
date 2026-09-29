import Phaser from "phaser";
import {
  BUDGET_LIMIT_EUR,
  COUNCIL_MAJORITY,
  GROUPS,
  calculatePlanCost,
  calculateSupport,
  DEFAULT_NEGOTIATION_FLAGS,
  type FestivalPlan,
  type GroupId,
  type NegotiationFlags,
} from "../data/festivalRules";
import {
  PLANNING_MODULES,
  updatePlanModule,
  type PlanningModule,
} from "../data/planningOptions";

const DEPTH = 100;

function formatEuro(value: number): string {
  return `${new Intl.NumberFormat("de-DE").format(value)} €`;
}

export class PlanningBoard {
  private plan: FestivalPlan;
  private selectedModuleIndex = 0;
  private controlsEnabled = false;
  private readonly rowPanels: Phaser.GameObjects.Rectangle[] = [];
  private readonly valueTexts: Phaser.GameObjects.Text[] = [];
  private readonly costText: Phaser.GameObjects.Text;
  private readonly voteText: Phaser.GameObjects.Text;
  private readonly majorityText: Phaser.GameObjects.Text;
  private readonly supportTexts = new Map<GroupId, Phaser.GameObjects.Text>();
  private readonly saveButton: Phaser.GameObjects.Rectangle;
  private readonly saveText: Phaser.GameObjects.Text;
  private readonly footerText: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    initialPlan: FestivalPlan,
    private readonly onPlanChanged: (plan: FestivalPlan) => void,
    private readonly onSave: (plan: FestivalPlan) => void,
    private readonly negotiationFlags: NegotiationFlags = DEFAULT_NEGOTIATION_FLAGS,
    private readonly singleChangeBase?: FestivalPlan,
  ) {
    this.plan = { ...initialPlan };
    scene.cameras.main.setBackgroundColor("#e8d99f");
    scene.add
      .rectangle(480, 270, 928, 508, 0xeee1b6)
      .setStrokeStyle(5, 0x3b3152)
      .setDepth(DEPTH);
    const boardTexture = scene.add.graphics().setDepth(DEPTH + 0.2);
    boardTexture.lineStyle(1, 0xd2c091, 0.45);
    for (let y = 74; y < 492; y += 24) boardTexture.lineBetween(38, y, 922, y);
    boardTexture.lineStyle(2, 0xd78686, 0.42);
    boardTexture.lineBetween(48, 72, 48, 496);
    boardTexture.fillStyle(0x756047, 1);
    ([[35, 29], [925, 29], [35, 511], [925, 511]] as const).forEach(([x, y]) => boardTexture.fillCircle(x, y, 5));
    boardTexture.fillStyle(0xf8edc9, 1);
    ([[35, 29], [925, 29], [35, 511], [925, 511]] as const).forEach(([x, y]) => boardTexture.fillCircle(x, y, 2));
    scene.add
      .text(42, 27, "PLANUNGSPULT", {
        fontFamily: "Courier New",
        fontSize: "27px",
        fontStyle: "bold",
        color: "#3b3152",
      })
      .setDepth(DEPTH + 1);
    scene.add
      .text(918, 31, "ZIEL: MINDESTENS 7 STIMMEN", {
        fontFamily: "Courier New",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#276b54",
      })
      .setOrigin(1, 0)
      .setDepth(DEPTH + 1);

    scene.add
      .rectangle(300, 280, 525, 390, 0xf8f0d3)
      .setStrokeStyle(3, 0x8b775e)
      .setDepth(DEPTH + 1);
    scene.add
      .text(55, 61, "FESTIVALMODULE", {
        fontFamily: "Courier New",
        fontSize: "17px",
        fontStyle: "bold",
        color: "#756047",
      })
      .setDepth(DEPTH + 2);

    PLANNING_MODULES.forEach((module, index) => this.createModuleRow(module, index));

    scene.add
      .rectangle(746, 280, 314, 390, 0x20243e)
      .setStrokeStyle(3, 0x8ee3ba)
      .setDepth(DEPTH + 1);
    scene.add
      .text(746, 62, "MEHRHEITSBLICK", {
        fontFamily: "Courier New",
        fontSize: "19px",
        fontStyle: "bold",
        color: "#276b54",
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH + 2);
    GROUPS.forEach((group, index) => this.createSupportRow(group.id, group.name, group.seats, index));

    this.costText = scene.add
      .text(60, 452, "", {
        fontFamily: "Courier New",
        fontSize: "21px",
        fontStyle: "bold",
        color: "#3b3152",
      })
      .setDepth(DEPTH + 3);
    this.voteText = scene.add
      .text(608, 390, "", {
        fontFamily: "Courier New",
        fontSize: "27px",
        fontStyle: "bold",
        color: "#fff8dc",
      })
      .setDepth(DEPTH + 3);
    this.majorityText = scene.add
      .text(608, 426, "", {
        fontFamily: "Courier New",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ff9a8c",
      })
      .setDepth(DEPTH + 3);

    this.saveButton = scene.add
      .rectangle(786, 491, 260, 54, 0x3b3152)
      .setStrokeStyle(3, 0xffdf78)
      .setDepth(DEPTH + 3)
      .setInteractive({ useHandCursor: true });
    this.saveText = scene.add
      .text(786, 491, "ENTWURF SPEICHERN", {
        fontFamily: "Courier New",
        fontSize: "17px",
        fontStyle: "bold",
        color: "#fff8dc",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH + 4);
    this.footerText = scene.add
      .text(55, 493, "↑↓ Modul  •  ←→ ändern  •  E/Enter speichern", {
        fontFamily: "Courier New",
        fontSize: "13px",
        color: "#756047",
      })
      .setDepth(DEPTH + 2);

    this.saveButton.on("pointerover", () => {
      if (this.controlsEnabled) {
        this.saveButton.setFillStyle(0x57486f);
      }
    });
    this.saveButton.on("pointerout", () => {
      if (this.controlsEnabled) {
        this.saveButton.setFillStyle(0x3b3152);
      }
    });
    this.saveButton.on("pointerup", () => this.save());
    this.render();
  }

  get isEnabled(): boolean {
    return this.controlsEnabled;
  }

  get currentPlan(): FestivalPlan {
    return { ...this.plan };
  }

  setEnabled(enabled: boolean): void {
    this.controlsEnabled = enabled;
    this.saveButton.setFillStyle(enabled ? 0x3b3152 : 0x6f6b78);
    this.saveText.setColor(enabled ? "#fff8dc" : "#c3bec9");
    this.footerText.setVisible(enabled);
    this.renderSelection();
  }

  moveSelection(delta: number): void {
    if (!this.controlsEnabled) {
      return;
    }
    this.selectedModuleIndex = Phaser.Math.Wrap(
      this.selectedModuleIndex + delta,
      0,
      PLANNING_MODULES.length,
    );
    this.renderSelection();
  }

  changeSelectedOption(delta: number): void {
    if (!this.controlsEnabled) {
      return;
    }
    this.changeModuleOption(this.selectedModuleIndex, delta);
  }

  save(): void {
    if (!this.controlsEnabled) {
      return;
    }
    this.onSave(this.currentPlan);
  }

  showCheckpointReached(): void {
    this.setEnabled(false);
    this.saveText.setText("ENTWURF GESPEICHERT");
    this.footerText
      .setText("TESTABSCHNITT BEENDET  •  Als Nächstes: drei Verhandlungen")
      .setVisible(true)
      .setColor("#276b54");
  }

  setFinalMode(): void {
    this.saveText.setText("ZUR ABSTIMMUNG");
    this.footerText.setText("↑↓ Modul  •  ←→ ändern  •  E/Enter zur Abstimmung");
  }

  private createModuleRow(module: PlanningModule, index: number): void {
    const y = 123 + index * 64;
    const panel = this.scene.add
      .rectangle(300, y, 495, 53, 0xe6d7ad)
      .setStrokeStyle(2, 0xb59c72)
      .setDepth(DEPTH + 2)
      .setInteractive({ useHandCursor: true });
    panel.on("pointerup", () => {
      if (this.controlsEnabled) {
        this.selectedModuleIndex = index;
        this.renderSelection();
      }
    });
    this.rowPanels.push(panel);
    this.scene.add
      .text(67, y - 17, module.label, {
        fontFamily: "Courier New",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#756047",
      })
      .setDepth(DEPTH + 3);
    const left = this.createArrowButton(253, y + 7, "◀", () => this.changeModuleOption(index, -1));
    const right = this.createArrowButton(522, y + 7, "▶", () => this.changeModuleOption(index, 1));
    left.setDepth(DEPTH + 4);
    right.setDepth(DEPTH + 4);
    const valueText = this.scene.add
      .text(387, y + 7, "", {
        fontFamily: "Courier New",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#3b3152",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH + 3);
    this.valueTexts.push(valueText);
  }

  private createArrowButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Text {
    const button = this.scene.add
      .text(x, y, label, {
        fontFamily: "Courier New",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#fff8dc",
        backgroundColor: "#3b3152",
        padding: { x: 9, y: 4 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    button.on("pointerup", () => {
      if (this.controlsEnabled) {
        onClick();
      }
    });
    return button;
  }

  private createSupportRow(groupId: GroupId, name: string, seats: number, index: number): void {
    const y = 119 + index * 65;
    this.scene.add
      .text(608, y, `${name} · ${seats}`, {
        fontFamily: "Courier New",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#fff8dc",
      })
      .setDepth(DEPTH + 3);
    this.scene.add
      .text(608, y + 22, this.groupHint(groupId), {
        fontFamily: "Courier New",
        fontSize: "12px",
        color: "#b9c5d6",
      })
      .setDepth(DEPTH + 3);
    const supportText = this.scene.add
      .text(889, y + 10, "", {
        fontFamily: "Courier New",
        fontSize: "16px",
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5)
      .setDepth(DEPTH + 3);
    this.supportTexts.set(groupId, supportText);
  }

  private changeModuleOption(moduleIndex: number, delta: number): void {
    if (!this.controlsEnabled) {
      return;
    }
    const module = PLANNING_MODULES[moduleIndex];
    if (!module) {
      return;
    }
    if (this.singleChangeBase) {
      const changedModule = PLANNING_MODULES.find((candidate) => this.plan[candidate.id] !== this.singleChangeBase?.[candidate.id]);
      if (changedModule && changedModule.id !== module.id) {
        this.footerText.setText(`LETZTER ÄNDERUNGSANTRAG: Nur ${changedModule.label} darf geändert werden.`).setColor("#c23b4b");
        return;
      }
    }
    this.selectedModuleIndex = moduleIndex;
    const currentValue = this.plan[module.id];
    const options = this.optionsFor(module);
    const currentIndex = options.findIndex((option) => option.value === currentValue);
    const nextIndex = Phaser.Math.Wrap(currentIndex + delta, 0, options.length);
    const option = options[nextIndex];
    if (!option) {
      return;
    }
    this.plan = updatePlanModule(this.plan, module.id, option.value);
    this.onPlanChanged(this.currentPlan);
    this.render();
  }

  private render(): void {
    PLANNING_MODULES.forEach((module, index) => {
      const option = this.optionsFor(module).find((candidate) => candidate.value === this.plan[module.id]);
      this.valueTexts[index]?.setText(option?.label ?? "?");
    });
    const cost = calculatePlanCost(this.plan, this.negotiationFlags);
    const support = calculateSupport(this.plan, this.negotiationFlags);
    this.costText
      .setText(`KOSTEN: ${formatEuro(cost)}`)
      .setColor(cost <= BUDGET_LIMIT_EUR ? "#3b3152" : "#c23b4b");
    this.voteText.setText(`${support.votes} / 12 STIMMEN`);
    this.majorityText
      .setText(support.hasMajority ? "✓ MEHRHEIT" : `NOCH ${COUNCIL_MAJORITY - support.votes} STIMMEN`)
      .setColor(support.hasMajority ? "#8ee3ba" : "#ff9a8c");
    GROUPS.forEach((group) => {
      const supports = support.supporters.includes(group.id);
      const label = supports ? `JA +${group.seats}` : "NEIN";
      const color = supports ? "#8ee3ba" : "#ff9a8c";
      this.supportTexts.get(group.id)?.setText(label).setColor(color);
    });
    this.renderSelection();
  }

  private renderSelection(): void {
    this.rowPanels.forEach((panel, index) => {
      const selected = this.controlsEnabled && index === this.selectedModuleIndex;
      panel.setStrokeStyle(selected ? 4 : 2, selected ? 0xe05b69 : 0xb59c72);
      panel.setFillStyle(selected ? 0xffe4b5 : 0xe6d7ad);
    });
  }

  private optionsFor(module: PlanningModule): PlanningModule["options"] {
    if (module.id !== "stage" || !this.negotiationFlags.newcomerStageUnlocked) return module.options;
    return [...module.options, { value: "newcomer", label: "Newcomer-Bühne", extraCost: 3_000 }];
  }

  private groupHint(groupId: GroupId): string {
    switch (groupId) {
      case "young-list":
        if (this.negotiationFlags.newcomerStageUnlocked) return "Groß/Newcomer + Ende 23/24 Uhr";
        if (this.negotiationFlags.youngListAccepts23) return "Große Bühne + Ende 23/24 Uhr";
        return "Große Bühne + 24 Uhr";
      case "citizens-forum":
        if (this.negotiationFlags.citizensForumAccepts23) return "Bis 23 Uhr + Zusatzteam";
        if (this.negotiationFlags.citizensForumAccepts23WithDeposit) return "Bis 23 Uhr + Zusatzteam + Pfand";
        return "22 Uhr + Zusatzteam";
      case "green-local":
        return this.negotiationFlags.greenLocalAccepts50
          ? "Bis 23 Uhr + Pfand + 50 % lokal"
          : "Bis 23 Uhr + Pfand + 75 % lokal";
      case "budget-hawks":
        return "Maximal 20.000 €";
    }
  }
}
