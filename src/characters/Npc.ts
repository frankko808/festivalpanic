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
    scene.physics.add.existing(this, true);
    this.setOrigin(0.5, 0.8);
    this.setDepth(100 + Math.round(y));
    this.body?.setSize(26, 22).setOffset(5, 11);
  }
}
