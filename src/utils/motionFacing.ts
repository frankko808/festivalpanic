export type NativeHorizontalFacing = "left" | "right";

export function shouldFlipForHorizontalMotion(
  deltaX: number,
  nativeFacing: NativeHorizontalFacing = "left",
): boolean {
  if (deltaX === 0) return false;
  const movingRight = deltaX > 0;
  return nativeFacing === "left" ? movingRight : !movingRight;
}

export function faceHorizontalMotion<T extends { setFlipX(value: boolean): T }>(
  target: T,
  deltaX: number,
  nativeFacing: NativeHorizontalFacing = "left",
): T {
  return target.setFlipX(shouldFlipForHorizontalMotion(deltaX, nativeFacing));
}
