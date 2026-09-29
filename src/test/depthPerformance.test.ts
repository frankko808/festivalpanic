import { describe, expect, it, vi } from "vitest";
import { setDepthIfChanged } from "../utils/setDepthIfChanged";

describe("depth performance guard", () => {
  it("does not queue a redundant depth update", () => {
    const actor = {
      depth: 120,
      setDepth: vi.fn(function setDepth(this: { depth: number }, value: number) {
        this.depth = value;
        return this;
      }),
    };

    setDepthIfChanged(actor as never, 120);
    expect(actor.setDepth).not.toHaveBeenCalled();

    setDepthIfChanged(actor as never, 121);
    expect(actor.setDepth).toHaveBeenCalledOnce();
    expect(actor.depth).toBe(121);
  });
});

