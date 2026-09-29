import Phaser from "phaser";

/**
 * Moves the currently created world objects into their own DisplayList. UI is
 * created afterwards and stays on the much smaller scene-level DisplayList.
 * Dynamic y-depth updates therefore sort only the world, not every HUD panel.
 */
export function createWorldDepthLayer(
  scene: Phaser.Scene,
  exclusions: ReadonlyArray<Phaser.GameObjects.GameObject> = [],
): Phaser.GameObjects.Layer {
  const layer = scene.add.layer();
  const excluded = new Set<Phaser.GameObjects.GameObject>([layer, ...exclusions]);
  const worldObjects = scene.children
    .getChildren()
    .filter((child) => !excluded.has(child) && !(child instanceof Phaser.GameObjects.Zone));
  layer.add(worldObjects);
  layer.setDepth(0);
  return layer;
}
