import Phaser from "phaser";

export class Npc extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    public readonly displayName: string,
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 0.8);
    this.setDepth(100 + Math.round(y));
    // A moving NPC needs a body that follows its sprite, including the mayor's arrival.
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setImmovable(true)
      .setSize(22, 18).setOffset((this.width - 22) / 2, this.height - 21);
  }
}
