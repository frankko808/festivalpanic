export type TurboAxis = "horizontal" | "vertical";

/** Repeating one axis waits; switching axes permits an immediate zigzag dash. */
export class TurboAxisCooldown {
  private lastAxis?: TurboAxis;
  private repeatReadyAt = 0;

  tryStart(axis: TurboAxis, now: number, cooldownMs: number): boolean {
    if (axis === this.lastAxis && now < this.repeatReadyAt) return false;
    this.lastAxis = axis;
    this.repeatReadyAt = now + cooldownMs;
    return true;
  }
}
