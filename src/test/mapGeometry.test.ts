import { describe, expect, it } from "vitest";
import { PARK_POND_WATER } from "../data/mapGeometry";
import { polygonCollisionStrips } from "../utils/polygonCollisionStrips";
import { findWalkableRoute } from "../utils/findWalkableRoute";

describe("park water boundary", () => {
  it("covers the whole visible pond while keeping the path and dry banks free", () => {
    const rectangles = polygonCollisionStrips(PARK_POND_WATER);
    const covered = (x: number, y: number) => rectangles.some(r => x >= r.x - r.width / 2 && x <= r.x + r.width / 2 && y >= r.y - r.height / 2 && y <= r.y + r.height / 2);
    const inside = (x: number, y: number) => {
      let result = false;
      PARK_POND_WATER.forEach(([a, b], i) => {
        const [c, d] = PARK_POND_WATER[(i + 1) % PARK_POND_WATER.length]!;
        if ((b > y) !== (d > y) && x < (c - a) * (y - b) / (d - b) + a) result = !result;
      });
      return result;
    };
    for (let y = 265; y <= 493; y += 2) for (let x = 114; x <= 585; x += 2) {
      if (inside(x, y)) expect(covered(x, y), `water at ${x},${y}`).toBe(true);
    }
    for (const [x, y] of [[345, 250], [100, 382], [600, 380], [390, 510], [605, 415], [560, 520], [440, 555]]) expect(covered(x!, y!)).toBe(false);
  });
});

describe("cat routes around the quay stage", () => {
  it("takes a clear detour instead of crossing the stage", () => {
    const start = { x: 180, y: 340 }, end = { x: 1065, y: 620 };
    const route = findWalkableRoute(start, end, [{ x: 647, y: 450, width: 300, height: 140 }], 1280, 720);
    expect(route.length).toBeGreaterThan(1);
    expect(route.at(-1)).toEqual(end);
    let from = start;
    for (const point of route) {
      for (let t = 0; t <= 1; t += 0.01) {
        const x = from.x + (point.x - from.x) * t, y = from.y + (point.y - from.y) * t;
        expect(x > 485.01 && x < 808.99 && y > 368.01 && y < 531.99).toBe(false);
      }
      from = point;
    }
  });
  it("keeps a direct route in free space and declines destinations in water", () => {
    expect(findWalkableRoute({ x: 1000, y: 350 }, { x: 1065, y: 620 }, [], 1280, 720)).toEqual([{ x: 1065, y: 620 }]);
    expect(findWalkableRoute({ x: 180, y: 340 }, { x: 180, y: 100 }, [{ x: 137, y: 116, width: 274, height: 232 }], 1280, 720)).toEqual([]);
  });
});
