import Phaser from "phaser";

export interface Interactable {
  id: string;
  displayName: string;
  object: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Visible;
  range: number;
  enabled: () => boolean;
  interact: () => void;
  prompt?: () => string;
  priority?: number | (() => number);
}

export class InteractionSystem {
  private readonly interactables: Interactable[] = [];
  private nearest?: Interactable;
  private readonly marker?: Phaser.GameObjects.Text;

  constructor(scene?: Phaser.Scene) {
    this.marker = scene?.add.text(0, 0, "▼", {
      fontFamily: "Arial", fontSize: "23px", color: "#ffe696",
      stroke: "#28304b", strokeThickness: 4,
    }).setOrigin(0.5, 1).setDepth(2000).setVisible(false);
  }

  get selected(): Interactable | undefined { return this.nearest; }

  clear(): void {
    this.nearest = undefined;
    this.marker?.setVisible(false);
  }

  register(interactable: Interactable): void {
    this.interactables.push(interactable);
  }

  update(player: Phaser.GameObjects.Components.Transform): string {
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestPriority = Number.NEGATIVE_INFINITY;
    this.nearest = undefined;

    for (const interactable of this.interactables) {
      if (!interactable.enabled() || !interactable.object.visible) {
        continue;
      }
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        interactable.object.x,
        interactable.object.y,
      );
      const priority = typeof interactable.priority === "function"
        ? interactable.priority()
        : (interactable.priority ?? 0);
      if (
        distance <= interactable.range &&
        (priority > bestPriority || (priority === bestPriority && distance < bestDistance))
      ) {
        bestPriority = priority;
        bestDistance = distance;
        this.nearest = interactable;
      }
    }
    if (this.marker) {
      if (this.nearest) {
        const object = this.nearest.object as Phaser.GameObjects.Image;
        const bounds = typeof object.getBounds === "function" ? object.getBounds() : undefined;
        this.marker.setPosition(this.nearest.object.x, (bounds?.top ?? this.nearest.object.y) - 24).setVisible(true);
      } else this.marker.setVisible(false);
    }
    return this.nearest
      ? `[E] ${this.nearest.prompt?.() ?? `Mit ${this.nearest.displayName} sprechen`}`
      : "";
  }

  interact(): boolean {
    if (!this.nearest || !this.nearest.enabled() || !this.nearest.object.visible) {
      this.clear();
      return false;
    }
    const target = this.nearest;
    this.clear();
    target.interact();
    return true;
  }

  interactWith(id: string, player: Phaser.GameObjects.Components.Transform): boolean {
    const interactable = this.interactables.find((candidate) => candidate.id === id);
    if (!interactable || !interactable.enabled() || !interactable.object.visible) {
      return false;
    }
    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      interactable.object.x,
      interactable.object.y,
    );
    if (distance > interactable.range) {
      return false;
    }
    this.clear();
    interactable.interact();
    return true;
  }
}
