import Phaser from "phaser";

type ImageWithArcadeBody = Phaser.GameObjects.Image & {
  body: Phaser.Physics.Arcade.Body;
};

export interface NpcCollisionOptions {
  width?: number;
  height?: number;
  bottomInset?: number;
}

/**
 * Gives an image-based NPC a small, immovable Arcade body around its feet.
 * The body remains attached when the NPC is animated with a tween.
 */
export function addNpcCollision(
  scene: Phaser.Scene,
  player: Phaser.GameObjects.GameObject,
  npc: Phaser.GameObjects.Image,
  options: NpcCollisionOptions = {},
): Phaser.Physics.Arcade.Body {
  scene.physics.add.existing(npc);
  const solidNpc = npc as ImageWithArcadeBody;
  const width = options.width ?? 22;
  const height = options.height ?? 18;
  const bottomInset = options.bottomInset ?? 3;

  solidNpc.body
    .setAllowGravity(false)
    .setImmovable(true)
    .setSize(width, height)
    .setOffset((npc.width - width) / 2, npc.height - height - bottomInset);
  scene.physics.add.collider(player, solidNpc);
  return solidNpc.body;
}
