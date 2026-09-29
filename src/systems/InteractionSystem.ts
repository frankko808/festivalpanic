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
    return this.nearest
      ? `[E] ${this.nearest.prompt?.() ?? `Mit ${this.nearest.displayName} sprechen`}`
      : "";
  }

  interact(): boolean {
    if (!this.nearest) {
      return false;
    }
    this.nearest.interact();
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
    interactable.interact();
    return true;
  }
}
