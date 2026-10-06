import { describe, expect, it } from "vitest";
import { advanceRudiFollower, rudiFollowSpeed, rudiFollowTarget, RUDI_FOLLOW_SETTINGS } from "../systems/RudiFollower";

describe("Rudi's adaptive following", () => {
  it("lags initially, accelerates with distance and can overtake a turbo player", () => {
    expect(rudiFollowSpeed(50)).toBeLessThan(155);
    const speeds = [80, 120, 180, 260, 400].map(rudiFollowSpeed);
    for (let i = 1; i < speeds.length; i++) expect(speeds[i]).toBeGreaterThanOrEqual(speeds[i - 1]!);
    expect(rudiFollowSpeed(260)).toBeGreaterThan(430);
    expect(rudiFollowSpeed(900)).toBe(RUDI_FOLLOW_SETTINGS.maxSpeed);
  });

  it("recovers a gap beyond the old threshold by running, reserving teleportation for 1000 pixels", () => {
    const player = { x: 400, y: 100 }, target = { x: 350, y: 86 };
    const catchingUp = advanceRudiFollower({ x: 0, y: 100 }, player, target, 1000 / 60);
    expect(catchingUp.teleported).toBe(false);
    expect(catchingUp.x).toBeGreaterThan(0);
    expect(catchingUp.x).toBeLessThan(20);
    expect(advanceRudiFollower({ x: -600, y: 100 }, player, target, 1000 / 60).teleported).toBe(false);
    expect(advanceRudiFollower({ x: -601, y: 100 }, player, target, 1000 / 60)).toEqual({ ...target, moving: false, teleported: true });
  });

  it("does not teleport just because the follow target changes or a frame stalls", () => {
    const result = advanceRudiFollower({ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 1500, y: 0 }, 2000);
    expect(result.teleported).toBe(false);
    expect(result.x).toBeLessThanOrEqual(RUDI_FOLLOW_SETTINGS.maxSpeed * 0.1);
    for (const delta of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(advanceRudiFollower({ x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 1950, y: 0 }, delta))
        .toEqual({ x: 0, y: 0, moving: false, teleported: false });
    }
  });

  it("slows down close to the player without overshooting or oscillating at rest", () => {
    const player = { x: 50, y: 0 }, target = { x: 0, y: 0 };
    let rudi = { x: -20, y: 0 };
    for (let i = 0; i < 100; i++) rudi = advanceRudiFollower(rudi, player, target, 1000 / 60);
    expect(rudi.x).toBeCloseTo(-RUDI_FOLLOW_SETTINGS.stoppingDistance);
    expect(advanceRudiFollower(rudi, player, target, 1000 / 60)).toMatchObject({ x: rudi.x, y: rudi.y, moving: false });
  });

  it("catches up equally over the same elapsed time at 15, 30, 60 and 120 FPS", () => {
    const endpoints = [15, 30, 60, 120].map(fps => {
      let rudi = { x: 0, y: 0 };
      for (let frame = 0; frame < fps; frame++) rudi = advanceRudiFollower(rudi, { x: 500, y: 0 }, { x: 450, y: 0 }, 1000 / fps);
      return rudi.x;
    });
    expect(Math.max(...endpoints) - Math.min(...endpoints)).toBeLessThan(0.01);
  });

  it.each([30, 60, 120])("follows continuous alternating-axis turbo at %i FPS without falling back to teleportation", fps => {
    const player = { x: 100, y: 100, facingDirection: { x: 1, y: 0 } };
    let rudi = { x: 50, y: 86 }, maxGap = 0, teleports = 0;
    // Exercise sustained 430 px/s movement, switching axes every dash (165 ms).
    for (let frame = 0; frame < fps * 12; frame++) {
      const horizontal = Math.floor(frame / fps / 0.165) % 2 === 0;
      player.facingDirection = horizontal ? { x: 1, y: 0 } : { x: 0, y: 1 };
      player.x += player.facingDirection.x * 430 / fps;
      player.y += player.facingDirection.y * 430 / fps;
      const target = { x: player.x - player.facingDirection.x * 50 + player.facingDirection.y * 22,
        y: player.y - player.facingDirection.y * 50 - player.facingDirection.x * 14 };
      const next = advanceRudiFollower(rudi, player, target, 1000 / fps);
      rudi = next;
      if (next.teleported) teleports++;
      maxGap = Math.max(maxGap, Math.hypot(player.x - rudi.x, player.y - rudi.y));
    }
    expect(teleports).toBe(0);
    expect(maxGap).toBeLessThan(260);
  });

  it("uses the same follow offset and keeps targets inside every world size", () => {
    const player = { x: 400, y: 300, facingDirection: { x: 1, y: 0 } };
    for (const [width, height] of [[960, 540], [1280, 720], [1600, 900], [1600, 960]]) {
      expect(rudiFollowTarget(player, { x: 0, y: 0, width: width!, height: height! })).toEqual({ x: 350, y: 286 });
      const atEdge = rudiFollowTarget({ x: 10, y: 12, facingDirection: { x: 1, y: 0 } }, { x: 0, y: 0, width: width!, height: height! });
      expect(atEdge.x).toBeGreaterThanOrEqual(28);
      expect(atEdge.y).toBeGreaterThanOrEqual(35);
    }
  });
});
