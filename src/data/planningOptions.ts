import {
  PLAN_OPTION_COSTS,
  type EndTime,
  type FestivalPlan,
  type LocalShare,
  type SecurityLevel,
  type StageSize,
  type CupSystem,
} from "./festivalRules";

export type PlanningModuleId = keyof FestivalPlan;
export type PlanningOptionValue = EndTime | StageSize | SecurityLevel | CupSystem | LocalShare;

export interface PlanningOption {
  value: PlanningOptionValue;
  label: string;
  extraCost: number;
}

export interface PlanningModule {
  id: PlanningModuleId;
  label: string;
  options: readonly PlanningOption[];
}

export const PLANNING_MODULES: readonly PlanningModule[] = [
  {
    id: "endTime",
    label: "ENDE",
    options: [
      { value: 22, label: "22 Uhr", extraCost: PLAN_OPTION_COSTS.endTime[22] },
      { value: 23, label: "23 Uhr", extraCost: PLAN_OPTION_COSTS.endTime[23] },
      { value: 24, label: "24 Uhr", extraCost: PLAN_OPTION_COSTS.endTime[24] },
    ],
  },
  {
    id: "stage",
    label: "BÜHNE",
    options: [
      { value: "small", label: "Kleine Bühne", extraCost: PLAN_OPTION_COSTS.stage.small },
      { value: "large", label: "Große Bühne", extraCost: PLAN_OPTION_COSTS.stage.large },
    ],
  },
  {
    id: "security",
    label: "SICHERHEIT",
    options: [
      { value: "standard", label: "Standard", extraCost: PLAN_OPTION_COSTS.security.standard },
      {
        value: "extra-team",
        label: "Zusatzteam",
        extraCost: PLAN_OPTION_COSTS.security["extra-team"],
      },
    ],
  },
  {
    id: "cups",
    label: "BECHERSYSTEM",
    options: [
      {
        value: "single-use",
        label: "Einwegbecher",
        extraCost: PLAN_OPTION_COSTS.cups["single-use"],
      },
      { value: "deposit", label: "Pfandsystem", extraCost: PLAN_OPTION_COSTS.cups.deposit },
    ],
  },
  {
    id: "localShare",
    label: "LOKALE STÄNDE",
    options: [
      { value: 0, label: "Keine Vorgabe", extraCost: PLAN_OPTION_COSTS.localShare[0] },
      { value: 50, label: "Mindestens 50 %", extraCost: PLAN_OPTION_COSTS.localShare[50] },
      { value: 75, label: "Mindestens 75 %", extraCost: PLAN_OPTION_COSTS.localShare[75] },
    ],
  },
];

export function updatePlanModule(
  plan: FestivalPlan,
  moduleId: PlanningModuleId,
  value: PlanningOptionValue,
): FestivalPlan {
  return { ...plan, [moduleId]: value } as FestivalPlan;
}
