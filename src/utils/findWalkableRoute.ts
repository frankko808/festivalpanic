import type { CollisionRect } from "./polygonCollisionStrips";

export interface RoutePoint { x: number; y: number }

/** Shortest route around rectangular scenery for an animated, non-physics actor. */
export function findWalkableRoute(start: RoutePoint, end: RoutePoint, obstacles: readonly CollisionRect[], width: number, height: number, clearance = 12): RoutePoint[] {
  const boxes = obstacles.map(r => ({ left: r.x - r.width / 2 - clearance, right: r.x + r.width / 2 + clearance,
    top: r.y - r.height / 2 - clearance, bottom: r.y + r.height / 2 + clearance }));
  const free = (p: RoutePoint) => p.x >= clearance && p.y >= clearance && p.x <= width - clearance && p.y <= height - clearance &&
    !boxes.some(b => p.x > b.left && p.x < b.right && p.y > b.top && p.y < b.bottom);
  const clear = (a: RoutePoint, b: RoutePoint): boolean => !boxes.some(box => {
    let enter = 0, leave = 1;
    for (const [origin, delta, min, max] of [[a.x, b.x - a.x, box.left + 0.01, box.right - 0.01], [a.y, b.y - a.y, box.top + 0.01, box.bottom - 0.01]]) {
      if (Math.abs(delta!) < 0.001) { if (origin! <= min! || origin! >= max!) return false; }
      else {
        const t1 = (min! - origin!) / delta!, t2 = (max! - origin!) / delta!;
        enter = Math.max(enter, Math.min(t1, t2)); leave = Math.min(leave, Math.max(t1, t2));
        if (enter >= leave) return false;
      }
    }
    return enter < leave;
  });
  if (!free(start) || !free(end)) return [];
  if (clear(start, end)) return [{ ...end }];
  const nodes = [start, end, ...boxes.flatMap(b => [
    { x: b.left, y: b.top }, { x: b.right, y: b.top }, { x: b.left, y: b.bottom }, { x: b.right, y: b.bottom },
  ]).filter(free)];
  const distances = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set<number>();
  distances[0] = 0;
  for (;;) {
    let current = -1;
    nodes.forEach((_, i) => { if (!visited.has(i) && Number.isFinite(distances[i]) && (current < 0 || distances[i]! < distances[current]!)) current = i; });
    if (current < 0) return [];
    if (current === 1) break;
    visited.add(current);
    nodes.forEach((point, i) => {
      if (visited.has(i) || !clear(nodes[current]!, point)) return;
      const distance = distances[current]! + Math.hypot(point.x - nodes[current]!.x, point.y - nodes[current]!.y);
      if (distance < distances[i]!) { distances[i] = distance; previous[i] = current; }
    });
  }
  const route: RoutePoint[] = [];
  for (let i = 1; i !== 0; i = previous[i]!) route.unshift({ ...nodes[i]! });
  return route;
}
