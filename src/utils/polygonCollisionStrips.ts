export interface CollisionRect { x: number; y: number; width: number; height: number }
export type PolygonPoint = readonly [number, number];

/** Cover a convex ground polygon with narrow Arcade rectangles, including its edges. */
export function polygonCollisionStrips(points: readonly PolygonPoint[], stripHeight = 8): CollisionRect[] {
  if (points.length < 3 || !Number.isFinite(stripHeight) || stripHeight <= 0) return [];
  const minY = Math.min(...points.map((point) => point[1]));
  const maxY = Math.max(...points.map((point) => point[1]));
  const rectangles: CollisionRect[] = [];
  for (let top = minY; top < maxY; top += stripHeight) {
    const bottom = Math.min(maxY, top + stripHeight);
    const xs: number[] = [];
    points.forEach(([x, y], index) => {
      if (y >= top && y <= bottom) xs.push(x);
      const [nextX, nextY] = points[(index + 1) % points.length]!;
      if (nextY === y) return;
      for (const lineY of [top, bottom]) {
        if (lineY >= Math.min(y, nextY) && lineY <= Math.max(y, nextY)) xs.push(x + (nextX - x) * (lineY - y) / (nextY - y));
      }
    });
    const left = Math.min(...xs), right = Math.max(...xs);
    if (right > left) rectangles.push({ x: (left + right) / 2, y: (top + bottom) / 2, width: right - left, height: bottom - top });
  }
  return rectangles;
}
