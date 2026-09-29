import { describe, expect, it } from "vitest";
import { TurboAxisCooldown } from "../systems/TurboAxisCooldown";

describe("turbo axis cooldown", () => {
  it("permits an immediate right-down-right-down zigzag", () => {
    const cooldown = new TurboAxisCooldown();
    expect(cooldown.tryStart("horizontal", 0, 950)).toBe(true);
    expect(cooldown.tryStart("vertical", 165, 950)).toBe(true);
    expect(cooldown.tryStart("horizontal", 330, 950)).toBe(true);
    expect(cooldown.tryStart("vertical", 495, 950)).toBe(true);
  });

  it("blocks repeated horizontal movement, including a reversal, until ready", () => {
    const cooldown = new TurboAxisCooldown();
    expect(cooldown.tryStart("horizontal", 100, 950)).toBe(true);
    expect(cooldown.tryStart("horizontal", 500, 950)).toBe(false);
    expect(cooldown.tryStart("horizontal", 1049, 950)).toBe(false);
    expect(cooldown.tryStart("horizontal", 1050, 950)).toBe(true);
  });

  it("does not reset the cooldown after a failed repeat", () => {
    const cooldown = new TurboAxisCooldown();
    expect(cooldown.tryStart("vertical", 0, 950)).toBe(true);
    expect(cooldown.tryStart("vertical", 300, 950)).toBe(false);
    expect(cooldown.tryStart("vertical", 950, 950)).toBe(true);
  });
});
