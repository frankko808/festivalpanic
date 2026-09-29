import { describe, expect, it } from "vitest";
import { getFestivalStagePresentation } from "../data/festivalPresentation";
import { DEFAULT_FESTIVAL_PLAN } from "../data/festivalRules";

describe("festival presentation", () => {
  it("fills the single small stage with a visible crowd", () => {
    const presentation = getFestivalStagePresentation(DEFAULT_FESTIVAL_PLAN);
    expect(presentation.stageCount).toBe(1);
    expect(presentation.mainCrowd).toBeGreaterThanOrEqual(18);
    expect(presentation.sideCrowd).toBe(0);
  });

  it.each(["large", "newcomer"] as const)("uses two populated performance areas for %s", (stage) => {
    const presentation = getFestivalStagePresentation({ ...DEFAULT_FESTIVAL_PLAN, stage });
    expect(presentation.stageCount).toBe(2);
    expect(presentation.mainCrowd).toBeGreaterThan(0);
    expect(presentation.sideCrowd).toBeGreaterThan(0);
    expect(presentation.sideLabel).toBeTruthy();
  });
});
