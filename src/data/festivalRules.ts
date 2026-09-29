export const COUNCIL_MAJORITY = 7;
export const BASE_COST_EUR = 15_000;
export const BUDGET_LIMIT_EUR = 20_000;

export type GroupId = "young-list" | "citizens-forum" | "green-local" | "budget-hawks";
export type EndTime = 22 | 23 | 24;
export type StageSize = "small" | "large" | "newcomer";
export type SecurityLevel = "standard" | "extra-team";
export type CupSystem = "single-use" | "deposit";
export type LocalShare = 0 | 50 | 75;

export interface FestivalPlan {
  endTime: EndTime;
  stage: StageSize;
  security: SecurityLevel;
  cups: CupSystem;
  localShare: LocalShare;
}

export const DEFAULT_FESTIVAL_PLAN: FestivalPlan = {
  endTime: 22,
  stage: "small",
  security: "standard",
  cups: "single-use",
  localShare: 0,
};

export interface NegotiationFlags {
  youngListAccepts23: boolean;
  newcomerStageUnlocked: boolean;
  citizensForumAccepts23: boolean;
  citizensForumAccepts23WithDeposit: boolean;
  greenLocalAccepts50: boolean;
  greenLogisticsDiscount: boolean;
  helperTeamDiscount: boolean;
  localPartnerPackage: boolean;
}

export const DEFAULT_NEGOTIATION_FLAGS: NegotiationFlags = {
  youngListAccepts23: false,
  newcomerStageUnlocked: false,
  citizensForumAccepts23: false,
  citizensForumAccepts23WithDeposit: false,
  greenLocalAccepts50: false,
  greenLogisticsDiscount: false,
  helperTeamDiscount: false,
  localPartnerPackage: false,
};

export const GROUPS: ReadonlyArray<{ id: GroupId; name: string; seats: number }> = [
  { id: "young-list", name: "Junge Liste", seats: 4 },
  { id: "citizens-forum", name: "Bürgerforum", seats: 3 },
  { id: "green-local", name: "Grün & Lokal", seats: 3 },
  { id: "budget-hawks", name: "Sparfüchse", seats: 2 },
];

export const PLAN_OPTION_COSTS = {
  endTime: { 22: 0, 23: 2_000, 24: 4_000 },
  stage: { small: 0, large: 4_000, newcomer: 3_000 },
  security: { standard: 0, "extra-team": 3_000 },
  cups: { "single-use": 0, deposit: 1_000 },
  localShare: { 0: 0, 50: 1_000, 75: 2_000 },
} as const;

export function calculatePlanCost(
  plan: FestivalPlan,
  flags: NegotiationFlags = DEFAULT_NEGOTIATION_FLAGS,
): number {
  let total =
    BASE_COST_EUR +
    PLAN_OPTION_COSTS.endTime[plan.endTime] +
    PLAN_OPTION_COSTS.stage[plan.stage] +
    PLAN_OPTION_COSTS.security[plan.security] +
    PLAN_OPTION_COSTS.cups[plan.cups] +
    PLAN_OPTION_COSTS.localShare[plan.localShare];

  if (flags.helperTeamDiscount && plan.stage === "large") {
    total -= 1_000;
  }
  if (flags.helperTeamDiscount && plan.security === "extra-team") {
    total -= 1_000;
  }
  if (flags.greenLogisticsDiscount && plan.cups === "deposit" && plan.localShare >= 75) {
    total -= 1_000;
  }
  if (flags.localPartnerPackage && plan.cups === "deposit" && plan.localShare >= 50) {
    total -= 3_000;
  }
  return total;
}

export function groupSupportsPlan(
  groupId: GroupId,
  plan: FestivalPlan,
  flags: NegotiationFlags = DEFAULT_NEGOTIATION_FLAGS,
): boolean {
  switch (groupId) {
    case "young-list": {
      const stageAccepted = plan.stage === "large" || (flags.newcomerStageUnlocked && plan.stage === "newcomer");
      const timeAccepted =
        plan.endTime === 24 ||
        ((flags.youngListAccepts23 || flags.newcomerStageUnlocked) && plan.endTime === 23);
      return stageAccepted && timeAccepted;
    }
    case "citizens-forum":
      if (plan.security !== "extra-team") {
        return false;
      }
      if (plan.endTime === 22) {
        return true;
      }
      return (
        plan.endTime === 23 &&
        (flags.citizensForumAccepts23 ||
          (flags.citizensForumAccepts23WithDeposit && plan.cups === "deposit"))
      );
    case "green-local":
      return (
        plan.endTime <= 23 &&
        plan.cups === "deposit" &&
        plan.localShare >= (flags.greenLocalAccepts50 ? 50 : 75)
      );
    case "budget-hawks":
      return calculatePlanCost(plan, flags) <= BUDGET_LIMIT_EUR;
  }
}

export function calculateSupport(
  plan: FestivalPlan,
  flags: NegotiationFlags = DEFAULT_NEGOTIATION_FLAGS,
): { supporters: GroupId[]; votes: number; hasMajority: boolean } {
  const supporters = GROUPS.filter((group) => groupSupportsPlan(group.id, plan, flags)).map(
    (group) => group.id,
  );
  const votes = GROUPS.filter((group) => supporters.includes(group.id)).reduce(
    (sum, group) => sum + group.seats,
    0,
  );
  return { supporters, votes, hasMajority: votes >= COUNCIL_MAJORITY };
}
