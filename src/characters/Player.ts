import Phaser from "phaser";
import { gameState } from "../state/GameState";
import { setDepthIfChanged } from "../utils/setDepthIfChanged";
import { TurboAxisCooldown } from "../systems/TurboAxisCooldown";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private readonly speed = 155;
  private readonly turboSpeed = 430;
  private readonly turboDuration = 165;
  private readonly turboCooldown = 950;
  private readonly turboKey: Phaser.Input.Keyboard.Key;
  private facing = new Phaser.Math.Vector2(0, 1);
  private turboDirection = new Phaser.Math.Vector2(0, 1);
  private turboUntil = 0;
  private readonly turboCooldownByAxis = new TurboAxisCooldown();
  private nextTurboTrailAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setDepth(100 + Math.round(y));
    this.setOrigin(0.5, 0.78);
    this.body?.setSize(20, 18).setOffset(8, 26);
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is required for Festival Panic.");
    }
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
    this.turboKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
  }

  updateMovement(enabled: boolean): void {
    setDepthIfChanged(this, 100 + Math.round(this.y));
    if (!enabled) {
      this.setVelocity(0, 0);
      this.turboUntil = 0;
      this.clearTint().setAlpha(1);
      return;
    }

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    if (this.scene.time.now < this.turboUntil) {
      this.setVelocity(this.turboDirection.x * this.turboSpeed, this.turboDirection.y * this.turboSpeed);
      this.setScale(1.08, 0.92).setAlpha(0.82);
      if (this.scene.time.now >= this.nextTurboTrailAt) {
        this.emitTurboTrail(false);
        this.nextTurboTrailAt = this.scene.time.now + 55;
      }
      return;
    }
    this.clearTint().setAlpha(1);

    let velocityX = 0;
    let velocityY = 0;
    if (left !== right) {
      velocityX = left ? -this.speed : this.speed;
      this.setFlipX(left);
      this.facing.set(left ? -1 : 1, 0);
    } else if (up !== down) {
      velocityY = up ? -this.speed : this.speed;
      this.facing.set(0, up ? -1 : 1);
    }

    if (
      gameState.current.flags.turboUnlocked &&
      Phaser.Input.Keyboard.JustDown(this.turboKey)
    ) {
      const turboX = velocityX === 0 ? this.facing.x : Math.sign(velocityX);
      const turboY = velocityY === 0 ? this.facing.y : Math.sign(velocityY);
      const axis = turboX !== 0 ? "horizontal" : "vertical";
      if (this.turboCooldownByAxis.tryStart(axis, this.scene.time.now, this.turboCooldown)) {
        this.turboDirection.set(turboX, turboY).normalize();
        this.turboUntil = this.scene.time.now + this.turboDuration;
        this.nextTurboTrailAt = this.scene.time.now + 55;
        this.setTint(0xffe48a);
        this.setVelocity(this.turboDirection.x * this.turboSpeed, this.turboDirection.y * this.turboSpeed);
        this.emitTurboTrail(true);
        return;
      }
    }

    this.setVelocity(velocityX, velocityY);
    if (velocityX !== 0 || velocityY !== 0) {
      this.setScale(1, 1 + Math.sin(this.scene.time.now / 70) * 0.025);
    } else {
      this.setScale(1);
    }
  }

  get facingDirection(): Readonly<Phaser.Math.Vector2> {
    return this.facing;
  }

  private emitTurboTrail(burst: boolean): void {
    const direction = this.turboDirection;
    const perpendicularX = -direction.y;
    const perpendicularY = direction.x;
    const trailX = this.x - direction.x * (burst ? 13 : 20);
    const trailY = this.y - direction.y * (burst ? 13 : 20);
    const ghost = this.scene.add
      .image(trailX, trailY, this.texture.key)
      .setOrigin(this.originX, this.originY)
      .setFlipX(this.flipX)
      .setTint(0x8ff0cf)
      .setAlpha(burst ? 0.42 : 0.25)
      .setScale(this.scaleX * 0.96, this.scaleY * 0.96)
      .setDepth(this.depth - 2);
    this.scene.tweens.add({
      targets: ghost,
      x: ghost.x - direction.x * 13,
      y: ghost.y - direction.y * 13,
      alpha: 0,
      scaleX: ghost.scaleX * 0.84,
      scaleY: ghost.scaleY * 0.84,
      duration: burst ? 220 : 165,
      ease: "Quad.Out",
      onComplete: () => ghost.destroy(),
    });

    const angle = Phaser.Math.RadToDeg(Math.atan2(direction.y, direction.x));
    const colors = [0xffdf78, 0x67d5a2, 0xf27b83];
    const streakCount = burst ? 3 : 1;
    for (let index = 0; index < streakCount; index += 1) {
      const side = (index - (streakCount - 1) / 2) * 6;
      const streak = this.scene.add
        .ellipse(
          trailX + perpendicularX * side,
          trailY + perpendicularY * side + 5,
          burst ? 16 : 11,
          burst ? 5 : 4,
          colors[index % colors.length] ?? 0xffffff,
          burst ? 0.88 : 0.7,
        )
        .setAngle(angle)
        .setDepth(this.depth - 3);
      this.scene.tweens.add({
        targets: streak,
        x: streak.x - direction.x * (18 + index * 3),
        y: streak.y - direction.y * (18 + index * 3),
        scaleX: 0.25,
        scaleY: 0.5,
        alpha: 0,
        duration: 150 + index * 22,
        ease: "Cubic.Out",
        onComplete: () => streak.destroy(),
      });
    }
  }
}
