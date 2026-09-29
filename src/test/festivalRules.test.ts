import { describe, expect, it } from "vitest";
import {
  calculatePlanCost,
  calculateSupport,
  DEFAULT_NEGOTIATION_FLAGS,
  groupSupportsPlan,
  type FestivalPlan,
} from "../data/festivalRules";

const broadCompromise: FestivalPlan = {
  endTime: 23,
  stage: "large",
  security: "extra-team",
  cups: "deposit",
  localShare: 75,
};

const localPartnerCompromise: FestivalPlan = {
  endTime: 22,
  stage: "small",
  security: "extra-team",
  cups: "deposit",
  localShare: 75,
};

describe("Festivalregeln", () => {
  it("berechnet die angepassten Kosten zentral und reproduzierbar", () => {
    expect(calculatePlanCost(broadCompromise)).toBe(27_000);
  });

  it("wendet das lokale Partnerpaket nur bei Pfand und mindestens 50 Prozent lokal an", () => {
    expect(
      calculatePlanCost(broadCompromise, {
        ...DEFAULT_NEGOTIATION_FLAGS,
        localPartnerPackage: true,
      }),
    ).toBe(24_000);
  });

  it("bildet die Ausgangsforderungen der vier Gruppen ab", () => {
    expect(groupSupportsPlan("young-list", broadCompromise)).toBe(false);
    expect(groupSupportsPlan("citizens-forum", broadCompromise)).toBe(false);
    expect(groupSupportsPlan("green-local", broadCompromise)).toBe(true);
    expect(groupSupportsPlan("budget-hawks", broadCompromise)).toBe(false);
  });

  it("erkennt eine verhandelte Mehrheit", () => {
    const support = calculateSupport(broadCompromise, {
      ...DEFAULT_NEGOTIATION_FLAGS,
      youngListAccepts23: true,
      localPartnerPackage: true,
    });
    expect(support.votes).toBe(7);
    expect(support.hasMajority).toBe(true);
  });

  it("macht das lokale Partnerpaket zu einem zweiten Lösungsweg", () => {
    const flags = {
      ...DEFAULT_NEGOTIATION_FLAGS,
      localPartnerPackage: true,
    };
    expect(calculatePlanCost(localPartnerCompromise, flags)).toBe(18_000);
    expect(calculateSupport(localPartnerCompromise, flags)).toEqual({
      supporters: ["citizens-forum", "green-local", "budget-hawks"],
      votes: 8,
      hasMajority: true,
    });
  });
});
