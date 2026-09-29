import { describe, expect, it } from "vitest";
import { shouldFlipForHorizontalMotion } from "../utils/motionFacing";

describe("horizontal sprite facing", () => {
  it("flips a left-facing source sprite while it moves right", () => {
    expect(shouldFlipForHorizontalMotion(20, "left")).toBe(true);
    expect(shouldFlipForHorizontalMotion(-20, "left")).toBe(false);
  });

  it("supports assets drawn facing right", () => {
    expect(shouldFlipForHorizontalMotion(20, "right")).toBe(false);
    expect(shouldFlipForHorizontalMotion(-20, "right")).toBe(true);
  });

  it("keeps stationary assets in their native orientation", () => {
    expect(shouldFlipForHorizontalMotion(0, "left")).toBe(false);
  });
});
