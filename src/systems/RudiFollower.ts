import type Phaser from "phaser";
import { setDepthIfChanged } from "../utils/setDepthIfChanged";

export const RUDI_FOLLOW_SETTINGS = {
  lagSpeed: 110,
  comfortableDistance: 64,
  speedPerPixel: 2.5,
  maxSpeed: 650,
  teleportDistance: 1000,
  stoppingDistance: 8,
} as const;

interface Point { x: number; y: number }
interface FollowingPlayer extends Point { facingDirection: Readonly<Point> }
interface WorldBounds extends Point { width: number; height: number }
type RudiActor = Phaser.GameObjects.Image | Phaser.Physics.Arcade.Sprite;

export interface FollowStep extends Point { moving: boolean; teleported: boolean }

/** Speed is based on the actual distance to the player, not the changing offset behind them. */
export function rudiFollowSpeed(distanceToPlayer: number): number {
  const settings = RUDI_FOLLOW_SETTINGS;
  return Math.min(settings.maxSpeed, settings.lagSpeed + Math.max(0, distanceToPlayer - settings.comfortableDistance) * settings.speedPerPixel);
}

export function rudiFollowTarget(player: FollowingPlayer, bounds: WorldBounds): Point {
  const facing = player.facingDirection;
  return {
    x: Math.max(bounds.x + 28, Math.min(bounds.x + bounds.width - 28, player.x - facing.x * 50 + facing.y * 22)),
    y: Math.max(bounds.y + 35, Math.min(bounds.y + bounds.height - 28, player.y - facing.y * 50 - facing.x * 14)),
  };
}

export function advanceRudiFollower(rudi: Readonly<Point>, player: Readonly<Point>, target: Readonly<Point>, deltaMs: number): FollowStep {
  let x = rudi.x, y = rudi.y;
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return { x, y, moving: false, teleported: false };
  if (Math.hypot(player.x - x, player.y - y) > RUDI_FOLLOW_SETTINGS.teleportDistance) {
    return { ...target, moving: false, teleported: true };
  }

  // Small time steps keep acceleration consistent at different frame rates.
  // A stalled/background frame must not produce a large visible catch-up jump.
  let remaining = Math.min(deltaMs, 100) / 1000;
  let moving = false;
  while (remaining > 0.000001) {
    const seconds = Math.min(remaining, 1 / 120);
    remaining -= seconds;
    const dx = target.x - x, dy = target.y - y;
    const distance = Math.hypot(dx, dy);
    if (distance <= RUDI_FOLLOW_SETTINGS.stoppingDistance) break;
    const step = Math.min(distance - RUDI_FOLLOW_SETTINGS.stoppingDistance, rudiFollowSpeed(Math.hypot(player.x - x, player.y - y)) * seconds);
    x += dx / distance * step;
    y += dy / distance * step;
    moving = true;
  }
  return { x, y, moving, teleported: false };
}

/** Shared movement, facing and animation for every map where Rudi follows the player. */
export function updateRudiFollower(
  rudi: RudiActor, player: FollowingPlayer, deltaMs: number, timeMs: number, bounds: WorldBounds,
  resolveTarget?: (target: Readonly<Point>) => Readonly<Point>,
): void {
  const desired = rudiFollowTarget(player, bounds);
  const result = advanceRudiFollower(rudi, player, resolveTarget?.(desired) ?? desired, deltaMs);
  const dx = result.x - rudi.x;
  rudi.setPosition(result.x, result.y);
  if (Math.abs(dx) > 0.15) rudi.setFlipX(dx > 0);
  rudi.setScale(1, result.moving ? 1 + Math.sin(timeMs / 85) * 0.055 : 1);
  setDepthIfChanged(rudi, 100 + Math.round(rudi.y));
}
