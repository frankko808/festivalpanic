import Phaser from "phaser";

/**
 * Phaser queues a sort of the owning DisplayList every time setDepth is called,
 * even when the numeric value stays unchanged. Moving actors call this helper so
 * an idle or purely horizontal frame does not trigger a redundant world sort.
 */
export function setDepthIfChanged<T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth>(
  object: T,
  depth: number,
): T {
  if (object.depth !== depth) object.setDepth(depth);
  return object;
}

